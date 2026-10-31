import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: { include: { product: true } },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          include: { payments: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { changedByUser: { select: { id: true, name: true, role: true } } },
        },
        billingRecords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
    }

    // Ownership check for customer
    if (session.role === Role.CUSTOMER && subscription.customerId !== session.customerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: subscription });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
