'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Receipt, Eye, CreditCard, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { PaymentMethod } from '@prisma/client';

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer Checkout Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
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
        setInvoices(json.data.invoices);
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
    setActiveInvoice(inv);
    setAmount(Number(inv.outstandingBalance));
    setPaymentMethod(PaymentMethod.CARD);
    setTransactionRef(`TXN-WEB-${Date.now().toString().slice(-6)}`);
    setIsPayModalOpen(true);
  };

  const handleCustomerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: activeInvoice.id,
          amount: Number(amount),
          paymentMethod,
          transactionRef: transactionRef || null,
          notes: 'Customer online payment via Portal',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `Payment of ₹${Number(amount).toLocaleString()} confirmed! Invoice ${activeInvoice.invoiceNumber} updated.`
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

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Invoices</h1>
          <p className="text-sm text-slate-500">
            Review generated tax invoices, outstanding balances, and make online payments
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
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
                        <Link href={`/portal/invoices/${inv.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </Link>

                        {Number(inv.outstandingBalance) > 0 && inv.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                            onClick={() => openPaymentModal(inv)}
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            Pay Now
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
      </Card>

      {/* Customer Online Checkout Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pay Invoice Online"
        description={`Secure checkout for invoice ${activeInvoice?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCustomerPayment} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(activeInvoice?.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Already Paid:</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(activeInvoice?.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-indigo-200/60 font-bold">
              <span className="text-indigo-900">Outstanding Due:</span>
              <span className="text-red-600 text-sm">
                {formatCurrency(activeInvoice?.outstandingBalance)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custPayAmt">Payment Amount (₹) *</Label>
            <Input
              id="custPayAmt"
              type="number"
              step="0.01"
              min="0.01"
              max={activeInvoice ? Number(activeInvoice.outstandingBalance) : undefined}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custPayMethod">Payment Method *</Label>
            <Select
              id="custPayMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value={PaymentMethod.CARD}>Credit / Debit Card (Stripe Checkout)</option>
              <option value={PaymentMethod.UPI}>UPI (Google Pay, PhonePe, Paytm)</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Net Banking / NEFT</option>
              <option value={PaymentMethod.OTHER}>PayPal</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custPayRef">Reference / Confirmation Note</Label>
            <Input
              id="custPayRef"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. TXN-102938"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Secure 256-bit encrypted transaction. Immediate reconciliation.</span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPayModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              {submitting ? 'Processing Payment...' : `Pay ${formatCurrency(amount)}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
