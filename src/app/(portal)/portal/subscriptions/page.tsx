'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Repeat,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
          setSubscriptions(json.data.subscriptions || []);
        }
      } catch {
        toast.error('Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  const totalCost = subscriptions.reduce((acc, s) => acc + Number(s.grandTotal || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Subheader: Back Button, Title, Subtitle, and Primary Action Pill */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/portal"
            className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-all shadow-2xs hover:scale-105"
            title="Back to Overview"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              My Subscriptions
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              View your active recurring software licenses, billing cycles, and renewal dates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <Link
            href="/portal/invoices"
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105"
          >
            <CreditCard className="h-4 w-4" />
            <span>Pay Outstanding Invoices</span>
          </Link>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Expiring / Renewals with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Contract Status</span>
              <div className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              Active &amp; In Good Standing
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{subscriptions.length} active licenses</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-36 h-24 opacity-85 pointer-events-none rounded-br-2xl overflow-hidden">
            <Image
              src="/finnova-desk.jpg"
              alt="Office Desk"
              width={160}
              height={120}
              className="object-cover object-center w-full h-full"
            />
          </div>
        </div>

        {/* KPI 2: Due within next month with Vertical Purple Bars */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Recurring Cycle Total</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(totalCost || 142560)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>Recurring monthly commitment</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-1.5 pt-4 h-12">
            {[
              { label: 'Jul', h: 'h-4', color: 'bg-indigo-200' },
              { label: 'Aug', h: 'h-6', color: 'bg-indigo-300' },
              { label: 'Sep', h: 'h-5', color: 'bg-indigo-300' },
              { label: 'Oct', h: 'h-7', color: 'bg-indigo-400' },
              { label: 'Nov', h: 'h-9', color: 'bg-indigo-500' },
              { label: 'Dec', h: 'h-10', color: 'bg-[#5b52f9]' },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className={`w-full max-w-[12px] rounded-t-sm ${bar.h} ${bar.color}`} />
                <span className="text-[9px] text-slate-400 mt-1">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KPI 3: Average time to get paid with Sparkline */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">SLA &amp; Uptime</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              99.99% <span className="text-sm font-normal text-slate-500">uptime</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>Full SLA coverage guaranteed</span>
            </div>
          </div>
          <div className="pt-2 h-10 w-full">
            <svg viewBox="0 0 160 36" fill="none" className="w-full h-full">
              <path
                d="M2 30 C 25 32, 40 24, 60 22 C 80 20, 100 12, 120 10 C 140 8, 150 4, 158 2"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="2" cy="30" r="2.5" fill="#6366f1" />
              <circle cx="60" cy="22" r="2.5" fill="#6366f1" />
              <circle cx="120" cy="10" r="2.5" fill="#6366f1" />
              <circle cx="158" cy="2" r="3" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* KPI 4: Available for Instant Payout with Card Badges */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Autopay Methods</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              •••• 6789
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Primary Card on File</div>
          </div>
          <div className="flex items-center justify-between gap-1.5 pt-3">
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              •••• 4242
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-[#5b52f9] text-white font-mono shadow-xs">
              •••• 6789
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              •••• 1234
            </div>
            <Link
              href="/portal/invoices"
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Invoices
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Active Filters Pill Row */}
      <div className="flex items-center gap-2 text-xs pt-1">
        <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-full font-semibold flex items-center gap-1.5 shadow-xs">
          <span>Active filters</span>
          <span className="h-4 w-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
            1
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
          <span>Status: Active Contracts</span>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        </div>
      </div>

      {/* 4. Signature Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            My Subscriptions ({subscriptions.length})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Contract #</th>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Billing Cadence</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Cycle Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading your subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    You do not have any active subscription contracts.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#1f2038] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 font-bold">
                          <Repeat className="h-4 w-4" />
                        </div>
                        <span>{sub.subscriptionNumber}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">
                      {sub.plan?.name}
                    </td>
                    <td className="py-3.5 px-4 text-indigo-300 font-semibold">
                      {sub.billingFrequency}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(sub.nextBillingDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                      {formatCurrency(sub.grandTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
