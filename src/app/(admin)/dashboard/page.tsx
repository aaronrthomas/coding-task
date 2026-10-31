'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DashboardMetrics } from '@/types';
import {
  Repeat,
  DollarSign,
  AlertCircle,
  CalendarCheck,
  TrendingUp,
  Receipt,
  CreditCard,
  Users,
  RefreshCw,
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
  BarChart,
  Bar,
} from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(days);
  }, [days]);

  return (
    <div className="space-y-6">
      {/* Page Header with Date Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial &amp; Subscription Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time accounting metrics, revenue trends, and operational health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-40 text-xs font-medium"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Past Year</option>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetrics(days)}
            title="Refresh statistics"
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Subscriptions
            </CardTitle>
            <Repeat className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : data?.totalActiveSubscriptions ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              +{data?.newSubscriptionsCount ?? 0} new in period
            </p>
          </CardContent>
        </Card>

        {/* Revenue Collected */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Collected Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : formatCurrency(data?.revenueCollected)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Realized cash flow
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Receivables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Balance
            </CardTitle>
            <Receipt className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : formatCurrency(data?.outstandingBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pending unpaid invoices
            </p>
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Receivables
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : formatCurrency(data?.overdueInvoicesAmount)}
            </div>
            <p className="text-xs text-red-600/90 font-medium mt-1">
              {data?.overdueInvoicesCount ?? 0} overdue invoice(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Revenue Trend: Collected Payments vs Billed Revenue</span>
              <span className="text-xs font-normal text-slate-400">Past {days} days</span>
            </CardTitle>
            <CardDescription>
              Comparing actual cash recorded from payments against invoiced receivables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-2">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Loading revenue chart...
                </div>
              ) : data?.revenueTrend && data.revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueTrend}>
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        fontSize: '12px',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="invoiced"
                      name="Invoiced Total"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorInvoiced)"
                    />
                    <Area
                      type="monotone"
                      dataKey="collected"
                      name="Collected Payments"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorCollected)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No revenue data in selected window.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Status Breakdown</CardTitle>
            <CardDescription>Aggregate count and sums by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-slate-400 text-sm py-8 text-center">Loading breakdown...</div>
            ) : data?.invoiceStatusBreakdown && data.invoiceStatusBreakdown.length > 0 ? (
              data.invoiceStatusBreakdown.map((item) => (
                <div key={item.status} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-slate-500">({item.count} invoices)</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-sm py-8 text-center">No invoice records found.</div>
            )}

            <div className="pt-2">
              <Link href="/invoices">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View All Invoices
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions & Payments Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Subscriptions</CardTitle>
              <CardDescription>Latest customer subscriptions initiated</CardDescription>
            </div>
            <Link href="/subscriptions" className="text-xs text-blue-600 hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="text-slate-400 text-sm py-4 text-center">Loading subscriptions...</div>
              ) : data?.recentSubscriptions && data.recentSubscriptions.length > 0 ? (
                data.recentSubscriptions.map((sub) => (
                  <div key={sub.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <Link
                        href={`/subscriptions/${sub.id}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {sub.subscriptionNumber}
                      </Link>
                      <div className="text-slate-500 font-medium">{sub.customerName}</div>
                      <div className="text-[11px] text-slate-400">{sub.planName}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(sub.grandTotal)}
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm py-4 text-center">No subscriptions found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Payments</CardTitle>
              <CardDescription>Reconciled payments from customers</CardDescription>
            </div>
            <Link href="/payments" className="text-xs text-blue-600 hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="text-slate-400 text-sm py-4 text-center">Loading payments...</div>
              ) : data?.recentPayments && data.recentPayments.length > 0 ? (
                data.recentPayments.map((pmt) => (
                  <div key={pmt.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{pmt.paymentReference}</span>
                      <div className="text-slate-500 font-medium">{pmt.customerName}</div>
                      <div className="text-[11px] text-slate-400">{formatDate(pmt.paymentDate)}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-semibold text-emerald-600">
                        +{formatCurrency(pmt.amount)}
                      </div>
                      <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {pmt.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm py-4 text-center">No payment records found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
