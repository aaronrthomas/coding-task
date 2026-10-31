import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, PaymentMethod, InvoiceStatus, Prisma } from '@prisma/client';
import { roundMoney } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  transactionRef: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentDate: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const invoiceId = searchParams.get('invoiceId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') as PaymentMethod | null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));

    const where: Prisma.PaymentWhereInput = {
      // Customer isolation check
      customerId: session.role === Role.CUSTOMER ? session.customerId! : customerId,
      invoiceId: invoiceId || undefined,
      paymentMethod: paymentMethod || undefined,
    };

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: true,
          invoice: true,
          recordedByUser: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: payments,
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

export async function POST(req: Request) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = recordPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { invoiceId, amount, paymentMethod, transactionRef, notes, paymentDate } = parsed.data;

    // Execute payment and invoice reconciliation inside a database transaction
    const payment = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { customer: true },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Customer ownership validation: customers can only pay for their own invoices
      if (session.role === Role.CUSTOMER && invoice.customerId !== session.customerId) {
        throw new Error('FORBIDDEN: You can only pay invoices belonging to your customer profile.');
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new Error('Cannot record payment against a CANCELLED invoice.');
      }

      const outstanding = Number(invoice.outstandingBalance);
      if (outstanding <= 0 && invoice.status === InvoiceStatus.PAID) {
        throw new Error('Invoice is already fully paid.');
      }

      if (amount > outstanding + 0.001) {
        throw new Error(
          `Payment amount (${amount}) exceeds the remaining outstanding balance of ${outstanding}.`
        );
      }

      // Generate payment reference
      const count = await tx.payment.count();
      const year = new Date().getFullYear();
      const paymentReference = `PAY-${year}-${String(count + 1).padStart(5, '0')}`;

      // Create Payment record
      const newPayment = await tx.payment.create({
        data: {
          paymentReference,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: new Prisma.Decimal(amount),
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod,
          transactionRef,
          notes,
          recordedByUserId: session.id,
        },
        include: { customer: true, invoice: true },
      });

      // Recalculate invoice totals
      const newAmountPaid = roundMoney(Number(invoice.amountPaid) + amount);
      const newOutstanding = roundMoney(Number(invoice.grandTotal) - newAmountPaid);
      const newStatus = newOutstanding <= 0 ? InvoiceStatus.PAID : invoice.status;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: new Prisma.Decimal(newAmountPaid),
          outstandingBalance: new Prisma.Decimal(Math.max(0, newOutstanding)),
          status: newStatus,
        },
      });

      return newPayment;
    });

    await logAudit({
      userId: session.id,
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
      details: {
        paymentReference: payment.paymentReference,
        invoiceNumber: payment.invoice.invoiceNumber,
        amount,
        method: paymentMethod,
      },
    });

    return NextResponse.json({
      success: true,
      data: payment,
      message: `Payment of ₹${amount.toLocaleString()} recorded successfully against invoice ${payment.invoice.invoiceNumber}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 400;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
