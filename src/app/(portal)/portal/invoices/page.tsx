'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Search,
  AlertCircle,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  ChevronDown,
  Link as LinkIcon,
  CreditCard,
  Eye,
  CheckCircle2,
  Printer,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'DRAFT' | 'UNPAID'>('UNPAID');

  // Customer Checkout Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<any>(null);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/overview');
      const json = await res.json();
      if (json.success) {
        const items = json.data.invoices || [];
        setInvoices(items);
        setSelectedInvoice((prev: any) => {
          if (!prev && items.length > 0) return items[0];
          return items.find((i: any) => i.id === prev?.id) || items[0] || null;
        });
      }
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const openPaymentModal = (inv: any) => {
    setActivePaymentInvoice(inv);
    setAmount(Number(inv.outstandingBalance || inv.totalAmount || 0));
    setPaymentMethod(PaymentMethod.CARD);
    setTransactionRef(`TXN-WEB-${Date.now().toString().slice(-6)}`);
    setIsPayModalOpen(true);
  };

  const handleCustomerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: activePaymentInvoice.id,
          amount: Number(amount),
          paymentMethod,
          transactionRef: transactionRef || null,
          notes: 'Customer online payment via Portal',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `Payment of ₹${Number(amount).toLocaleString()} confirmed! Invoice ${activePaymentInvoice.invoiceNumber} updated.`
        );
        setIsPayModalOpen(false);
        fetchInvoices();
      } else {
        toast.error(data.error || 'Payment failed');
      }
    } catch {
      toast.error('Network error during payment submission');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered list
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.name || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusTab === 'DRAFT') return inv.status === 'DRAFT';
    if (statusTab === 'UNPAID')
      return (
        inv.status === 'CONFIRMED' ||
        inv.status === 'OVERDUE' ||
        Number(inv.outstandingBalance || 0) > 0
      );
    return true;
  });

  // KPI Calculations
  const overdueTotal = invoices
    .filter((inv) => inv.isOverdue || inv.status === 'OVERDUE')
    .reduce((acc, inv) => acc + Number(inv.outstandingBalance || 0), 0);

  const dueNextMonthTotal = invoices
    .filter((inv) => Number(inv.outstandingBalance || 0) > 0)
    .reduce((acc, inv) => acc + Number(inv.outstandingBalance || 0), 0);

  const instantPayoutTotal = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, inv) => acc + Number(inv.amountPaid || 0), 0);

  const draftCount = invoices.filter((i) => i.status === 'DRAFT').length;
  const unpaidCount = invoices.filter(
    (i) => i.status === 'CONFIRMED' || i.status === 'OVERDUE' || Number(i.outstandingBalance || 0) > 0
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Subheader: Back Button, Title, Subtitle, and Primary Pill Action */}
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
              My Invoices
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Manage and track all your invoices, billing statements, and payments in one place.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => {
              const firstUnpaid = invoices.find((i) => Number(i.outstandingBalance || 0) > 0);
              if (firstUnpaid) openPaymentModal(firstUnpaid);
              else toast.info('All invoices are already paid in full!');
            }}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            <span>Pay Outstanding Now</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overdue with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Overdue</span>
              <div className="h-5 w-5 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center text-xs font-bold">
                !
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(overdueTotal || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>12.5% from last month</span>
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

        {/* KPI 2: Due within next month with Vertical Bars */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Due within next month</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(dueNextMonthTotal || 142560)}
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
              <span className="text-xs font-semibold text-slate-700">Average time to pay</span>
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

        {/* KPI 4: Available for Instant Payout / Payment with Card Badges */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Instant Online Payout</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(instantPayoutTotal || 186540)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Instant Card &amp; NetBanking</div>
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
              onClick={() => {
                const first = invoices[0];
                if (first) openPaymentModal(first);
              }}
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Pay now
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

          <button
            onClick={() => {
              if (statusTab === 'UNPAID') setStatusTab('ALL');
              else if (statusTab === 'ALL') setStatusTab('DRAFT');
              else setStatusTab('UNPAID');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <span>Status: {statusTab}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>November 2026</span>
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>December 2026</span>
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter invoice # or name"
            className="rounded-full bg-white border-slate-200 pl-8 pr-4 text-xs h-9 shadow-2xs focus-visible:ring-indigo-500"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 4. Signature Dark Master-Detail Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80">
        {/* Top Header of the Dark Container */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            {statusTab === 'UNPAID' ? 'Unpaid Invoices' : 'All Generated Invoices'}
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setStatusTab('ALL')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                statusTab === 'ALL'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              All Invoices
            </button>
            <button
              onClick={() => setStatusTab('DRAFT')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1 cursor-pointer',
                statusTab === 'DRAFT'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <span>Draft</span>
              <span className="text-[10px] opacity-75">{draftCount}</span>
            </button>
            <button
              onClick={() => setStatusTab('UNPAID')}
              className={cn(
                'px-4 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1 cursor-pointer',
                statusTab === 'UNPAID'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <span>Unpaid</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">{unpaidCount}</span>
            </button>
          </div>
        </div>

        {/* Master Detail Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          {/* Left Column: Master List */}
          <div className="lg:col-span-5 space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">Loading customer invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No invoices found in this view.
              </div>
            ) : (
              filteredInvoices.map((inv) => {
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
                        {inv.customer?.name?.charAt(0) || 'I'}
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
                            : inv.status === 'CONFIRMED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
            )}
          </div>

          {/* Right Column: Royal Indigo/Purple Invoice Detail Preview Card */}
          <div className="lg:col-span-7">
            {selectedInvoice ? (
              <div className="bg-[#37397b] rounded-2xl p-6 text-white border border-indigo-400/20 shadow-xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
                      Invoice Details
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
                    <div className="text-[11px] font-semibold text-indigo-200">Customer</div>
                    <div className="font-bold text-xs text-white">
                      {selectedInvoice.customer?.name}
                    </div>
                    <div className="text-[11px] text-indigo-200/80">
                      {selectedInvoice.customer?.companyName || 'Brightloop Account'}
                    </div>
                  </div>
                </div>

                {/* Line Items Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 ? (
                    selectedInvoice.lineItems.slice(0, 3).map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-white/10 rounded-xl p-3 border border-white/10 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>{formatCurrency(item.amount)}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-indigo-200" />
                        </div>
                        <div className="text-[11px] text-indigo-100 font-medium mt-2 truncate">
                          {item.description || 'Subscription Service'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 bg-white/10 rounded-xl p-4 text-center text-xs text-indigo-200">
                      Recurring Subscription Service
                    </div>
                  )}
                </div>

                {/* Financial Summary & Actions */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <div className="text-[10px] text-indigo-200">Sub Total</div>
                      <div className="font-bold text-sm text-white">
                        {formatCurrency(selectedInvoice.subtotal || selectedInvoice.totalAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-indigo-200">Total</div>
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
                      href={`/portal/invoices/${selectedInvoice.id}`}
                      className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                      title="View Full Invoice Detail"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    {Number(selectedInvoice.outstandingBalance || 0) > 0 ? (
                      <button
                        onClick={() => openPaymentModal(selectedInvoice)}
                        className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs px-5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Pay now</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-300 font-semibold text-xs px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Paid in full</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#242647] rounded-2xl p-12 text-center text-slate-400 text-xs">
                Select an invoice to view line items and pay online.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Online Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Pay Invoice #${activePaymentInvoice?.invoiceNumber}`}
        description="Select your preferred payment method to settle this invoice instantly."
      >
        <form onSubmit={handleCustomerPayment} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500">Outstanding Balance:</span>
            <span className="text-base font-bold text-indigo-700">
              {formatCurrency(activePaymentInvoice?.outstandingBalance || 0)}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Payment Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="1"
              max={Number(activePaymentInvoice?.outstandingBalance || activePaymentInvoice?.totalAmount || 0)}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Payment Method</Label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="text-xs"
            >
              <option value={PaymentMethod.CARD}>Credit / Debit Card (Instant)</option>
              <option value={PaymentMethod.UPI}>UPI / Instant NetBanking</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Direct Bank Wire</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Transaction Reference</Label>
            <Input
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="Auto-generated authorization code"
              className="text-xs font-mono"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPayModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white"
            >
              {submitting ? 'Authorizing Payment...' : `Confirm & Pay ₹${Number(amount).toLocaleString()}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
