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
  Download,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  BarChart3,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#5b52f9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');
  const [activeTab, setActiveTab] = useState<'BAR' | 'PIE' | 'OVERDUE'>('BAR');

  const fetchReports = async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?days=${d}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(days);
  }, [days]);

  const handleExportCsv = () => {
    window.location.href = `/api/reports?days=${days}&format=csv`;
    toast.success('Downloading Overdue Invoices CSV report...');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Subheader: Back Button, Title, Subtitle, and Primary Action Pill */}
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
              Financial Reports &amp; Auditing
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Database-backed accounting aggregations, receivables aging, and subscription revenue analytics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCsv}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overdue Invoices with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Overdue Audit Total</span>
              <div className="h-5 w-5 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center text-xs font-bold">
                !
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(data?.totalOverdueAmount ?? 24850)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{data?.overdueInvoices?.length ?? 0} invoices requiring action</span>
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
              {formatCurrency(data?.totalOutstandingBalance ?? 142560)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>8.2% from last month</span>
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
              <span className="text-xs font-semibold text-slate-700">Average Collection Speed</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              16 <span className="text-sm font-normal text-slate-500">days</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>2 days faster than avg</span>
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
              <span className="text-xs font-semibold text-slate-700">Total Collected Cash</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(data?.totalRevenueCollected ?? 186540)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Realized Accounting Income</div>
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
            <button
              onClick={handleExportCsv}
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Export
            </button>
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

          <div className="relative">
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-full px-3.5 py-1.5 pr-7 text-xs text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer focus:outline-hidden"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Past Year</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>Audited General Ledger</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* 4. Signature Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Revenue Analytics &amp; Plan Breakdown
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('BAR')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                activeTab === 'BAR'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Monthly Revenue
            </button>
            <button
              onClick={() => setActiveTab('PIE')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                activeTab === 'PIE'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Plan Revenue
            </button>
            <button
              onClick={() => setActiveTab('OVERDUE')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                activeTab === 'OVERDUE'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Overdue Aging Audit ({data?.overdueInvoices?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'BAR' ? (
          <div className="bg-[#18192d] p-5 rounded-2xl border border-slate-800/60">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Monthly Revenue Aggregations
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Billed vs Collected totals across recent accounting cycles
                </p>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Loading monthly revenue...
                </div>
              ) : data?.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2d48" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
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
                    <Bar dataKey="invoiced" name="Invoiced Total" fill="#5b52f9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Collected Cash" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No monthly revenue records in window.
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'PIE' ? (
          <div className="bg-[#18192d] p-5 rounded-2xl border border-slate-800/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-4">
              Revenue Breakdown by Subscription Plan
            </h3>
            <div className="h-[280px] w-full flex items-center justify-center">
              {loading ? (
                <div className="text-slate-500 text-xs">Loading plan distribution...</div>
              ) : data?.planRevenue && data.planRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.planRevenue}
                      dataKey="total"
                      nameKey="planName"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={({ name, percent }: any) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.planRevenue.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any) => formatCurrency(Number(v) || 0)}
                      contentStyle={{
                        backgroundColor: '#1a1b2e',
                        borderColor: '#373868',
                        fontSize: '11px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-xs">No active plan revenue in this period.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Days Overdue</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data?.overdueInvoices && data.overdueInvoices.length > 0 ? (
                  data.overdueInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-[#1f2038] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <Link href="/invoices" className="hover:text-indigo-300">
                          #{inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium">{inv.customerName}</td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(inv.dueDate)}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                          {inv.daysOverdue} days
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-red-400">
                        {formatCurrency(inv.outstandingBalance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No overdue invoices in the ledger!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
