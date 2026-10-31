'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Receipt,
  Search,
  Plus,
  CreditCard,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recording, setRecording] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/invoices?page=${page}&pageSize=10&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (overdueOnly) url += `&overdue=true`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setInvoices(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotal(json.data.total);
      }
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, overdueOnly]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const openPaymentModal = (invoice: any) => {
    setActiveInvoice(invoice);
    setPaymentAmount(Number(invoice.outstandingBalance));
    setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    setTransactionRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setRecording(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: activeInvoice.id,
          amount: Number(paymentAmount),
          paymentMethod,
          transactionRef: transactionRef || null,
          notes: paymentNotes || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">
            Accounts receivable, billing schedules, and collections ({total} total)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by invoice #, customer name, subscription..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-40 text-xs"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PAID">PAID</option>
          <option value="CANCELLED">CANCELLED</option>
        </Select>

        <Button
          variant={overdueOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setOverdueOnly(!overdueOnly);
            setPage(1);
          }}
          className={`text-xs ${
            overdueOnly
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'text-red-600 border-red-200 hover:bg-red-50'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          {overdueOnly ? 'Overdue Filter Active' : 'Filter Overdue Only'}
        </Button>
      </div>

      {/* Invoices Data Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
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
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading invoice records...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No invoices found matching current criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-semibold text-blue-600 hover:underline block"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      {inv.subscription && (
                        <span className="text-[10px] text-slate-400">
                          {inv.subscription.subscriptionNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{inv.customer.name}</span>
                      <span className="text-[11px] text-slate-400">{inv.customer.email}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-3 px-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span>{formatDate(inv.dueDate)}</span>
                        {inv.isOverdue && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">
                      {formatCurrency(inv.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/invoices/${inv.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </Link>

                        {Number(inv.outstandingBalance) > 0 && inv.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => openPaymentModal(inv)}
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({total} invoices)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment against Invoice"
        description={`Record customer payment for ${activeInvoice?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(activeInvoice?.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Previously Paid:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(activeInvoice?.amountPaid)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
              <span>Remaining Balance:</span>
              <span className="text-red-600">{formatCurrency(activeInvoice?.outstandingBalance)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payAmt">Payment Amount (₹) *</Label>
            <Input
              id="payAmt"
              type="number"
              step="0.01"
              min="0.01"
              max={activeInvoice ? Number(activeInvoice.outstandingBalance) : undefined}
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
              <option value={PaymentMethod.CARD}>Credit / Debit Card</option>
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.OTHER}>Other</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payRef">Transaction / UTR Reference</Label>
            <Input
              id="payRef"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UTR-982347102938"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payNotes">Internal Notes</Label>
            <Input
              id="payNotes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. Received via HDFC corporate account"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={recording}>
              Cancel
            </Button>
            <Button type="submit" disabled={recording} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {recording ? 'Reconciling...' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
