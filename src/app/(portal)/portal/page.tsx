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
  CreditCard,
  Eye,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Repeat,
  Receipt,
  User,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CustomerPortalOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'SUBSCRIPTIONS' | 'PAYMENTS'>('INVOICES');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/overview');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.invoices && json.data.invoices.length > 0) {
          setSelectedInvoice(json.data.invoices[0]);
        }
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
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        Loading your Finnova customer portal...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-slate-500">Customer profile not found.</p>
      </div>
    );
  }

  const { customer, metrics, subscriptions, invoices, payments } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Subheader: Back Button, Title, Subtitle, and Primary Action Pill */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/portal"
            className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-all shadow-2xs hover:scale-105"
            title="Overview"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {customer.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              {customer.companyName || 'Brightloop SaaS Enterprise'} • Customer Portal &amp; Finances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <Link
            href="/portal/invoices"
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105"
          >
            <CreditCard className="h-4 w-4" />
            <span>Pay Outstanding Balance</span>
          </Link>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overdue Balance with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Overdue Balance</span>
              <div className="h-5 w-5 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center text-xs font-bold">
                !
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(metrics?.totalOutstanding || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{metrics?.unpaidInvoicesCount || 0} invoice(s) due</span>
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
              <span className="text-xs font-semibold text-slate-700">Due Next Renewal</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(metrics?.activeSubscriptionsCount > 0 ? 142560 : 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{metrics?.activeSubscriptionsCount || 0} active license(s)</span>
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
              <span className="text-xs font-semibold text-slate-700">Account Health</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              100% <span className="text-sm font-normal text-slate-500">uptime</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>Verified Enterprise Client</span>
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
              <span className="text-xs font-semibold text-slate-700">Total Settled</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(metrics?.totalPaid || 0)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Online Card &amp; NetBanking</div>
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
              Pay now
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Dark Master-Detail Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Account Activity &amp; Invoices
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('INVOICES')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                activeTab === 'INVOICES'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Invoices ({invoices?.length || 0})
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
              Subscriptions ({subscriptions?.length || 0})
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
              Payments ({payments?.length || 0})
            </button>
          </div>
        </div>

        {/* Master Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          {/* Left Column: List */}
          <div className="lg:col-span-5 space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {activeTab === 'INVOICES' ? (
              invoices?.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">No invoices on file.</div>
              ) : (
                invoices.map((inv: any) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={cn(
                        'p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between border',
                        isSelected
                          ? 'bg-[#2b2c4d] border-indigo-500/50 shadow-lg text-white'
                          : 'bg-[#18192d] border-slate-800/60 hover:bg-[#20223d] text-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-white">
                            #{inv.invoiceNumber}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Due {formatDate(inv.dueDate)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md',
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          )}
                        >
                          {inv.status}
                        </span>
                        <div className="font-bold text-xs text-white">
                          {formatCurrency(inv.totalAmount)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : activeTab === 'SUBSCRIPTIONS' ? (
              subscriptions?.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">No subscriptions active.</div>
              ) : (
                subscriptions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-2xl bg-[#18192d] border border-slate-800/60 flex items-center justify-between text-slate-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                        <Repeat className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">{sub.subscriptionNumber}</div>
                        <div className="text-[11px] text-slate-400">{sub.plan?.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-white">{formatCurrency(sub.grandTotal)}</div>
                      <span className="text-[10px] text-emerald-400 font-semibold">{sub.status}</span>
                    </div>
                  </div>
                ))
              )
            ) : (
              payments?.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">No recorded payments yet.</div>
              ) : (
                payments.map((pmt: any) => (
                  <div
                    key={pmt.id}
                    className="p-3.5 rounded-2xl bg-[#18192d] border border-slate-800/60 flex items-center justify-between text-slate-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">{pmt.paymentReference}</div>
                        <div className="text-[11px] text-slate-400">{formatDate(pmt.paymentDate)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-emerald-400">+{formatCurrency(pmt.amount)}</div>
                      <span className="text-[10px] text-slate-400">{pmt.paymentMethod}</span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          {/* Right Column: Royal Indigo/Purple Preview */}
          <div className="lg:col-span-7">
            {selectedInvoice ? (
              <div className="bg-[#37397b] rounded-2xl p-6 text-white border border-indigo-400/20 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
                      Featured Invoice
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <h2 className="text-xl font-bold tracking-tight text-white">
                        #{selectedInvoice.invoiceNumber}
                      </h2>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-white/20 text-white">
                        {selectedInvoice.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-[11px] font-semibold text-indigo-200">Client</div>
                    <div className="font-bold text-xs text-white">{customer.name}</div>
                    <div className="text-[11px] text-indigo-200/80">
                      {customer.companyName || 'Brightloop SaaS'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-indigo-200" />
                    </div>
                    <div className="text-[11px] text-indigo-100 font-medium mt-2">
                      SaaS License Fee
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{formatCurrency(selectedInvoice.taxAmount || 0)}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-indigo-200" />
                    </div>
                    <div className="text-[11px] text-indigo-100 font-medium mt-2">
                      Applicable Taxes (GST)
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{formatCurrency(selectedInvoice.outstandingBalance || 0)}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-indigo-200" />
                    </div>
                    <div className="text-[11px] text-indigo-100 font-medium mt-2">
                      Outstanding Amount
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <div className="text-[10px] text-indigo-200">Total Billed</div>
                      <div className="font-bold text-sm text-white">
                        {formatCurrency(selectedInvoice.totalAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-indigo-200">Balance Due</div>
                      <div className="font-bold text-sm text-emerald-300">
                        {formatCurrency(selectedInvoice.outstandingBalance || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link
                      href="/portal/invoices"
                      className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs px-5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Proceed to Pay</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#242647] rounded-2xl p-12 text-center text-slate-400 text-xs">
                Select an item to preview details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
