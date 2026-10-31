import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, SubscriptionStatus, InvoiceStatus } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
  try {
    await requireAuth([Role.ADMIN, Role.STAFF]);
    const { searchParams } = new URL(req.url);

    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const startDate = startOfDay(subDays(new Date(), daysParam));
    const endDate = endOfDay(new Date());
    const exportCsv = searchParams.get('format') === 'csv';

    // 1. Subscription count by status
    const subsByStatusRaw = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { grandTotal: true },
    });
    const subscriptionsByStatus = subsByStatusRaw.map((s) => ({
      status: s.status,
      count: s._count.id,
      mrrEstimate: Number(s._sum.grandTotal || 0),
    }));

    // 2. New & Cancelled subscriptions in range
    const [newSubs, closedSubs] = await Promise.all([
      prisma.subscription.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.CLOSED,
          updatedAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // 3. Payment Method Breakdown
    const paymentMethodsRaw = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
      _sum: { amount: true },
    });
    const paymentMethodBreakdown = paymentMethodsRaw.map((p) => ({
      method: p.paymentMethod,
      count: p._count.id,
      totalAmount: Number(p._sum.amount || 0),
    }));

    // 4. Overdue Invoices
    const now = new Date();
    const overdueInvoicesRaw = await prisma.invoice.findMany({
      where: {
        dueDate: { lt: now },
        outstandingBalance: { gt: 0 },
        status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.DRAFT] },
      },
      include: { customer: true },
      orderBy: { dueDate: 'asc' },
    });
    const overdueInvoices = overdueInvoicesRaw.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer.name,
      dueDate: inv.dueDate.toISOString(),
      grandTotal: Number(inv.grandTotal),
      amountPaid: Number(inv.amountPaid),
      outstandingBalance: Number(inv.outstandingBalance),
    }));

    // 5. Product & Plan Performance
    const plansRaw = await prisma.plan.findMany({
      include: {
        product: true,
        _count: {
          select: { subscriptions: true },
        },
      },
    });
    const planPerformance = plansRaw.map((p) => ({
      id: p.id,
      planName: p.name,
      productName: p.product.name,
      billingFrequency: p.billingFrequency,
      activeSubscribers: p._count.subscriptions,
      planPrice: Number(p.price),
    }));

    // 6. Discount Usage Report
    const discountsRaw = await prisma.discountRule.findMany({
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });
    const discountUsageReport = discountsRaw.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      type: d.type,
      value: Number(d.value),
      maxUses: d.maxUses,
      currentUses: d.currentUses,
      totalTimesApplied: d._count.usages,
    }));

    // 7. Accounting Reconciliation Summary
    const [totalInvoicedSum, totalCollectedSum] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { grandTotal: true, outstandingBalance: true, totalTax: true, totalDiscount: true },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
    ]);

    const financialOverview = {
      totalBilledRevenue: Number(totalInvoicedSum._sum.grandTotal || 0),
      totalCollectedPayments: Number(totalCollectedSum._sum.amount || 0),
      totalOutstandingReceivables: Number(totalInvoicedSum._sum.outstandingBalance || 0),
      totalTaxAccrued: Number(totalInvoicedSum._sum.totalTax || 0),
      totalDiscountsGranted: Number(totalInvoicedSum._sum.totalDiscount || 0),
    };

    // If CSV export requested:
    if (exportCsv) {
      const csvRows = [
        ['Invoice Number', 'Customer', 'Due Date', 'Grand Total', 'Amount Paid', 'Outstanding Balance'],
        ...overdueInvoices.map((inv) => [
          inv.invoiceNumber,
          inv.customerName,
          inv.dueDate.slice(0, 10),
          inv.grandTotal.toString(),
          inv.amountPaid.toString(),
          inv.outstandingBalance.toString(),
        ]),
      ];
      const csvContent = csvRows.map((e) => e.join(',')).join('\n');
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="brightloop-overdue-report.csv"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionsByStatus,
        periodMetrics: {
          days: daysParam,
          newSubscriptions: newSubs,
          closedSubscriptions: closedSubs,
        },
        paymentMethodBreakdown,
        overdueInvoices,
        planPerformance,
        discountUsageReport,
        financialOverview,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
