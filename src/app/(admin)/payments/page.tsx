'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CheckCircle2,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import { PaymentMethod } from '@prisma/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments?page=${page}&pageSize=10`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotal(json.data.total);
      }
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const openCreateModal = async () => {
    try {
      const res = await fetch('/api/invoices?pageSize=100');
      const json = await res.json();
      if (json.success) {
        const eligible = json.data.items.filter((i: any) => Number(i.outstandingBalance) > 0);
        setUnpaidInvoices(eligible);
        if (eligible.length > 0) {
          setSelectedInvoiceId(eligible[0].id);
          setAmount(Number(eligible[0].outstandingBalance));
        }
      }
    } catch (err) {
      console.error(err);
    }
    setTransactionRef('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = unpaidInvoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(Number(inv.outstandingBalance));
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      toast.error('Please select an invoice with an outstanding balance');
      return;
    }
    setRecording(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount: Number(amount),
          paymentMethod,
          transactionRef: transactionRef || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Payment ${data.data.paymentReference} recorded successfully`);
        setIsModalOpen(false);
        fetchPayments();
      } else {
        toast.error(data.error || 'Failed to record payment');
      }
    } catch {
      toast.error('Network error recording payment');
    } finally {
      setRecording(false);
    }
  };

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.paymentReference.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.invoice?.invoiceNumber.toLowerCase().includes(search.toLowerCase());

    const matchesMethod = methodFilter ? p.paymentMethod === methodFilter : true;
    return matchesSearch && matchesMethod;
  });

  const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

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
              Payments &amp; Settlements
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Reconcile customer remittances, online transactions, and ledger settlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={openCreateModal}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record a payment</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overdue Balance with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Pending Remittances</span>
              <div className="h-5 w-5 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center text-xs font-bold">
                !
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(24850)}
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
              {formatCurrency(142560)}
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
              <span className="text-xs font-semibold text-slate-700">Settlement Speed</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              16 <span className="text-sm font-normal text-slate-500">hours</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>2 hours faster than avg</span>
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
              <span className="text-xs font-semibold text-slate-700">Available for Instant Payout</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(totalCollected || 186540)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Realized Cash Collections</div>
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
              onClick={openCreateModal}
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Payout now
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
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-full px-3.5 py-1.5 pr-7 text-xs text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer focus:outline-hidden"
            >
              <option value="">All payment methods</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="BANK_TRANSFER">Bank Wire</option>
              <option value="UPI">UPI NetBanking</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>Verified Settlements</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, client, or invoice"
            className="rounded-full bg-white border-slate-200 pl-8 pr-4 text-xs h-9 shadow-2xs focus-visible:ring-indigo-500"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 4. Signature Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Reconciled Payment Ledger ({total})
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setMethodFilter('')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                methodFilter === ''
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              All Methods
            </button>
            <button
              onClick={() => setMethodFilter('CARD')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                methodFilter === 'CARD'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Card
            </button>
            <button
              onClick={() => setMethodFilter('BANK_TRANSFER')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                methodFilter === 'BANK_TRANSFER'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Bank Wire
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Payment Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Method &amp; Txn Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No payment records match filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-[#1f2038] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white">{pmt.paymentReference}</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">Reconciled</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {pmt.customer?.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/invoices`}
                        className="font-medium text-indigo-300 hover:underline"
                      >
                        #{pmt.invoice?.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-slate-200">
                        {pmt.paymentMethod}
                      </span>
                      {pmt.transactionRef && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {pmt.transactionRef}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(pmt.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm">
                      +{formatCurrency(pmt.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({total} payments)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Received Payment"
        description="Allocate incoming funds to an invoice. Reconciles balances in real time."
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Target Invoice (with Balance)</Label>
            {unpaidInvoices.length === 0 ? (
              <p className="text-xs text-amber-600">No invoices currently have outstanding balances.</p>
            ) : (
              <Select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                required
                className="text-xs"
              >
                {unpaidInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.customer?.name} (Due: {formatCurrency(inv.outstandingBalance)})
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Payment Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="1"
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
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Wire / NEFT / RTGS</option>
              <option value={PaymentMethod.CARD}>Credit / Debit Card</option>
              <option value={PaymentMethod.UPI}>UPI NetBanking</option>
              <option value={PaymentMethod.OTHER}>Other / Cheque</option>
              <option value={PaymentMethod.CASH}>Cash</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Transaction Reference / UTR Number</Label>
            <Input
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UTR-9823478912"
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reconciliation Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal ledger or approval note"
              className="text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={recording || unpaidInvoices.length === 0}
              className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white"
            >
              {recording ? 'Reconciling...' : 'Confirm & Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
