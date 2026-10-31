'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Building,
  Mail,
  Calendar,
  Receipt,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PaymentMethod } from '@prisma/client';

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recording, setRecording] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const json = await res.json();
      if (json.success) {
        setInvoice(json.data);
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

  const openPaymentModal = () => {
    setPaymentAmount(Number(invoice.outstandingBalance));
    setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    setTransactionRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecording(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: id,
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
        fetchInvoice();
      } else {
        toast.error(data.error || 'Failed to record payment');
      }
    } catch {
      toast.error('Network error during payment');
    } finally {
      setRecording(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading invoice document...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-500">Invoice not found.</p>
        <Link href="/invoices"><Button variant="outline" size="sm">Back to Invoices</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Finnova Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
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
            <p className="text-xs text-slate-400">Detailed tax breakdown, item ledger, and payment reconciliation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-4 rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print / PDF
          </Button>

          {Number(invoice.outstandingBalance) > 0 && invoice.status !== 'CANCELLED' && (
            <Button
              size="sm"
              onClick={openPaymentModal}
              className="h-9 px-5 rounded-full bg-[#5b52f9] hover:bg-[#483ef3] text-white font-semibold text-xs shadow-md shadow-[#5b52f9]/20"
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Invoice Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                B
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block">
                  Brightloop Software
                </span>
                <span className="text-xs text-slate-500">Financial Operations &amp; Cloud Subscriptions</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Tax ID / GSTIN: 29AABCB1234F1Z1<br />
              billing@brightloop.com | +91 80 4000 8000
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
              INVOICE
            </h2>
            <div className="text-base font-bold text-blue-600">{invoice.invoiceNumber}</div>
            <div className="flex items-center sm:justify-end gap-2 pt-1">
              <StatusBadge status={invoice.status} />
              {invoice.isOverdue && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                  OVERDUE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Billing Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-1.5">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
              Billed To:
            </span>
            <div className="text-sm font-bold text-slate-900">{invoice.customer.name}</div>
            {invoice.customer.companyName && (
              <div className="font-medium text-slate-700">{invoice.customer.companyName}</div>
            )}
            <div className="text-slate-500">{invoice.customer.email}</div>
            {invoice.customer.phone && <div className="text-slate-500">{invoice.customer.phone}</div>}
            {invoice.customer.billingAddress && (
              <div className="text-slate-600 mt-1">{invoice.customer.billingAddress}</div>
            )}
            {invoice.customer.taxId && (
              <div className="text-slate-500">Tax ID: {invoice.customer.taxId}</div>
            )}
          </div>

          <div className="sm:text-right space-y-1.5">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
              Invoice Summary:
            </span>
            <div className="text-slate-600">
              Invoice Date: <strong className="text-slate-900">{formatDate(invoice.invoiceDate)}</strong>
            </div>
            <div className="text-slate-600">
              Due Date: <strong className="text-slate-900">{formatDate(invoice.dueDate)}</strong>
            </div>
            <div className="text-slate-600">
              Billing Period:{' '}
              <strong className="text-slate-900">
                {formatDate(invoice.periodStart)} &ndash; {formatDate(invoice.periodEnd)}
              </strong>
            </div>
            {invoice.subscription && (
              <div className="text-slate-600">
                Subscription:{' '}
                <Link
                  href={`/subscriptions/${invoice.subscription.id}`}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  {invoice.subscription.subscriptionNumber}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                <th className="py-2.5 px-4 text-right">Tax Rate</th>
                <th className="py-2.5 px-4 text-right">Tax Amount</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoice.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.description}</td>
                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-4 text-right">{item.taxRate}%</td>
                  <td className="py-3 px-4 text-right text-slate-500">{formatCurrency(item.taxAmount)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Financial Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
          <div className="text-xs text-slate-500 max-w-sm space-y-1">
            <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Notes &amp; Terms:</span>
            <p>{invoice.notes || 'Payment is due within 15 days of invoice issue date.'}</p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs border-t sm:border-t-0 pt-4 sm:pt-0">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Total Tax (GST/VAT):</span>
              <span className="font-semibold text-slate-900">+{formatCurrency(invoice.totalTax)}</span>
            </div>

            {Number(invoice.totalDiscount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Applied Discount:</span>
                <span>-{formatCurrency(invoice.totalDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-semibold pt-1">
              <span>Amount Paid:</span>
              <span>-{formatCurrency(invoice.amountPaid)}</span>
            </div>

            <div className="flex justify-between text-sm font-bold text-red-600 pt-2 border-t border-slate-200">
              <span>Outstanding Balance:</span>
              <span>{formatCurrency(invoice.outstandingBalance)}</span>
            </div>
          </div>
        </div>

        {/* Recorded Payments History */}
        {invoice.payments?.length > 0 && (
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Recorded Payment History
            </h4>
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Reference</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Tx Ref</th>
                    <th className="py-2 px-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoice.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{p.paymentReference}</td>
                      <td className="py-2 px-3 text-slate-500">{formatDate(p.paymentDate)}</td>
                      <td className="py-2 px-3">{p.paymentMethod}</td>
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{p.transactionRef || '-'}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment against Invoice"
        description={`Record customer payment for ${invoice?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Previously Paid:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
              <span>Remaining Balance:</span>
              <span className="text-red-600">{formatCurrency(invoice.outstandingBalance)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invPayAmt">Payment Amount (₹) *</Label>
            <Input
              id="invPayAmt"
              type="number"
              step="0.01"
              min="0.01"
              max={Number(invoice.outstandingBalance)}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invPayMethod">Payment Method *</Label>
            <Select
              id="invPayMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
              <option value={PaymentMethod.UPI}>UPI</option>
              <option value={PaymentMethod.CARD}>Credit / Debit Card</option>
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.OTHER}>Other</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invPayRef">Transaction Reference</Label>
            <Input
              id="invPayRef"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UTR-1982736152"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invPayNotes">Notes</Label>
            <Input
              id="invPayNotes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Payment confirmation details"
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
