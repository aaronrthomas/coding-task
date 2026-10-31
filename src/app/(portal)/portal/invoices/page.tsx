'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Receipt, Eye } from 'lucide-react';

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
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
    };
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Invoices</h1>
        <p className="text-sm text-slate-500">
          Review generated tax invoices, outstanding dues, and payment confirmations
        </p>
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
                <th className="py-3 px-4 text-right">Document</th>
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
                      <Link href={`/portal/invoices/${inv.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View / Print
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
