'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Repeat, Calendar, Layers, ArrowLeft } from 'lucide-react';

export default function CustomerSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/portal/overview');
        const json = await res.json();
        if (json.success) {
          setSubscriptions(json.data.subscriptions);
        }
      } catch {
        toast.error('Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Subscriptions</h1>
          <p className="text-sm text-slate-500">
            View your active recurring software licenses, billing cycles, and renewal dates
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              You do not have any subscription contracts yet.
            </CardContent>
          </Card>
        ) : (
          subscriptions.map((sub) => (
            <Card key={sub.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50/75 border-b border-slate-100 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-slate-900">{sub.subscriptionNumber}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Cycle Amount</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(sub.grandTotal)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Selected Plan</span>
                    <span className="font-semibold text-slate-800">{sub.plan.name}</span>
                    <span className="text-slate-500 block text-[11px]">Billed {sub.billingFrequency.toLowerCase()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Start Date</span>
                    <span className="font-medium text-slate-800">{formatDate(sub.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Next Renewal Date</span>
                    <span className="font-bold text-blue-700">{formatDate(sub.nextBillingDate)}</span>
                  </div>
                </div>

                {/* Products in this subscription */}
                <div className="border border-slate-100 rounded bg-slate-50/50 p-3 text-xs space-y-2">
                  <span className="font-semibold text-slate-700 uppercase tracking-wide text-[10px] block">
                    Licensed Products:
                  </span>
                  {sub.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-medium text-slate-800">{item.product.name}</span>
                        {item.variant && (
                          <span className="text-[11px] text-slate-500 ml-1">({item.variant.name})</span>
                        )}
                        <span className="text-[11px] text-slate-400 ml-2">&times; {item.quantity} qty</span>
                      </div>
                      <span className="font-semibold text-slate-900">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
