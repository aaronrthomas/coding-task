import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, QuotationStatus, SubscriptionStatus, Prisma } from '@prisma/client';
import { calculateNextBillingDate } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

const convertSchema = z.object({
  planId: z.string().min(1, 'Target plan is required'),
  startDate: z.string().optional(),
  autoClose: z.boolean().default(false),
  expiryDate: z.string().optional().nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.ADMIN, Role.STAFF]);
    const { id } = await params;

    const body = await req.json();
    const parsed = convertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { planId, autoClose } = parsed.data;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    if (quotation.status === QuotationStatus.CANCELLED) {
      return NextResponse.json({ success: false, error: 'Cannot convert a cancelled quotation' }, { status: 400 });
    }

    if (quotation.convertedSubscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Quotation has already been converted to a subscription.' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Target plan not found' }, { status: 400 });
    }

    // Generate unique subscription number
    const subCount = await prisma.subscription.count();
    const year = new Date().getFullYear();
    const subscriptionNumber = `SUB-${year}-${String(subCount + 1).padStart(5, '0')}`;

    const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : new Date();
    const expiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null;
    const nextBillingDate = calculateNextBillingDate(startDate, plan.billingFrequency);

    // Create Subscription and update Quotation inside transaction
    const subscription = await prisma.$transaction(async (tx) => {
      const newSub = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          planId: plan.id,
          status: SubscriptionStatus.CONFIRMED,
          startDate,
          expiryDate,
          billingFrequency: plan.billingFrequency,
          nextBillingDate,
          paymentTerms: 'Due upon receipt',
          currency: 'INR',
          subtotal: quotation.subtotal,
          taxTotal: quotation.taxTotal,
          discountTotal: quotation.discountTotal,
          grandTotal: quotation.grandTotal,
          autoClose: autoClose || plan.autoClose,
          items: {
            create: quotation.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: new Prisma.Decimal(Number(item.unitPrice) * item.quantity),
            })),
          },
        },
        include: {
          customer: true,
          plan: true,
          items: { include: { product: true, variant: true } },
        },
      });

      // Update Quotation status to ACCEPTED
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: QuotationStatus.ACCEPTED,
          convertedSubscriptionId: newSub.id,
        },
      });

      // Record initial subscription audit history
      await tx.subscriptionStatusHistory.create({
        data: {
          subscriptionId: newSub.id,
          fromStatus: null,
          toStatus: SubscriptionStatus.CONFIRMED,
          reason: `Converted from quotation ${quotation.quotationNumber}`,
          changedByUserId: session.id,
        },
      });

      return newSub;
    });

    await logAudit({
      userId: session.id,
      action: 'CONVERT_QUOTATION_TO_SUBSCRIPTION',
      entity: 'Subscription',
      entityId: subscription.id,
      details: { quotationNumber: quotation.quotationNumber, subscriptionNumber: subscription.subscriptionNumber },
    });

    return NextResponse.json({
      success: true,
      data: subscription,
      message: `Quotation converted to Subscription ${subscription.subscriptionNumber}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
