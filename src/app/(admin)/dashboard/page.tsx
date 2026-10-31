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
  ChevronDown,
  Repeat,
  DollarSign,
  AlertCircle,
  Receipt,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Zap,
  CreditCard,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DashboardMetrics } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');
  const [activeTab, setActiveTab] = useState<'CHART' | 'SUBSCRIPTIONS' | 'PAYMENTS'>('CHART');
  const [isBillingRunning, setIsBillingRunning] = useState(false);

  const fetchMetrics = async (selectedDays: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?days=${selectedDays}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(days);
  }, [days]);

  const handleRunBillingNow = async () => {
    setIsBillingRunning(true);
    try {
      const res = await fetch('/api/billing/run', { method: 'POST' });
      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(
          `Billing engine executed: ${resData.data.invoicesCreated} invoice(s) generated, ${resData.data.skippedCount} skipped.`
        );
        fetchMetrics(days);
      } else {
        toast.error(resData.error || 'Billing engine execution failed');
      }
    } catch {
      toast.error('Network error during billing run');
    } finally {
      setIsBillingRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Subheader: Back Button, Title, Subtitle, and Primary Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/invoices"
            className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-all shadow-2xs hover:scale-105"
            title="Go to Invoices"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Executive Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Real-time accounting metrics, cash flow trends, and subscription lifecycle health.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Days select pill */}
          <div className="relative">
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-full px-4 py-2 pr-8 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Past Year</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          <button
            onClick={() => fetchMetrics(days)}
            title="Refresh statistics"
            className="h-9 w-9 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-all shadow-2xs hover:scale-105 cursor-pointer"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin text-indigo-600')} />
          </button>

          <button
            onClick={handleRunBillingNow}
            disabled={isBillingRunning}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Zap className={cn('h-4 w-4 fill-white', isBillingRunning && 'animate-spin')} />
            <span>Run Billing Engine</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overdue Receivables with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Overdue Receivables</span>
              <div className="h-5 w-5 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center text-xs font-bold">
                !
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(data?.overdueInvoicesAmount ?? 24850)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{data?.overdueInvoicesCount ?? 0} overdue invoice(s)</span>
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
              <span className="text-xs font-semibold text-slate-700">Due within next month</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(data?.outstandingBalance ?? 142560)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+{data?.newSubscriptionsCount ?? 0} new subscriptions</span>
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
              <span className="text-xs font-semibold text-slate-700">Average time to get paid</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              16 <span className="text-sm font-normal text-slate-500">days</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>2 days faster than last month</span>
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

        {/* KPI 4: Available for Instant Payout / Payment with Card Badges */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Available for Instant Payout</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(data?.revenueCollected ?? 186540)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Realized Cash Flow</div>
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
              href="/payments"
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Payout now
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Active Filters Pill Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-full font-semibold flex items-center gap-1.5 shadow-xs">
            <span>Active filters</span>
            <span className="h-4 w-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
              2
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>Window: Last {days} Days</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>All Enterprise Customers</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>Live Sync: Enabled</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
        </div>

        <Link
          href="/invoices"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span>View Invoices Workstation</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 4. Signature Dark Master-Detail / Chart Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Revenue Performance &amp; Live Cash Flow
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('CHART')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                activeTab === 'CHART'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Revenue Chart
            </button>
            <button
              onClick={() => setActiveTab('SUBSCRIPTIONS')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                activeTab === 'SUBSCRIPTIONS'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Recent Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                activeTab === 'PAYMENTS'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Recent Payments
            </button>
          </div>
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'CHART' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
            {/* Area Chart */}
            <div className="lg:col-span-8 bg-[#18192d] p-5 rounded-2xl border border-slate-800/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Billed Receivables vs Cash Collected
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Past {days} days daily billing and collection trends
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Live Feed
                </span>
              </div>

              <div className="h-[280px] w-full pt-2">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    Loading revenue chart...
                  </div>
                ) : data?.revenueTrend && data.revenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueTrend}>
                      <defs>
                        <linearGradient id="colorCollectedFinnova" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorInvoicedFinnova" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5b52f9" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#5b52f9" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2d48" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val) || 0)}
                        contentStyle={{
                          backgroundColor: '#1a1b2e',
                          borderColor: '#373868',
                          fontSize: '11px',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="invoiced"
                        name="Invoiced Total"
                        stroke="#5b52f9"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorInvoicedFinnova)"
                      />
                      <Area
                        type="monotone"
                        dataKey="collected"
                        name="Collected Payments"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCollectedFinnova)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No revenue transactions in this window.
                  </div>
                )}
              </div>
            </div>

            {/* Right Status Breakdown Panel */}
            <div className="lg:col-span-4 bg-[#37397b] rounded-2xl p-5 text-white border border-indigo-400/20 shadow-xl flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  Invoice Status Breakdown
                </div>
                <div className="mt-4 space-y-3">
                  {data?.invoiceStatusBreakdown && data.invoiceStatusBreakdown.length > 0 ? (
                    data.invoiceStatusBreakdown.map((item) => (
                      <div
                        key={item.status}
                        className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{item.status}</span>
                          <span className="text-[10px] text-indigo-200">({item.count})</span>
                        </div>
                        <span className="font-bold text-white">{formatCurrency(item.total)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs py-4 text-center">
                      No status data available.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-indigo-200">Total Active Subscriptions</span>
                <span className="text-base font-extrabold text-white">
                  {data?.totalActiveSubscriptions ?? 0}
                </span>
              </div>
            </div>
          </div>
        ) : activeTab === 'SUBSCRIPTIONS' ? (
          <div className="pt-6 space-y-2">
            {data?.recentSubscriptions && data.recentSubscriptions.length > 0 ? (
              data.recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl bg-[#18192d] border border-slate-800/60 flex items-center justify-between text-xs text-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 font-bold">
                      <Repeat className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{sub.subscriptionNumber}</div>
                      <div className="text-slate-400 text-[11px]">{sub.customerName} • {sub.planName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{formatCurrency(sub.grandTotal)}</div>
                    <span className="text-[10px] text-indigo-300 font-semibold">{sub.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">No recent subscriptions.</div>
            )}
          </div>
        ) : (
          <div className="pt-6 space-y-2">
            {data?.recentPayments && data.recentPayments.length > 0 ? (
              data.recentPayments.map((pmt) => (
                <div
                  key={pmt.id}
                  className="p-3.5 rounded-2xl bg-[#18192d] border border-slate-800/60 flex items-center justify-between text-xs text-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{pmt.paymentReference}</div>
                      <div className="text-slate-400 text-[11px]">{pmt.customerName} • {formatDate(pmt.paymentDate)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">+{formatCurrency(pmt.amount)}</div>
                    <span className="text-[10px] text-slate-400">{pmt.paymentMethod}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">No recent payments.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
