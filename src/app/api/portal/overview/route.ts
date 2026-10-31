import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await requireAuth();

    if (!session.customerId) {
      return NextResponse.json(
        { success: false, error: 'No associated customer profile found for this account.' },
        { status: 404 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      include: {
        subscriptions: {
          include: {
            plan: true,
            items: { include: { product: true, variant: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: { payments: true },
          orderBy: { invoiceDate: 'desc' },
        },
        payments: {
          include: { invoice: true },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const activeSubscriptions = customer.subscriptions.filter((s) => s.status === 'ACTIVE');
    const unpaidInvoices = customer.invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
    const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.outstandingBalance), 0);
    const totalPaid = customer.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          companyName: customer.companyName,
          phone: customer.phone,
          billingAddress: customer.billingAddress,
          taxId: customer.taxId,
          createdAt: customer.createdAt,
        },
        metrics: {
          activeSubscriptionsCount: activeSubscriptions.length,
          totalSubscriptionsCount: customer.subscriptions.length,
          unpaidInvoicesCount: unpaidInvoices.length,
          totalOutstanding,
          totalPaid,
        },
        subscriptions: customer.subscriptions,
        invoices: customer.invoices,
        payments: customer.payments,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
