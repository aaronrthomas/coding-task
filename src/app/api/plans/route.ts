import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, BillingFrequency, Prisma } from '@prisma/client';

const createPlanSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  name: z.string().min(2, 'Plan name is required'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Price must be positive'),
  billingFrequency: z.nativeEnum(BillingFrequency).default(BillingFrequency.MONTHLY),
  minQuantity: z.number().int().min(1).default(1),
  availableFrom: z.string().optional().nullable(),
  availableUntil: z.string().optional().nullable(),
  autoClose: z.boolean().default(false),
  canEarlyClose: z.boolean().default(true),
  canPause: z.boolean().default(true),
  canRenew: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    // Both Admin and Staff can view plans
    await requireAuth([Role.ADMIN, Role.STAFF]);
    const { searchParams } = new URL(req.url);

    const productId = searchParams.get('productId') || undefined;
    const frequency = searchParams.get('frequency') as BillingFrequency | null;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: Prisma.PlanWhereInput = {
      productId,
      billingFrequency: frequency || undefined,
      isActive: activeOnly ? true : undefined,
    };

    const plans = await prisma.plan.findMany({
      where,
      include: {
        product: true,
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: plans });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: Request) {
  try {
    // Only Admin can configure plans
    await requireAuth([Role.ADMIN]);

    const body = await req.json();
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate available dates if provided
    let fromDate: Date | null = null;
    let untilDate: Date | null = null;
    if (data.availableFrom) fromDate = new Date(data.availableFrom);
    if (data.availableUntil) untilDate = new Date(data.availableUntil);

    if (fromDate && untilDate && fromDate > untilDate) {
      return NextResponse.json(
        { success: false, error: 'Available From date cannot be after Available Until date.' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        productId: data.productId,
        name: data.name,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        billingFrequency: data.billingFrequency,
        minQuantity: data.minQuantity,
        availableFrom: fromDate,
        availableUntil: untilDate,
        autoClose: data.autoClose,
        canEarlyClose: data.canEarlyClose,
        canPause: data.canPause,
        canRenew: data.canRenew,
        isActive: data.isActive,
      },
      include: { product: true },
    });

    return NextResponse.json({ success: true, data: plan, message: 'Plan created successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
