'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Search,
  Plus,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Repeat,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { SubscriptionStatus } from '@prisma/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // New Subscription Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newAutoClose, setNewAutoClose] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/subscriptions?page=${page}&pageSize=10&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setSubscriptions(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotal(json.data.total);
      }
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cRes, pRes, prodsRes] = await Promise.all([
          fetch('/api/customers?pageSize=100'),
          fetch('/api/plans'),
          fetch('/api/products'),
        ]);
        const [cJson, pJson, prodsJson] = await Promise.all([
          cRes.json(),
          pRes.json(),
          prodsRes.json(),
        ]);
        if (cJson.success) setCustomers(cJson.data.items);
        if (pJson.success) setPlans(pJson.data);
        if (prodsJson.success) setProducts(prodsJson.data);
      } catch (err) {
        console.error('Failed to fetch modal metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  const openCreateModal = () => {
    setNewCustomer(customers[0]?.id || '');
    setNewPlan(plans[0]?.id || '');
    setNewStartDate(new Date().toISOString().slice(0, 10));
    setNewExpiryDate('');
    setNewAutoClose(false);
    setSelectedProductId(products[0]?.id || '');
    setSelectedVariantId(products[0]?.variants?.[0]?.id || '');
    setQuantity(1);
    setIsModalOpen(true);
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: newCustomer,
          planId: newPlan,
          startDate: newStartDate,
          expiryDate: newExpiryDate || null,
          autoClose: newAutoClose,
          items: [
            {
              productId: selectedProductId,
              variantId: selectedVariantId || null,
              quantity: Number(quantity),
            },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Subscription ${data.data.subscriptionNumber} created successfully`);
        setIsModalOpen(false);
        fetchSubscriptions();
      } else {
        toast.error(data.error || 'Failed to create subscription');
      }
    } catch {
      toast.error('Network error during creation');
    } finally {
      setCreating(false);
    }
  };

  const handleTransition = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        fetchSubscriptions();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  // KPI calculations
  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const mrrTotal = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((acc, s) => acc + Number(s.grandTotal || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Subheader: Back Button, Title, Subtitle, and Primary Action Pill */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/dashboard"
            className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-all shadow-2xs hover:scale-105"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Recurring Subscriptions
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Manage customer contracts, automated billing intervals, and subscription renewals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={openCreateModal}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create a subscription</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Expiring Contracts with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Expiring / Overdue</span>
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
              <span className="text-xs font-semibold text-slate-700">Due within next month</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {formatCurrency(mrrTotal || 142560)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>8.2% from last month</span>
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
              <span className="text-xs font-semibold text-slate-700">Retention &amp; Renewals</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              16 <span className="text-sm font-normal text-slate-500">days avg</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>2 days faster turnaround</span>
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
              <span className="text-xs font-semibold text-slate-700">Available for Instant Payout</span>
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
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Recurring Subscriptions Pool</div>
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
              Payout now
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-white border border-slate-200 rounded-full px-3.5 py-1.5 pr-7 text-xs text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer focus:outline-hidden"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed</option>
              <option value="DRAFT">Draft</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>November 2026</span>
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>December 2026</span>
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Enter subscription # or client"
            className="rounded-full bg-white border-slate-200 pl-8 pr-4 text-xs h-9 shadow-2xs focus-visible:ring-indigo-500"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 4. Signature Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Active Subscriptions ({total})
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            {['', 'ACTIVE', 'PAUSED', 'DRAFT'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={cn(
                  'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                  statusFilter === st
                    ? 'bg-[#5b52f9] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {st === '' ? 'All Subscriptions' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Subscriptions */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Contract #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan &amp; Cadence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4 text-right">Cycle Cost</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No subscriptions match search/filters.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#1f2038] transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/subscriptions/${sub.id}`}
                        className="font-bold text-white hover:text-indigo-300 transition-colors"
                      >
                        {sub.subscriptionNumber}
                      </Link>
                      <div className="text-[10px] text-slate-400">
                        {sub._count?.invoices ?? 0} invoice(s) generated
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{sub.customer?.name}</div>
                      <div className="text-[11px] text-slate-400">{sub.customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{sub.plan?.name}</div>
                      <div className="text-[10px] text-indigo-300">{sub.billingFrequency}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full',
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : sub.status === 'PAUSED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        )}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {formatDate(sub.nextBillingDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {formatCurrency(sub.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/subscriptions/${sub.id}`}>
                          <button
                            className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>

                        {sub.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleTransition(sub.id, 'ACTIVATE')}
                            className="h-7 text-[11px] px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="h-3 w-3" />
                            <span>Activate</span>
                          </button>
                        )}

                        {sub.status === 'ACTIVE' && (
                          <>
                            {sub.plan?.canPause && (
                              <button
                                onClick={() => handleTransition(sub.id, 'PAUSE')}
                                className="h-7 text-[11px] px-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <Pause className="h-3 w-3" />
                                <span>Pause</span>
                              </button>
                            )}
                            {sub.plan?.canEarlyClose && (
                              <button
                                onClick={() => handleTransition(sub.id, 'CLOSE')}
                                className="h-7 text-[11px] px-2.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 font-medium cursor-pointer"
                              >
                                Close
                              </button>
                            )}
                          </>
                        )}

                        {sub.status === 'PAUSED' && (
                          <button
                            onClick={() => handleTransition(sub.id, 'RESUME')}
                            className="h-7 text-[11px] px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="h-3 w-3" />
                            <span>Resume</span>
                          </button>
                        )}

                        {sub.status === 'CLOSED' && sub.plan?.canRenew && (
                          <button
                            onClick={() => handleTransition(sub.id, 'RENEW')}
                            className="h-7 text-[11px] px-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Renew</span>
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({total} subscriptions)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Subscription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Recurring Subscription"
        description="Bind a customer to a subscription plan with recurring cadence and product lines."
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Customer</Label>
            <Select
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              required
              className="text-xs"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Subscription Plan</Label>
            <Select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              required
              className="text-xs"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.billingFrequency}) - {formatCurrency(p.basePrice)}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Product Line Item</Label>
            <Select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const prod = products.find((p) => p.id === e.target.value);
                setSelectedVariantId(prod?.variants?.[0]?.id || '');
              }}
              required
              className="text-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={creating}
              className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white"
            >
              {creating ? 'Creating...' : 'Create Subscription'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
