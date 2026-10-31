'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Repeat,
  Eye,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
} from 'lucide-react';
import { QuotationStatus } from '@prisma/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuotationItem {
  id: string;
  quotationNumber: string;
  customerId: string;
  status: QuotationStatus;
  validUntil: string;
  notes: string | null;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  convertedSubscriptionId: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string };
  items: Array<{
    id: string;
    product: { name: string };
    variant?: { name: string } | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Quotation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<
    Array<{ productId: string; variantId: string; quantity: number; taxRate: number; discountAmount: number }>
  >([]);

  // Convert Modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingQuotation, setConvertingQuotation] = useState<QuotationItem | null>(null);
  const [convertPlanId, setConvertPlanId] = useState('');
  const [converting, setConverting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, cRes, pRes, plansRes] = await Promise.all([
        fetch('/api/quotations'),
        fetch('/api/customers?pageSize=100'),
        fetch('/api/products'),
        fetch('/api/plans'),
      ]);
      const [qJson, cJson, pJson, plansJson] = await Promise.all([
        qRes.json(),
        cRes.json(),
        pRes.json(),
        plansRes.json(),
      ]);

      if (qJson.success) setQuotations(qJson.data);
      if (cJson.success) setCustomers(cJson.data.items);
      if (pJson.success) setProducts(pJson.data);
      if (plansJson.success) setPlans(plansJson.data);
    } catch {
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setSelectedCustomer(customers[0]?.id || '');
    setValidityDays(30);
    setNotes('');
    if (products.length > 0) {
      setLineItems([
        {
          productId: products[0].id,
          variantId: products[0].variants?.[0]?.id || '',
          quantity: 1,
          taxRate: 18,
          discountAmount: 0,
        },
      ]);
    } else {
      setLineItems([]);
    }
    setIsModalOpen(true);
  };

  const addLine = () => {
    if (products.length > 0) {
      setLineItems([
        ...lineItems,
        {
          productId: products[0].id,
          variantId: products[0].variants?.[0]?.id || '',
          quantity: 1,
          taxRate: 18,
          discountAmount: 0,
        },
      ]);
    }
  };

  const removeLine = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, val: any) => {
    const updated = [...lineItems];
    (updated[idx] as any)[field] = val;

    if (field === 'productId') {
      const p = products.find((prod) => prod.id === val);
      updated[idx].variantId = p?.variants?.[0]?.id || '';
    }
    setLineItems(updated);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          validityDays: Number(validityDays),
          notes,
          items: lineItems.map((li) => ({
            productId: li.productId,
            variantId: li.variantId || null,
            quantity: Number(li.quantity),
            taxRate: Number(li.taxRate),
            discountAmount: Number(li.discountAmount),
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Quotation ${data.data.quotationNumber} generated`);
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create quotation');
      }
    } catch {
      toast.error('Network error during quotation creation');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: QuotationStatus) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update quotation');
      }
    } catch {
      toast.error('Error updating status');
    }
  };

  const openConvertModal = (q: QuotationItem) => {
    setConvertingQuotation(q);
    setConvertPlanId(plans[0]?.id || '');
    setConvertModalOpen(true);
  };

  const handleConvertQuotation = async () => {
    if (!convertingQuotation) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/quotations/${convertingQuotation.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: convertPlanId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        setConvertModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || 'Conversion failed');
      }
    } catch {
      toast.error('Network error during conversion');
    } finally {
      setConverting(false);
    }
  };

  const filteredQuotes = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? q.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const pipelineTotal = quotations.reduce((acc, q) => acc + Number(q.grandTotal || 0), 0);

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
              Estimates &amp; Quotations
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Draft commercial proposals, quote custom lines, and convert accepted deals into subscriptions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={openCreateModal}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create an estimate</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Expiring Estimates with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Expiring Estimates</span>
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
              <span className="text-xs font-semibold text-slate-700">Quoted Pipeline</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(pipelineTotal || 142560)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>8.2% proposal win rate</span>
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
              <span className="text-xs font-semibold text-slate-700">Proposal Close Cycle</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              16 <span className="text-sm font-normal text-slate-500">days</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>2 days faster close</span>
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
              <span className="text-xs font-semibold text-slate-700">Available for Conversion</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(186540)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Approved Quotes Pool</div>
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
              Draft Quote
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-full px-3.5 py-1.5 pr-7 text-xs text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer focus:outline-hidden"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>Commercial Deals</span>
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotation # or client"
            className="rounded-full bg-white border-slate-200 pl-8 pr-4 text-xs h-9 shadow-2xs focus-visible:ring-indigo-500"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 4. Signature Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Commercial Estimates Pipeline ({quotations.length})
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            {['', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                  statusFilter === st
                    ? 'bg-[#5b52f9] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {st === '' ? 'All Quotes' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading estimates...
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No quotations match search or filters.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[#1f2038] transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/quotations/${q.id}`}
                        className="font-bold text-white hover:text-indigo-300 transition-colors"
                      >
                        {q.quotationNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{q.customer?.name}</div>
                      <div className="text-[10px] text-slate-400">{q.customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300">{q.items?.length || 0} line item(s)</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(q.validUntil)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full',
                          q.status === 'ACCEPTED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : q.status === 'SENT'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        )}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {formatCurrency(q.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/quotations/${q.id}`}>
                          <button
                            className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                            title="View quote"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>

                        {q.status === 'DRAFT' && (
                          <button
                            onClick={() => handleUpdateStatus(q.id, QuotationStatus.SENT)}
                            className="h-7 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] cursor-pointer"
                          >
                            Mark Sent
                          </button>
                        )}

                        {q.status === 'SENT' && (
                          <button
                            onClick={() => handleUpdateStatus(q.id, QuotationStatus.ACCEPTED)}
                            className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] cursor-pointer"
                          >
                            Accept
                          </button>
                        )}

                        {q.status === 'ACCEPTED' && (
                          <button
                            onClick={() => openConvertModal(q)}
                            className="h-7 px-2.5 rounded-lg bg-[#5b52f9] hover:bg-[#4d44e8] text-white font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Repeat className="h-3 w-3" />
                            <span>Convert</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Draft Commercial Proposal"
        description="Configure client, pricing tiers, line items, and promotional terms."
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Client Organization</Label>
              <Select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                required
                className="text-xs"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Validity Window (Days)</Label>
              <Input
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Product Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Line
              </Button>
            </div>

            {lineItems.map((li, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label className="text-[10px]">Product</Label>
                    <Select
                      value={li.productId}
                      onChange={(e) => updateLine(idx, 'productId', e.target.value)}
                      className="text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px]">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={li.quantity}
                      onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={creating} className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white">
              {creating ? 'Drafting...' : 'Generate Quotation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Convert Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title={`Convert Quote #${convertingQuotation?.quotationNumber}`}
        description="Select the subscription plan cadence to activate this contract."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Subscription Plan</Label>
            <Select
              value={convertPlanId}
              onChange={(e) => setConvertPlanId(e.target.value)}
              className="text-xs"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.billingFrequency}) - {formatCurrency(p.basePrice)}
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setConvertModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvertQuotation}
              disabled={converting}
              className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white"
            >
              {converting ? 'Converting...' : 'Activate Subscription'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
