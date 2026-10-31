import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, InvoiceStatus, Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as InvoiceStatus | null;
    const isOverdueOnly = searchParams.get('overdue') === 'true';
    const customerId = searchParams.get('customerId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));

    const now = new Date();

    const where: Prisma.InvoiceWhereInput = {
      // Customer ownership isolation
      customerId: session.role === Role.CUSTOMER ? session.customerId! : customerId,
      status: status || undefined,
      dueDate: isOverdueOnly ? { lt: now } : undefined,
      outstandingBalance: isOverdueOnly ? { gt: 0 } : undefined,
      OR: search
        ? [
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
            { subscription: { subscriptionNumber: { contains: search, mode: 'insensitive' } } },
          ]
        : undefined,
    };

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { invoiceDate: 'desc' },
        include: {
          customer: true,
          subscription: true,
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
          items: true,
        },
      }),
    ]);

    // Enhance records with derived overdue flag
    const formattedInvoices = invoices.map((inv) => {
      const isOverdue =
        inv.status !== InvoiceStatus.PAID &&
        inv.status !== InvoiceStatus.CANCELLED &&
        new Date(inv.dueDate) < now &&
        Number(inv.outstandingBalance) > 0;

      return {
        ...inv,
        isOverdue,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: formattedInvoices,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
