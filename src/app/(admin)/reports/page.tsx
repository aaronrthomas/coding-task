'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  BarChart3,
  Download,
  DollarSign,
  AlertCircle,
  Repeat,
  CreditCard,
  Percent,
  Layers,
  ArrowUpRight,
  TrendingDown,
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

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financial Reports &amp; Auditing</h1>
          <p className="text-sm text-slate-500">
            Database-backed accounting aggregations, receivables health, and plan analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-36 text-xs font-medium"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Past Year</option>
          </Select>

          <Button onClick={handleExportCsv} variant="outline" size="sm" className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Total Invoiced Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">
              {loading ? '...' : formatCurrency(data?.financialOverview?.totalBilledRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Accrual accounting basis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Total Realized Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600">
              {loading ? '...' : formatCurrency(data?.financialOverview?.totalCollectedPayments)}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Cash basis receipts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Outstanding Receivables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600">
              {loading ? '...' : formatCurrency(data?.financialOverview?.totalOutstandingReceivables)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Pending collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Total Tax Accrued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">
              {loading ? '...' : formatCurrency(data?.financialOverview?.totalTaxAccrued)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Discounts: {formatCurrency(data?.financialOverview?.totalDiscountsGranted)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions by Status & Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Repeat className="h-4 w-4 text-blue-600" />
              Subscription Status Breakdown
            </CardTitle>
            <CardDescription>Active, confirmed, paused, and closed count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-6 text-center text-slate-400 text-xs">Loading status data...</div>
            ) : (
              data?.subscriptionsByStatus?.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    <span className="font-semibold text-slate-700">{s.count} contracts</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(s.mrrEstimate)}</span>
                </div>
              ))
            )}

            <div className="pt-2 text-[11px] text-slate-500 flex justify-between">
              <span>New in period: <strong>+{data?.periodMetrics?.newSubscriptions ?? 0}</strong></span>
              <span>Cancelled in period: <strong>{data?.periodMetrics?.closedSubscriptions ?? 0}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Collections by Payment Method
            </CardTitle>
            <CardDescription>Volume distribution by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
              ) : data?.paymentMethodBreakdown && data.paymentMethodBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentMethodBreakdown}
                      dataKey="totalAmount"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {data.paymentMethodBreakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No payment data recorded.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Performance & Overdue Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600" />
              Plan Performance &amp; Popularity
            </CardTitle>
            <CardDescription>Active subscriptions per plan</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-4">Plan Name</th>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4">Rate</th>
                  <th className="py-2.5 px-4 text-right">Subscribers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data?.planPerformance?.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{p.planName}</td>
                    <td className="py-2.5 px-4 text-slate-500">{p.productName}</td>
                    <td className="py-2.5 px-4">{formatCurrency(p.planPrice)}/{p.billingFrequency.toLowerCase()}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-blue-600">{p.activeSubscribers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Overdue Invoices Report */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                Overdue Invoices Action List
              </CardTitle>
              <CardDescription>Receivables overdue for payment</CardDescription>
            </div>
            <Button onClick={handleExportCsv} variant="ghost" size="sm" className="h-7 text-xs text-blue-600">
              CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data?.overdueInvoices?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-emerald-600 font-medium">
                      No overdue invoices at this time!
                    </td>
                  </tr>
                ) : (
                  data?.overdueInvoices?.map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="py-2.5 px-4">
                        <Link href={`/invoices/${inv.id}`} className="font-semibold text-blue-600 hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-slate-800">{inv.customerName}</td>
                      <td className="py-2.5 px-4 text-red-600 font-medium">{formatDate(inv.dueDate)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-red-700">
                        {formatCurrency(inv.outstandingBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
