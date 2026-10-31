import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, BillingFrequency, Prisma } from '@prisma/client';

const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  billingFrequency: z.nativeEnum(BillingFrequency).optional(),
  minQuantity: z.number().int().min(1).optional(),
  availableFrom: z.string().optional().nullable(),
  availableUntil: z.string().optional().nullable(),
  autoClose: z.boolean().optional(),
  canEarlyClose: z.boolean().optional(),
  canPause: z.boolean().optional(),
  canRenew: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth([Role.ADMIN, Role.STAFF]);
    const { id } = await params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        product: { include: { variants: true } },
        subscriptions: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: plan });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth([Role.ADMIN]);
    const { id } = await params;

    const body = await req.json();
    const parsed = updatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        ...data,
        price: data.price !== undefined ? new Prisma.Decimal(data.price) : undefined,
        availableFrom: data.availableFrom !== undefined ? (data.availableFrom ? new Date(data.availableFrom) : null) : undefined,
        availableUntil: data.availableUntil !== undefined ? (data.availableUntil ? new Date(data.availableUntil) : null) : undefined,
      },
      include: { product: true },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Plan updated successfully' });
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

    // Check if plan is being used by subscriptions
    const subCount = await prisma.subscription.count({ where: { planId: id } });
    if (subCount > 0) {
      // Soft deactivate
      const deactivated = await prisma.plan.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        data: deactivated,
        message: `Plan has ${subCount} associated subscriptions and was deactivated instead of deleted.`,
      });
    }

    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
