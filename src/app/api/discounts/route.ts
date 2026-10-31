import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, DiscountType, Prisma } from '@prisma/client';

const createDiscountSchema = z.object({
  code: z.string().min(2, 'Discount code is required').toUpperCase(),
  name: z.string().min(2, 'Discount name is required'),
  type: z.nativeEnum(DiscountType).default(DiscountType.PERCENTAGE),
  value: z.number().min(0, 'Discount value must be positive'),
  minPurchase: z.number().optional().nullable(),
  minQuantity: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  isWholeSubscription: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAuth([Role.ADMIN, Role.STAFF]);

    const discounts = await prisma.discountRule.findMany({
      include: {
        product: true,
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: discounts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth([Role.ADMIN]);

    const body = await req.json();
    const parsed = createDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.discountRule.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Discount code '${data.code}' already exists.` },
        { status: 409 }
      );
    }

    let start: Date | null = null;
    let end: Date | null = null;
    if (data.startDate) start = new Date(data.startDate);
    if (data.endDate) end = new Date(data.endDate);

    if (start && end && start > end) {
      return NextResponse.json(
        { success: false, error: 'Start date cannot be after end date.' },
        { status: 400 }
      );
    }

    const discount = await prisma.discountRule.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        value: new Prisma.Decimal(data.value),
        minPurchase: data.minPurchase !== null && data.minPurchase !== undefined ? new Prisma.Decimal(data.minPurchase) : null,
        minQuantity: data.minQuantity,
        maxUses: data.maxUses,
        startDate: start,
        endDate: end,
        productId: data.productId || null,
        isWholeSubscription: data.isWholeSubscription,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ success: true, data: discount, message: 'Discount rule created successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
