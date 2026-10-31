import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, InvoiceStatus } from '@prisma/client';
import { z } from 'zod';

const updateInvoiceSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: {
          include: { plan: true },
        },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            recordedByUser: { select: { id: true, name: true, role: true } },
          },
        },
        discountUsages: {
          include: { discountRule: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Customer isolation check
    if (session.role === Role.CUSTOMER && invoice.customerId !== session.customerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const isOverdue =
      invoice.status !== InvoiceStatus.PAID &&
      invoice.status !== InvoiceStatus.CANCELLED &&
      new Date(invoice.dueDate) < now &&
      Number(invoice.outstandingBalance) > 0;

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        isOverdue,
      },
    });
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
    await requireAuth([Role.ADMIN, Role.STAFF]);
    const { id } = await params;

    const body = await req.json();
    const parsed = updateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { status, notes } = parsed.data;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Rule: An invoice must never be marked PAID unless recorded payments satisfy the outstanding balance!
    if (status === InvoiceStatus.PAID && Number(invoice.outstandingBalance) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot mark invoice as PAID while it has an outstanding balance of ${invoice.outstandingBalance}. Record a payment first.`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: { customer: true, items: true, payments: true },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Invoice updated successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
