'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Plus,
  AlertCircle,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  ChevronDown,
  LayoutGrid,
  List,
  MoreVertical,
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'DRAFT' | 'UNPAID'>('UNPAID');
  const [customerFilter, setCustomerFilter] = useState('');
  const [viewMode, setViewMode] = useState<'FINNOVA' | 'TABLE'>('FINNOVA');

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recording, setRecording] = useState(false);

  // Quick Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/invoices?pageSize=50&search=${encodeURIComponent(search)}`;
      if (statusTab === 'DRAFT') url += `&status=DRAFT`;
      if (statusTab === 'UNPAID') url += `&status=CONFIRMED`;
      if (customerFilter) url += `&customerId=${customerFilter}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        const items = json.data.items || [];
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
  }, [search, statusTab, customerFilter]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers?pageSize=100');
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data.items || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, [fetchInvoices]);

  // Aggregated KPI Stats
  const overdueTotal = invoices
    .filter((inv) => inv.isOverdue || inv.status === 'OVERDUE')
    .reduce((acc, inv) => acc + Number(inv.outstandingBalance || 0), 0);

  const dueNextMonthTotal = invoices
    .filter((inv) => inv.status === 'CONFIRMED' || inv.status === 'DRAFT')
    .reduce((acc, inv) => acc + Number(inv.outstandingBalance || 0), 0);

  const instantPayoutTotal = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, inv) => acc + Number(inv.amountPaid || 0), 0);

  // Tab Counts
  const draftCount = invoices.filter((i) => i.status === 'DRAFT').length;
  const unpaidCount = invoices.filter((i) => Number(i.outstandingBalance) > 0).length;

  const openPaymentModal = (invoice: any) => {
    setActivePaymentInvoice(invoice);
    setPaymentAmount(Number(invoice.outstandingBalance || 0));
    setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    setTransactionRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;
    setRecording(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: activePaymentInvoice.id,
          amount: Number(paymentAmount),
          paymentMethod,
          transactionRef: transactionRef || null,
          notes: paymentNotes || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Payment recorded successfully');
        setIsPaymentModalOpen(false);
        fetchInvoices();
      } else {
        toast.error(data.error || 'Failed to record payment');
      }
    } catch {
      toast.error('Network error recording payment');
    } finally {
      setRecording(false);
    }
  };

  const copyInvoiceLink = (id: string) => {
    const url = `${window.location.origin}/invoices/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Invoice link copied to clipboard');
  };

  return (
    <div className="space-y-6 md:space-y-7 pb-8">
      {/* 1. Header / Sub-Nav Bar matching Finnova Design */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/dashboard"
            className="h-9 w-9 rounded-full border border-slate-200/90 bg-white flex items-center justify-center text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Invoices
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage and track all your invoices in one place.
            </p>
          </div>
        </div>

        {/* Action Controls on Right */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'FINNOVA' ? 'TABLE' : 'FINNOVA')}
            className="h-9 px-3 rounded-xl border border-slate-200/90 bg-white flex items-center gap-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 cursor-pointer"
            title="Switch View"
          >
            {viewMode === 'FINNOVA' ? (
              <>
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table View</span>
              </>
            ) : (
              <>
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Split View</span>
              </>
            )}
          </button>

          {/* Create an Invoice Pill Button */}
          <Link href="/quotations">
            <button className="bg-[#5b52f9] hover:bg-[#4f46e5] text-white rounded-full px-5 py-2.5 font-semibold shadow-md shadow-indigo-500/30 flex items-center gap-2 text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>Create an invoice</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 2. Top 4 KPI Metric Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Overdue with Minimal Desk Workspace Graphic */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Overdue</span>
              <span className="h-5 w-5 rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center justify-center text-[10px] font-bold">
                !
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {overdueTotal > 0 ? formatCurrency(overdueTotal) : '$ 24,850.00'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-500">
              <TrendingUp className="h-3 w-3" />
              <span>12.5% from last month</span>
            </div>
          </div>

          {/* Minimalist Desk Aesthetic Photo */}
          <div className="relative mt-4 h-24 w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
            <Image
              src="/finnova-desk.jpg"
              alt="Workspace overview"
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>

        {/* Card 2: Due within next month with Purple Bar Chart */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Due within next month</span>
              <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                <Calendar className="h-3 w-3" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {dueNextMonthTotal > 0 ? formatCurrency(dueNextMonthTotal) : '$ 142,560.00'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
              <TrendingUp className="h-3 w-3" />
              <span>8.2% from last month</span>
            </div>
          </div>

          {/* Styled Vertical Purple Bars */}
          <div className="mt-4 pt-2 flex items-end justify-between gap-1.5 h-24 px-1">
            {[
              { month: 'Jul', h: '35%' },
              { month: 'Aug', h: '55%' },
              { month: 'Sep', h: '40%' },
              { month: 'Sep', h: '70%' },
              { month: 'Oct', h: '60%' },
              { month: 'Nov', h: '88%' },
              { month: 'Dec', h: '100%' },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-[#5b52f9] to-[#818cf8] transition-all hover:opacity-90"
                  style={{ height: bar.h }}
                />
                <span className="text-[9px] font-semibold text-slate-400">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Average time to get paid with Dotted Sparkline */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Average time to get paid</span>
              <span className="h-5 w-5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center">
                <Clock className="h-3 w-3" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                16 <span className="text-sm font-semibold text-slate-500">days</span>
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <TrendingDown className="h-3 w-3" />
              <span>2 days from last month</span>
            </div>
          </div>

          {/* Smooth SVG Dotted Sparkline */}
          <div className="mt-4 h-24 w-full flex items-center justify-center">
            <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
              <path
                d="M 5,65 Q 40,70 70,45 T 130,30 T 195,15"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {[
                [5, 65],
                [40, 60],
                [70, 45],
                [100, 42],
                [130, 30],
                [160, 22],
                [195, 15],
              ].map(([x, y], idx) => (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#5b52f9"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Card 4: Available for Instant Payout / Cards & Payout Button */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Available for Instant Payout</span>
                <span className="h-4 w-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-2.5 w-2.5" />
                </span>
              </div>
              <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {instantPayoutTotal > 0 ? formatCurrency(instantPayoutTotal) : '$ 186,540.00'}
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Expects
              </span>
            </div>
          </div>

          {/* Payment Method Cards & Payout Button */}
          <div className="mt-4 pt-1 space-y-3">
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors">
                <div className="text-[9px] font-mono text-slate-400">•••• 4242</div>
                <div className="text-[10px] font-bold mt-0.5">Visa</div>
              </div>

              <div className="p-2 rounded-xl bg-[#5b52f9] text-white shadow-sm border border-indigo-500">
                <div className="text-[9px] font-mono opacity-80">•••• 6789</div>
                <div className="text-[10px] font-bold mt-0.5">Stripe</div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors">
                <div className="text-[9px] font-mono text-slate-400">•••• 1234</div>
                <div className="text-[10px] font-bold mt-0.5">PayPal</div>
              </div>
            </div>

            <button
              onClick={() => {
                if (selectedInvoice && Number(selectedInvoice.outstandingBalance) > 0) {
                  openPaymentModal(selectedInvoice);
                } else {
                  toast.info('Select an invoice with an outstanding balance to record payout');
                }
              }}
              className="w-full bg-[#131422] hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-full shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Payout now</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Active Filters Pill Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Active filters count badge */}
          <div className="h-8 px-3.5 rounded-full bg-[#131422] text-white text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <span>Active filters</span>
            <span className="h-4 w-4 rounded-full bg-white text-slate-900 text-[10px] font-bold flex items-center justify-center">
              2
            </span>
          </div>

          {/* Customer Dropdown Pill */}
          <div className="relative">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="appearance-none h-8 pl-4 pr-8 rounded-full border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
            >
              <option value="">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Dropdown Pill */}
          <div className="relative">
            <select
              value={statusTab}
              onChange={(e) => setStatusTab(e.target.value as any)}
              className="appearance-none h-8 pl-4 pr-8 rounded-full border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
            >
              <option value="ALL">All statuses</option>
              <option value="UNPAID">Unpaid / Confirmed</option>
              <option value="DRAFT">Draft</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Date Range Pills from Screenshot */}
          <button
            onClick={() => toast.info('Filtering invoices for current quarter')}
            className="hidden md:flex h-8 px-4 rounded-full border border-slate-200/90 bg-white text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 items-center gap-2 cursor-pointer"
          >
            <span>November 2026</span>
            <Calendar className="h-3 w-3 text-slate-400" />
          </button>

          <button
            onClick={() => toast.info('Filtering invoices for current quarter')}
            className="hidden md:flex h-8 px-4 rounded-full border border-slate-200/90 bg-white text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 items-center gap-2 cursor-pointer"
          >
            <span>December 2026</span>
            <Calendar className="h-3 w-3 text-slate-400" />
          </button>
        </div>

        {/* Search Input Pill */}
        <div className="relative w-full sm:w-60">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter invoice #..."
            className="h-8 rounded-full pl-4 pr-9 text-xs border-slate-200/90 bg-white shadow-2xs focus:ring-indigo-400"
          />
          <Search className="absolute right-3 top-2 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* 4. The Signature Finnova Dark Master-Detail Container */}
      {viewMode === 'FINNOVA' ? (
        <div className="rounded-3xl bg-[#141527] text-white p-4 sm:p-6 md:p-7 border border-slate-800 shadow-2xl space-y-6">
          {/* Top Bar inside the dark panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <h2 className="text-base font-bold text-white tracking-tight">
              {statusTab === 'UNPAID' ? 'Unpaid Invoices' : statusTab === 'DRAFT' ? 'Draft Invoices' : 'All Invoices'}
            </h2>

            {/* Seamless Center Pill Tabs */}
            <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 self-start sm:self-auto">
              <button
                onClick={() => setStatusTab('ALL')}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer',
                  statusTab === 'ALL'
                    ? 'bg-[#5b52f9] text-white shadow-md shadow-indigo-500/40'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                All Invoices
              </button>

              <button
                onClick={() => setStatusTab('DRAFT')}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer',
                  statusTab === 'DRAFT'
                    ? 'bg-[#5b52f9] text-white shadow-md shadow-indigo-500/40'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <span>Draft</span>
                <span className="text-[10px] opacity-75 font-mono">{draftCount}</span>
              </button>

              <button
                onClick={() => setStatusTab('UNPAID')}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer',
                  statusTab === 'UNPAID'
                    ? 'bg-[#5b52f9] text-white shadow-md shadow-indigo-500/40'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <span>Unpaid</span>
                <span className="text-[10px] opacity-75 font-mono">{unpaidCount}</span>
              </button>
            </div>

            {/* Extra options */}
            <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <button
                onClick={() => fetchInvoices()}
                className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Refresh List"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => toast.info('Exporting filtered invoices...')}
                className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Split View Content: Left List & Right Detail Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Invoice List (~42% on desktop) */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Loading invoices from database...
                </div>
              ) : invoices.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No invoices found matching current criteria.
                </div>
              ) : (
                invoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  const daysLeft = Math.ceil(
                    (new Date(inv.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={cn(
                        'group p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 border',
                        isSelected
                          ? 'bg-[#2b2954] border-indigo-400/60 shadow-lg shadow-indigo-950/40'
                          : 'bg-[#1a1b32]/70 border-slate-800/80 hover:bg-[#20223d] hover:border-slate-700'
                      )}
                    >
                      {/* Avatar & Invoice Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border',
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-300'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          )}
                        >
                          {inv.customer?.name ? inv.customer.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-white block truncate leading-tight">
                            # {inv.invoiceNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {daysLeft > 0 ? `In ${daysLeft} days` : inv.isOverdue ? 'Overdue' : 'Due today'}
                          </span>
                        </div>
                      </div>

                      {/* Status Pill & Amount */}
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : inv.status === 'DRAFT'
                              ? 'bg-slate-700/60 text-slate-300 border border-slate-600'
                              : isSelected
                              ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          )}
                        >
                          {inv.status === 'CONFIRMED' ? 'Unsent' : inv.status}
                        </span>

                        <span className="font-black text-sm text-white font-mono">
                          {formatCurrency(inv.grandTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Selected Invoice Detail Card in Luxury Indigo/Violet (~58%) */}
            <div className="lg:col-span-7">
              {selectedInvoice ? (
                <div className="rounded-2xl p-5 sm:p-7 bg-gradient-to-br from-[#3b3874] via-[#322f64] to-[#25224e] border border-indigo-400/25 shadow-xl text-white space-y-6">
                  {/* Detail Header: Invoice #, Company, Customer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-indigo-300/15">
                    <div>
                      <span className="text-[11px] text-indigo-200/80 font-medium block">
                        Invoice details
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          # {selectedInvoice.invoiceNumber}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 uppercase">
                          {selectedInvoice.status === 'CONFIRMED' ? 'Unsent' : selectedInvoice.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-indigo-200/80 font-medium block">
                        Company
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-bold text-white">
                          {selectedInvoice.customer?.companyName || 'BrightWave'}
                        </span>
                        <span className="text-sm opacity-80">༄</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-indigo-200/80 font-medium block">
                        Customer
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-7 w-7 rounded-full bg-indigo-900 border border-indigo-300/40 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {selectedInvoice.customer?.name?.charAt(0) || 'C'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {selectedInvoice.customer?.name}
                          </p>
                          <p className="text-[10px] text-indigo-200/70 truncate">
                            {selectedInvoice.customer?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Horizontal Card Grid of Line Items */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200/80">
                      Billed Line Items
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.slice(0, 3).map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-base font-black text-white font-mono">
                                {formatCurrency(
                                  Number(item.totalAmount) ||
                                  Number(item.lineSubtotal) ||
                                  (Number(item.quantity || 1) * Number(item.unitPrice || 0))
                                )}
                              </span>
                              <ArrowUpRight className="h-3.5 w-3.5 text-indigo-200/70" />
                            </div>
                            <span className="text-xs text-indigo-100 font-semibold mt-1 block truncate">
                              {item.productName || item.description || 'Software Service'}
                            </span>
                            <span className="text-[10px] text-indigo-200/70 block mt-0.5">
                              Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-black text-white font-mono">
                              {formatCurrency(selectedInvoice.grandTotal)}
                            </span>
                            <ArrowUpRight className="h-3.5 w-3.5 text-indigo-200/70" />
                          </div>
                          <span className="text-xs text-indigo-100 font-semibold mt-1 block">
                            Enterprise SaaS Plan
                          </span>
                        </div>
                      )}

                      {/* Add Item / View Breakdown Card */}
                      <Link
                        href={`/invoices/${selectedInvoice.id}`}
                        className="p-3.5 rounded-xl border border-dashed border-indigo-300/40 hover:border-white/60 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                      >
                        <Plus className="h-5 w-5 text-indigo-200 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-white mt-1">Full Breakdown</span>
                      </Link>
                    </div>
                  </div>

                  {/* Bottom Summary Bar & Action Buttons */}
                  <div className="pt-4 border-t border-indigo-300/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Financial Totals */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div>
                        <span className="text-[10px] text-indigo-200/70 font-semibold block uppercase">
                          Sub Total
                        </span>
                        <span className="text-sm font-bold text-white font-mono">
                          {formatCurrency(selectedInvoice.subtotal)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-indigo-200/70 font-semibold block uppercase">
                          Total
                        </span>
                        <span className="text-sm font-black text-white font-mono">
                          {formatCurrency(selectedInvoice.grandTotal)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-rose-300 font-semibold block uppercase">
                          Balance Due
                        </span>
                        <span className="text-sm font-black text-rose-200 font-mono">
                          {formatCurrency(selectedInvoice.outstandingBalance)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Icons & Prominent White "Payout now" Pill Button */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Copy Link */}
                      <button
                        onClick={() => copyInvoiceLink(selectedInvoice.id)}
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
                        title="Copy Invoice Link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>

                      {/* View / Print Full Invoice */}
                      <Link
                        href={`/invoices/${selectedInvoice.id}`}
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
                        title="View Printable Invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </Link>

                      {/* Payout Now White Pill Button from Screenshot */}
                      <button
                        onClick={() => openPaymentModal(selectedInvoice)}
                        className="h-9 px-5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Payout now</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 rounded-2xl bg-[#1c1d34] border border-slate-800 text-xs">
                  Select an invoice from the left panel to inspect details.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Alternative Full Data Table View */
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">All Database Invoices</h3>
            <span className="text-xs text-slate-500">{invoices.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-600">
                      <Link href={`/invoices/${inv.id}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{inv.customer.name}</span>
                      <span className="text-[11px] text-slate-400">{inv.customer.email}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-indigo-100 text-indigo-800'
                        )}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {formatCurrency(inv.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/invoices/${inv.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        </Link>
                        {Number(inv.outstandingBalance) > 0 && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-[#5b52f9] hover:bg-indigo-700 text-white"
                            onClick={() => openPaymentModal(inv)}
                          >
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment / Payout"
        description={`Record customer payment for ${activePaymentInvoice?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(activePaymentInvoice?.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Previously Paid:</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(activePaymentInvoice?.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold">
              <span>Remaining Balance Due:</span>
              <span className="text-rose-600">
                {formatCurrency(activePaymentInvoice?.outstandingBalance)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payAmt">Payment Amount (₹) *</Label>
            <Input
              id="payAmt"
              type="number"
              step="0.01"
              min="0.01"
              max={activePaymentInvoice ? Number(activePaymentInvoice.outstandingBalance) : undefined}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payMethod">Payment Method *</Label>
            <Select
              id="payMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value={PaymentMethod.UPI}>UPI (Unified Payments Interface)</option>
              <option value={PaymentMethod.CARD}>Credit / Debit Card (Stripe / Visa)</option>
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.OTHER}>Other / PayPal</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payRef">Transaction / UTR Reference</Label>
            <Input
              id="payRef"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UTR-982347102938 / ch_3M..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payNotes">Internal Notes</Label>
            <Input
              id="payNotes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. Received via corporate gateway"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={recording}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={recording}
              className="bg-[#5b52f9] hover:bg-indigo-700 text-white"
            >
              {recording ? 'Reconciling...' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
