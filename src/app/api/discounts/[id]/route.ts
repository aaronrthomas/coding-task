import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, DiscountType, Prisma } from '@prisma/client';

const updateDiscountSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.nativeEnum(DiscountType).optional(),
  value: z.number().min(0).optional(),
  minPurchase: z.number().optional().nullable(),
  minQuantity: z.number().int().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  isWholeSubscription: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth([Role.ADMIN]);
    const { id } = await params;

    const body = await req.json();
    const parsed = updateDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    const updated = await prisma.discountRule.update({
      where: { id },
      data: {
        ...data,
        value: data.value !== undefined ? new Prisma.Decimal(data.value) : undefined,
        minPurchase: data.minPurchase !== undefined ? (data.minPurchase !== null ? new Prisma.Decimal(data.minPurchase) : null) : undefined,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Discount rule updated successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth([Role.ADMIN]);
    const { id } = await params;

    const updated = await prisma.discountRule.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Discount rule deactivated.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
