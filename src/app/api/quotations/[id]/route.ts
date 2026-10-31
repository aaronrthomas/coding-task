import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, QuotationStatus } from '@prisma/client';

const updateQuotationStatusSchema = z.object({
  status: z.nativeEnum(QuotationStatus),
  notes: z.string().optional().nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    if (session.role === Role.CUSTOMER && quotation.customerId !== session.customerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: quotation });
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
    const parsed = updateQuotationStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { status, notes } = parsed.data;

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
      },
      include: { customer: true, items: true },
    });

    return NextResponse.json({ success: true, data: updated, message: `Quotation updated to ${status}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
