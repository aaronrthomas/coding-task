'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Printer, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { PaymentMethod } from '@prisma/client';

export default function CustomerInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const json = await res.json();
      if (json.success) {
        setInvoice(json.data);
        setAmount(Number(json.data.outstandingBalance));
      } else {
        toast.error(json.error || 'Invoice not found');
      }
    } catch {
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: Number(amount),
          paymentMethod,
          transactionRef: transactionRef || null,
          notes: 'Customer online payment via Portal',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Payment of ₹${Number(amount).toLocaleString()} confirmed!`);
        setIsPayModalOpen(false);
        fetchInvoice();
      } else {
        toast.error(data.error || 'Payment failed');
      }
    } catch {
      toast.error('Network error during payment submission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading invoice document...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-500">Invoice not found or access restricted.</p>
        <Link href="/portal/invoices"><Button variant="outline" size="sm">Back to Invoices</Button></Link>
      </div>
    );
  }

  const isOutstanding = Number(invoice.outstandingBalance) > 0 && invoice.status !== 'CANCELLED';

  return (
    <div className="space-y-6 pb-12">
      {/* Finnova Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/invoices"
            className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                Invoice {invoice.invoiceNumber}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-400">Customer billing breakdown and instant online settlement</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOutstanding && (
            <Button
              size="sm"
              className="h-9 px-5 rounded-full bg-[#5b52f9] hover:bg-[#483ef3] text-white font-semibold text-xs shadow-md shadow-[#5b52f9]/20 cursor-pointer"
              onClick={() => {
                setAmount(Number(invoice.outstandingBalance));
                setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
                setIsPayModalOpen(true);
              }}
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Pay Now ({formatCurrency(invoice.outstandingBalance)})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-4 rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Online Payment Callout Banner if Unpaid */}
      {isOutstanding && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#5b52f9] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#5b52f9]/30">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Payment Due: {formatCurrency(invoice.outstandingBalance)}
              </h4>
              <p className="text-xs text-slate-600">
                Due by <strong>{formatDate(invoice.dueDate)}</strong>. Pay online via Credit/Debit Card, UPI, or Net Banking.
              </p>
            </div>
          </div>

          <Button
            className="h-9 px-5 rounded-full bg-[#5b52f9] hover:bg-[#483ef3] text-white font-bold text-xs shadow-md shadow-[#5b52f9]/20 cursor-pointer"
            onClick={() => {
              setAmount(Number(invoice.outstandingBalance));
              setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
              setIsPayModalOpen(true);
            }}
          >
            Pay {formatCurrency(invoice.outstandingBalance)}
          </Button>
        </div>
      )}

      {/* Printable Invoice Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                B
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block">
                  Brightloop Software
                </span>
                <span className="text-xs text-slate-500">Enterprise Cloud Subscriptions</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              billing@brightloop.com | Tax ID: 29AABCB1234F1Z1
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
              INVOICE
            </h2>
            <div className="text-base font-bold text-indigo-600">{invoice.invoiceNumber}</div>
            <div className="pt-1">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
              Billed To:
            </span>
            <div className="text-sm font-bold text-slate-900">{invoice.customer.name}</div>
            {invoice.customer.companyName && (
              <div className="font-medium text-slate-700">{invoice.customer.companyName}</div>
            )}
            <div className="text-slate-500">{invoice.customer.email}</div>
            {invoice.customer.billingAddress && (
              <div className="text-slate-600 mt-1">{invoice.customer.billingAddress}</div>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
              Dates &amp; Terms:
            </span>
            <div>Invoice Date: <strong>{formatDate(invoice.invoiceDate)}</strong></div>
            <div>Due Date: <strong>{formatDate(invoice.dueDate)}</strong></div>
            <div>Billing Period: <strong>{formatDate(invoice.periodStart)} &ndash; {formatDate(invoice.periodEnd)}</strong></div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-2.5 px-4">Item</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                <th className="py-2.5 px-4 text-right">Tax</th>
                <th className="py-2.5 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoice.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.productName || item.description}</td>
                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{formatCurrency(item.taxAmount)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(item.totalAmount || item.lineSubtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="text-xs text-slate-500 max-w-sm">
            <p>{invoice.notes || 'Thank you for your business. For billing queries contact billing@brightloop.com.'}</p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax:</span>
              <span className="font-semibold">+{formatCurrency(invoice.totalTax)}</span>
            </div>
            {Number(invoice.totalDiscount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Amount Paid:</span>
              <span>-{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-red-600 pt-1 border-t border-slate-200">
              <span>Outstanding:</span>
              <span>{formatCurrency(invoice.outstandingBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Checkout Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pay Invoice Online"
        description={`Secure checkout for invoice ${invoice.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-bold text-slate-900">{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-indigo-200/60 font-bold">
              <span className="text-indigo-900">Remaining Balance:</span>
              <span className="text-red-600 text-sm">{formatCurrency(invoice.outstandingBalance)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payAmtDetail">Payment Amount (₹) *</Label>
            <Input
              id="payAmtDetail"
              type="number"
              step="0.01"
              min="0.01"
              max={Number(invoice.outstandingBalance)}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payMethodDetail">Payment Method *</Label>
            <Select
              id="payMethodDetail"
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
            <Label htmlFor="payRefDetail">Reference / Card Last 4</Label>
            <Input
              id="payRefDetail"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. TXN-102938"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Encrypted checkout. Reconciled immediately on company records.</span>
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
              {submitting ? 'Confirming...' : `Pay ${formatCurrency(amount)}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
