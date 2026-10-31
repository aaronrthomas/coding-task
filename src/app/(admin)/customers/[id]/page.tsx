'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Archive,
  Calendar,
} from 'lucide-react';

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      const json = await res.json();
      if (json.success) {
        setCustomer(json.data);
      } else {
        toast.error(json.error || 'Customer not found');
      }
    } catch {
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this customer? Historical financial records will be preserved.')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        router.push('/customers');
      } else {
        toast.error(json.error || 'Failed to archive customer');
      }
    } catch {
      toast.error('Network error during archival');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading customer account details...</div>;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-500">Customer account not found.</p>
        <Link href="/customers">
          <Button variant="outline" size="sm">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Finnova Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                {customer.name}
              </h1>
              {customer.isArchived ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Archived</span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Active Client</span>
              )}
            </div>
            <p className="text-xs text-slate-400">Account profiles, recurring contracts, and invoice billing history</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
          className="h-9 px-4 rounded-full text-xs text-red-600 bg-white hover:bg-red-50 hover:text-red-700 border-red-200 shadow-2xs"
        >
          <Archive className="mr-1.5 h-3.5 w-3.5" />
          Archive Account
        </Button>
      </div>

      {/* Customer Header Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
                {customer.isArchived && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">Archived</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" />
                {customer.companyName || 'Individual Account'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{customer.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Customer since {formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>

          {(customer.billingAddress || customer.taxId) && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              {customer.billingAddress && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>Billing Address:</strong> {customer.billingAddress}</span>
                </div>
              )}
              {customer.taxId && (
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                  <span><strong>Tax ID / GSTIN:</strong> {customer.taxId}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Repeat className="h-4 w-4 text-blue-600" />
              Active &amp; Historical Subscriptions ({customer.subscriptions?.length ?? 0})
            </CardTitle>
            <CardDescription>All recurring contracts assigned to this client</CardDescription>
          </div>
          <Link href="/subscriptions">
            <Button variant="outline" size="sm" className="text-xs">
              + New Subscription
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-4">Subscription #</th>
                <th className="py-2.5 px-4">Plan</th>
                <th className="py-2.5 px-4">Frequency</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Next Billing</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customer.subscriptions?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No subscriptions found for this customer.
                  </td>
                </tr>
              ) : (
                customer.subscriptions?.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4">
                      <Link
                        href={`/subscriptions/${sub.id}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {sub.subscriptionNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-medium">{sub.plan.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{sub.billingFrequency}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={sub.status} /></td>
                    <td className="py-2.5 px-4 text-slate-500">{formatDate(sub.nextBillingDate)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold">{formatCurrency(sub.grandTotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Invoices Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-600" />
              Invoices &amp; Receivables ({customer.invoices?.length ?? 0})
            </CardTitle>
            <CardDescription>Billing history and outstanding balances</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-4 text-right">Paid</th>
                <th className="py-2.5 px-4 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customer.invoices?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                customer.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-2.5 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={inv.status} /></td>
                    <td className="py-2.5 px-4 text-right font-semibold">{formatCurrency(inv.grandTotal)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 font-medium">{formatCurrency(inv.amountPaid)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-red-600">
                      {formatCurrency(inv.outstandingBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Payments Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Payment History ({customer.payments?.length ?? 0})
            </CardTitle>
            <CardDescription>Collected and reconciled transactions</CardDescription>
          </div>
          <Link href="/payments">
            <Button variant="outline" size="sm" className="text-xs">
              + Record Payment
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Transaction Ref</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customer.payments?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No payment records logged.
                  </td>
                </tr>
              ) : (
                customer.payments?.map((pmt: any) => (
                  <tr key={pmt.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{pmt.paymentReference}</td>
                    <td className="py-2.5 px-4 text-slate-500">{formatDate(pmt.paymentDate)}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {pmt.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{pmt.transactionRef || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                      +{formatCurrency(pmt.amount)}
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
