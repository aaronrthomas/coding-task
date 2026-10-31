'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Printer } from 'lucide-react';

export default function CustomerInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchInvoice();
  }, [id]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/portal/invoices"
          className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to My Invoices
        </Link>

        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          Print / Save PDF
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-8 max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
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
            <div className="text-base font-bold text-blue-600">{invoice.invoiceNumber}</div>
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
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.description}</td>
                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{formatCurrency(item.taxAmount)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(item.lineTotal)}</td>
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
    </div>
  );
}
