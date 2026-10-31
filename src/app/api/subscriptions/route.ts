import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, SubscriptionStatus, Prisma, BillingFrequency } from '@prisma/client';
import { calculateNextBillingDate, roundMoney } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

const subscriptionItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).default(1),
});

const createSubscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  planId: z.string().min(1, 'Plan is required'),
  startDate: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  autoClose: z.boolean().default(false),
  paymentTerms: z.string().default('Due upon receipt'),
  items: z.array(subscriptionItemSchema).min(1, 'At least one line item is required'),
});

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as SubscriptionStatus | null;
    const customerId = searchParams.get('customerId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));

    const where: Prisma.SubscriptionWhereInput = {
      // If Customer role, restrict exclusively to their own customer ID!
      customerId: session.role === Role.CUSTOMER ? session.customerId! : customerId,
      status: status || undefined,
      OR: search
        ? [
            { subscriptionNumber: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
            { plan: { name: { contains: search, mode: 'insensitive' } } },
          ]
        : undefined,
    };

    const [total, subscriptions] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          plan: true,
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          _count: {
            select: { invoices: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: subscriptions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth([Role.ADMIN, Role.STAFF]);

    const body = await req.json();
    const parsed = createSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { customerId, planId, items, autoClose, paymentTerms } = parsed.data;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 400 });
    }

    const count = await prisma.subscription.count();
    const year = new Date().getFullYear();
    const subscriptionNumber = `SUB-${year}-${String(count + 1).padStart(5, '0')}`;

    const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : new Date();
    const expiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null;
    const nextBillingDate = calculateNextBillingDate(startDate, plan.billingFrequency);

    // Calculate line items on server
    let subtotal = 0;
    let totalTax = 0;

    interface CalculatedSubItem {
      productId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }

    const calculatedItems: CalculatedSubItem[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: true,
          taxRules: { include: { taxRule: true } },
        },
      });

      if (!product) {
        return NextResponse.json({ success: false, error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      let unitPrice = Number(product.salesPrice);
      let variantId: string | null = null;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          unitPrice += Number(variant.priceAdjustment);
          variantId = variant.id;
        }
      }

      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      // Check applicable taxes
      if (product.taxRules && product.taxRules.length > 0) {
        const activeTax = product.taxRules.find((tr) => tr.taxRule.isActive);
        if (activeTax) {
          const rate = Number(activeTax.taxRule.rate);
          totalTax += roundMoney((itemSubtotal * rate) / 100);
        }
      }

      calculatedItems.push({
        productId: product.id,
        variantId,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    const grandTotal = roundMoney(subtotal + totalTax);

    const subscription = await prisma.$transaction(async (tx) => {
      const created = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId,
          planId: plan.id,
          status: SubscriptionStatus.CONFIRMED,
          startDate,
          expiryDate,
          billingFrequency: plan.billingFrequency,
          nextBillingDate,
          paymentTerms,
          currency: 'INR',
          subtotal: new Prisma.Decimal(subtotal),
          taxTotal: new Prisma.Decimal(totalTax),
          discountTotal: new Prisma.Decimal(0),
          grandTotal: new Prisma.Decimal(grandTotal),
          autoClose: autoClose || plan.autoClose,
          items: {
            create: calculatedItems.map((ci) => ({
              productId: ci.productId,
              variantId: ci.variantId,
              quantity: ci.quantity,
              unitPrice: new Prisma.Decimal(ci.unitPrice),
              subtotal: new Prisma.Decimal(ci.subtotal),
            })),
          },
        },
        include: {
          customer: true,
          plan: true,
          items: { include: { product: true, variant: true } },
        },
      });

      await tx.subscriptionStatusHistory.create({
        data: {
          subscriptionId: created.id,
          fromStatus: null,
          toStatus: SubscriptionStatus.CONFIRMED,
          reason: 'Initial creation',
          changedByUserId: session.id,
        },
      });

      return created;
    });

    await logAudit({
      userId: session.id,
      action: 'CREATE_SUBSCRIPTION',
      entity: 'Subscription',
      entityId: subscription.id,
      details: { subscriptionNumber: subscription.subscriptionNumber, plan: plan.name },
    });

    return NextResponse.json({
      success: true,
      data: subscription,
      message: 'Subscription created successfully',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
