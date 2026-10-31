import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  companyName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Strict ownership check: Customers can only access their own profile!
    if (session.role === Role.CUSTOMER && session.customerId !== id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only access your own customer profile.' },
        { status: 403 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
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
    const session = await requireAuth([Role.ADMIN, Role.STAFF]);
    const { id } = await params;

    const body = await req.json();
    const parsed = updateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated, message: 'Customer updated successfully.' });
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

    // Check if customer has active invoices or subscriptions
    const invoiceCount = await prisma.invoice.count({ where: { customerId: id } });

    // Use archival / soft deletion to preserve financial audit trail
    const customer = await prisma.customer.update({
      where: { id },
      data: { isArchived: true },
    });

    return NextResponse.json({
      success: true,
      message: `Customer archived successfully. Preserved ${invoiceCount} historical invoice(s).`,
      data: customer,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
