import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, SubscriptionStatus, InvoiceStatus } from '@prisma/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
  try {
    await requireAuth([Role.ADMIN, Role.STAFF]);
    const { searchParams } = new URL(req.url);

    // Date range filter (default: last 30 days)
    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const startDate = startOfDay(subDays(new Date(), daysParam));
    const endDate = endOfDay(new Date());
    const now = new Date();

    // 1. Total Active Subscriptions
    const totalActiveSubscriptions = await prisma.subscription.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    // 2. New Subscriptions during period
    const newSubscriptionsCount = await prisma.subscription.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // 3. Revenue Collected during period (from Payments)
    const paymentsInPeriod = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate },
      },
      select: { amount: true, paymentDate: true },
    });
    const revenueCollected = paymentsInPeriod.reduce((sum, p) => sum + Number(p.amount), 0);

    // 4. Outstanding Invoice Balance (across all active unpaid invoices)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.DRAFT] },
        outstandingBalance: { gt: 0 },
      },
      select: {
        id: true,
        outstandingBalance: true,
        dueDate: true,
        status: true,
      },
    });
    const outstandingBalance = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.outstandingBalance), 0);

    // 5. Overdue Invoice Count and Amount
    const overdueInvoices = unpaidInvoices.filter((inv) => new Date(inv.dueDate) < now);
    const overdueInvoicesCount = overdueInvoices.length;
    const overdueInvoicesAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.outstandingBalance), 0);

    // 6. Upcoming Renewals (next 14 days)
    const renewalCutoff = new Date();
    renewalCutoff.setDate(renewalCutoff.getDate() + 14);
    const upcomingRenewalsCount = await prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: { gte: now, lte: renewalCutoff },
      },
    });

    // 7. Recent Payments (last 5)
    const recentPaymentsRaw = await prisma.payment.findMany({
      take: 5,
      orderBy: { paymentDate: 'desc' },
      include: { customer: true },
    });
    const recentPayments = recentPaymentsRaw.map((p) => ({
      id: p.id,
      paymentReference: p.paymentReference,
      customerName: p.customer.name,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate.toISOString(),
    }));

    // 8. Recent Subscriptions (last 5)
    const recentSubsRaw = await prisma.subscription.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, plan: true },
    });
    const recentSubscriptions = recentSubsRaw.map((s) => ({
      id: s.id,
      subscriptionNumber: s.subscriptionNumber,
      customerName: s.customer.name,
      planName: s.plan.name,
      grandTotal: Number(s.grandTotal),
      status: s.status,
      startDate: s.startDate.toISOString(),
    }));

    // 9. Invoice Status Breakdown
    const invoiceStatusCounts = await prisma.invoice.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { grandTotal: true },
    });
    const invoiceStatusBreakdown = invoiceStatusCounts.map((sc) => ({
      status: sc.status,
      count: sc._count.id,
      total: Number(sc._sum.grandTotal || 0),
    }));

    // 10. Revenue Trend: Build aggregated time-series buckets (collected vs invoiced)
    const invoicesInPeriod = await prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: startDate, lte: endDate },
      },
      select: { invoiceDate: true, grandTotal: true },
    });

    // Bucket by intervals (e.g. daily or weekly depending on days)
    const dateMap = new Map<string, { collected: number; invoiced: number }>();
    const dayStep = daysParam > 60 ? 7 : 1;

    for (let i = 0; i <= daysParam; i += dayStep) {
      const d = subDays(new Date(), daysParam - i);
      const key = format(d, 'MMM dd');
      dateMap.set(key, { collected: 0, invoiced: 0 });
    }

    for (const p of paymentsInPeriod) {
      const key = format(new Date(p.paymentDate), 'MMM dd');
      if (dateMap.has(key)) {
        dateMap.get(key)!.collected += Number(p.amount);
      }
    }

    for (const inv of invoicesInPeriod) {
      const key = format(new Date(inv.invoiceDate), 'MMM dd');
      if (dateMap.has(key)) {
        dateMap.get(key)!.invoiced += Number(inv.grandTotal);
      }
    }

    const revenueTrend = Array.from(dateMap.entries()).map(([date, vals]) => ({
      date,
      collected: vals.collected,
      invoiced: vals.invoiced,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalActiveSubscriptions,
        newSubscriptionsCount,
        revenueCollected,
        outstandingBalance,
        overdueInvoicesCount,
        overdueInvoicesAmount,
        upcomingRenewalsCount,
        revenueTrend,
        invoiceStatusBreakdown,
        recentPayments,
        recentSubscriptions,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
