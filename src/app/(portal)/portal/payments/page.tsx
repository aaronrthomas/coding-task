'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/portal/overview');
        const json = await res.json();
        if (json.success) {
          setPayments(json.data.payments);
        }
      } catch {
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment History</h1>
        <p className="text-sm text-slate-500">
          Receipts and transaction references for all recorded account collections
        </p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Payment Ref</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">UTR / Transaction Ref</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading payment history...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No payment receipts on file.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.paymentReference}</td>
                    <td className="py-3 px-4">
                      {p.invoice ? (
                        <Link href={`/portal/invoices/${p.invoice.id}`} className="text-blue-600 font-semibold hover:underline">
                          {p.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{p.transactionRef || '-'}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                      +{formatCurrency(p.amount)}
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
