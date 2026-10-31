'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CreditCard,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { PaymentMethod } from '@prisma/client';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Fetch unpaid invoices with outstanding balance
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
        toast.success(data.message);
        setIsModalOpen(false);
        fetchPayments();
      } else {
        toast.error(data.error || 'Failed to record payment');
      }
    } catch {
      toast.error('Network error during payment');
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments &amp; Collections</h1>
          <p className="text-sm text-slate-500">
            Reconciled payments and account balances ({total} records)
          </p>
        </div>

        <Button onClick={openCreateModal} className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Record Payment
        </Button>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Payment Ref</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Transaction / UTR</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading payments...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No payment records logged yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.paymentReference}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/invoices/${p.invoice.id}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {p.invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{p.customer.name}</span>
                      <span className="text-[11px] text-slate-400">{p.customer.email}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {p.transactionRef || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {p.recordedByUser ? p.recordedByUser.name : 'System'}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                      +{formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({total} payments)
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Customer Payment"
        description="Select an unpaid invoice and reconcile the collection"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payInv">Select Unpaid Invoice *</Label>
            {unpaidInvoices.length === 0 ? (
              <p className="text-xs text-emerald-600 p-2 rounded bg-emerald-50">
                All outstanding invoices are currently fully paid!
              </p>
            ) : (
              <Select
                id="payInv"
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                required
              >
                {unpaidInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.customer.name} (Due: {formatCurrency(inv.outstandingBalance)})
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payAmount">Amount to Record (₹) *</Label>
            <Input
              id="payAmount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payMeth">Payment Method *</Label>
            <Select
              id="payMeth"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value={PaymentMethod.UPI}>UPI (Google Pay / PhonePe / BHIM)</option>
              <option value={PaymentMethod.CARD}>Credit / Debit Card</option>
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.OTHER}>Other</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="txRef">Transaction Reference / UTR</Label>
            <Input
              id="txRef"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UTR-202610319876"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payNote">Internal Notes</Label>
            <Input
              id="payNote"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared via corporate account"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={recording}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={recording || unpaidInvoices.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {recording ? 'Reconciling...' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
