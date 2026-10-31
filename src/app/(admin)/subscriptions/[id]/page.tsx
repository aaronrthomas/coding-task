'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Repeat,
  Receipt,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Clock,
  Layers,
  Building,
  History,
  ShieldCheck,
} from 'lucide-react';
import { SubscriptionStatus } from '@prisma/client';

export default function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingRunning, setBillingRunning] = useState(false);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${id}`);
      const json = await res.json();
      if (json.success) {
        setSubscription(json.data);
      } else {
        toast.error(json.error || 'Subscription not found');
      }
    } catch {
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const handleTransition = async (action: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        fetchSubscription();
      } else {
        toast.error(data.error || 'Transition failed');
      }
    } catch {
      toast.error('Network error during transition');
    }
  };

  const handleTriggerBilling = async () => {
    setBillingRunning(true);
    try {
      const res = await fetch('/api/billing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          data.data.invoicesCreated > 0
            ? 'Billing engine successfully created a new invoice for this subscription!'
            : data.data.details?.[0]?.reason || 'No new invoice needed for this period.'
        );
        fetchSubscription();
      } else {
        toast.error(data.error || 'Billing execution failed');
      }
    } catch {
      toast.error('Network error executing billing engine');
    } finally {
      setBillingRunning(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading subscription details...</div>;
  }

  if (!subscription) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-500">Subscription contract not found.</p>
        <Link href="/subscriptions"><Button variant="outline" size="sm">Back to Subscriptions</Button></Link>
      </div>
    );
  }

  const plan = subscription.plan;

  return (
    <div className="space-y-6">
      {/* Top bar back link & quick actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/subscriptions"
          className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Subscriptions
        </Link>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trigger billing button */}
          {subscription.status === 'ACTIVE' && (
            <Button
              variant="outline"
              size="sm"
              disabled={billingRunning}
              onClick={handleTriggerBilling}
              className="text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <Play className={`mr-1.5 h-3.5 w-3.5 ${billingRunning ? 'animate-spin' : ''}`} />
              {billingRunning ? 'Billing...' : 'Generate Invoice Now'}
            </Button>
          )}

          {subscription.status === 'CONFIRMED' && (
            <Button
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleTransition('ACTIVATE')}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Activate Contract
            </Button>
          )}

          {subscription.status === 'ACTIVE' && plan.canPause && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-amber-700 bg-amber-50 border-amber-200"
              onClick={() => handleTransition('PAUSE')}
            >
              <Pause className="mr-1.5 h-3.5 w-3.5" />
              Pause Subscription
            </Button>
          )}

          {subscription.status === 'PAUSED' && (
            <Button
              size="sm"
              className="text-xs bg-blue-600 text-white"
              onClick={() => handleTransition('RESUME')}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Resume Subscription
            </Button>
          )}

          {subscription.status === 'ACTIVE' && plan.canEarlyClose && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleTransition('CLOSE')}
            >
              Close Contract
            </Button>
          )}

          {subscription.status === 'CLOSED' && plan.canRenew && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200"
              onClick={() => handleTransition('RENEW')}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Renew Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Main Subscription Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">
                  {subscription.subscriptionNumber}
                </h1>
                <StatusBadge status={subscription.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Plan: <strong className="text-slate-800">{plan.name}</strong> ({subscription.billingFrequency})
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">Recurring Total</span>
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(subscription.grandTotal)}
              </span>
              <span className="text-xs text-slate-500 block">per {subscription.billingFrequency.toLowerCase()}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block text-[11px]">Customer</span>
              <Link href={`/customers/${subscription.customer.id}`} className="font-semibold text-blue-600 hover:underline">
                {subscription.customer.name}
              </Link>
              <span className="text-[11px] text-slate-500 block">{subscription.customer.email}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block text-[11px]">Start Date</span>
              <span className="font-medium text-slate-800">{formatDate(subscription.startDate)}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block text-[11px]">Next Billing Date</span>
              <span className="font-bold text-blue-700">{formatDate(subscription.nextBillingDate)}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block text-[11px]">Expiry Date</span>
              <span className="font-medium text-slate-800">
                {subscription.expiryDate ? formatDate(subscription.expiryDate) : 'No expiration (Ongoing)'}
              </span>
              {subscription.autoClose && (
                <span className="text-[10px] text-amber-600 block">Auto-closes at expiry</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Line Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            Contract Line Items
          </CardTitle>
          <CardDescription>Products and variants configured for this subscription</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-4">Item</th>
                <th className="py-2.5 px-4">Variant</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                <th className="py-2.5 px-4 text-right">Line Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {subscription.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{item.product.name}</td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {item.variant ? `${item.variant.name} (+₹${item.variant.priceAdjustment})` : 'Base Product'}
                  </td>
                  <td className="py-2.5 px-4 text-center">{item.quantity}</td>
                  <td className="py-2.5 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 px-4 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Generated Invoices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-amber-600" />
            Generated Billing Invoices ({subscription.invoices?.length ?? 0})
          </CardTitle>
          <CardDescription>Invoices generated by the recurring billing engine</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Invoice Date</th>
                <th className="py-2.5 px-4">Billing Period</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Grand Total</th>
                <th className="py-2.5 px-4 text-right">Amount Paid</th>
                <th className="py-2.5 px-4 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {subscription.invoices?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No invoices generated yet. Click &quot;Generate Invoice Now&quot; to test.
                  </td>
                </tr>
              ) : (
                subscription.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4">
                      <Link href={`/invoices/${inv.id}`} className="font-semibold text-blue-600 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {formatDate(inv.periodStart)} &rarr; {formatDate(inv.periodEnd)}
                    </td>
                    <td className="py-2.5 px-4"><StatusBadge status={inv.status} /></td>
                    <td className="py-2.5 px-4 text-right font-semibold">{formatCurrency(inv.grandTotal)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 font-medium">{formatCurrency(inv.amountPaid)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-600">
                      {formatCurrency(inv.outstandingBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Lifecycle Status History & Audit Trail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-slate-600" />
            Lifecycle Audit History
          </CardTitle>
          <CardDescription>Immutable record of all state transitions and timestamps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscription.statusHistory?.map((h: any) => (
            <div key={h.id} className="flex items-start justify-between text-xs pb-2 border-b border-slate-100 last:border-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : `Created as ${h.toStatus}`}
                  </span>
                  {h.changedByUser && (
                    <span className="text-[10px] text-slate-400">
                      by {h.changedByUser.name} ({h.changedByUser.role})
                    </span>
                  )}
                </div>
                {h.reason && <p className="text-slate-500 text-[11px]">{h.reason}</p>}
              </div>
              <span className="text-[11px] text-slate-400">{formatDateTime(h.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
