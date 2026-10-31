import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, ProductType, Prisma } from '@prisma/client';

const updateTaxSchema = z.object({
  name: z.string().min(2).optional(),
  rate: z.number().min(0).optional(),
  description: z.string().optional().nullable(),
  applicableProductType: z.nativeEnum(ProductType).optional().nullable(),
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
    const parsed = updateTaxSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { rate, ...rest } = parsed.data;

    const updated = await prisma.taxRule.update({
      where: { id },
      data: {
        ...rest,
        rate: rate !== undefined ? new Prisma.Decimal(rate) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Tax rule updated successfully' });
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

    const updated = await prisma.taxRule.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Tax rule deactivated.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
