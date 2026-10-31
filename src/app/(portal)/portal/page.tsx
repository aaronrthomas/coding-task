'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Repeat,
  Receipt,
  CreditCard,
  User,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';

export default function CustomerPortalOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/overview');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.error || 'Failed to load account overview');
      }
    } catch {
      toast.error('Network error loading portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading your account portal...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-500">Customer profile not found.</p>
      </div>
    );
  }

  const { customer, metrics, subscriptions, invoices, payments } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome, {customer.name}
        </h1>
        <p className="text-sm text-slate-500">
          Manage your Brightloop software subscriptions, renewals, invoices, and payments
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metrics.activeSubscriptionsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.totalSubscriptionsCount} contract(s) on file
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.totalOutstanding)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.unpaidInvoicesCount} pending invoice(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Total Payments Made
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(metrics.totalPaid)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Reconciled &amp; verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="h-4 w-4" />
              Verified Enterprise Customer
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Member since {formatDate(customer.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Repeat className="h-4 w-4 text-blue-600" />
              My Subscriptions
            </CardTitle>
            <CardDescription>Your current software licenses and renewal schedules</CardDescription>
          </div>
          <Link href="/portal/subscriptions" className="text-xs text-blue-600 font-medium hover:underline">
            View all &rarr;
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-2.5 px-4">Subscription #</th>
                <th className="py-2.5 px-4">Plan</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Next Billing Date</th>
                <th className="py-2.5 px-4 text-right">Cycle Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No active subscriptions yet.
                  </td>
                </tr>
              ) : (
                subscriptions.slice(0, 5).map((sub: any) => (
                  <tr key={sub.id}>
                    <td className="py-2.5 px-4 font-semibold text-blue-600">{sub.subscriptionNumber}</td>
                    <td className="py-2.5 px-4 font-medium">{sub.plan.name}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={sub.status} /></td>
                    <td className="py-2.5 px-4 text-slate-600">{formatDate(sub.nextBillingDate)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(sub.grandTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recent Invoices Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-600" />
              Recent Invoices &amp; Receipts
            </CardTitle>
            <CardDescription>Download tax invoices or check balances</CardDescription>
          </div>
          <Link href="/portal/invoices" className="text-xs text-blue-600 font-medium hover:underline">
            View all &rarr;
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Invoice Date</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-4 text-right">Outstanding</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.slice(0, 5).map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-2.5 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={inv.status} /></td>
                    <td className="py-2.5 px-4 text-right font-semibold">{formatCurrency(inv.grandTotal)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-600">
                      {formatCurrency(inv.outstandingBalance)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/portal/invoices/${inv.id}`}>
                          <Button variant="outline" size="sm" className="h-6 text-[11px]">
                            View
                          </Button>
                        </Link>
                        {Number(inv.outstandingBalance) > 0 && inv.status !== 'CANCELLED' && (
                          <Link href={`/portal/invoices/${inv.id}`}>
                            <Button size="sm" className="h-6 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                              Pay
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
