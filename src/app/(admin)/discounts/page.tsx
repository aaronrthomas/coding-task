'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Percent,
  Plus,
  Edit3,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ChevronDown,
  Search,
} from 'lucide-react';
import { DiscountType } from '@prisma/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<DiscountType>(DiscountType.PERCENTAGE);
  const [value, setValue] = useState(10);
  const [minPurchase, setMinPurchase] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/discounts');
      const json = await res.json();
      if (json.success) setDiscounts(json.data);
    } catch {
      toast.error('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setCode('PROMO2026');
    setName('Enterprise Promotion');
    setType(DiscountType.PERCENTAGE);
    setValue(15);
    setMinPurchase(1000);
    setMaxUses(50);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (d: any) => {
    setEditingDiscount(d);
    setCode(d.code);
    setName(d.name);
    setType(d.type);
    setValue(Number(d.value));
    setMinPurchase(d.minPurchase ? Number(d.minPurchase) : '');
    setMaxUses(d.maxUses ? Number(d.maxUses) : '');
    setStartDate(d.startDate ? d.startDate.slice(0, 10) : '');
    setEndDate(d.endDate ? d.endDate.slice(0, 10) : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code,
        name,
        type,
        value: Number(value),
        minPurchase: minPurchase !== '' ? Number(minPurchase) : null,
        maxUses: maxUses !== '' ? Number(maxUses) : null,
        startDate: startDate || null,
        endDate: endDate || null,
      };

      const url = editingDiscount ? `/api/discounts/${editingDiscount.id}` : '/api/discounts';
      const method = editingDiscount ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Discount saved successfully');
        setIsModalOpen(false);
        fetchDiscounts();
      } else {
        toast.error(data.error || 'Failed to save discount');
      }
    } catch {
      toast.error('Network error during save');
    } finally {
      setSaving(false);
    }
  };

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
              Coupons &amp; Promotional Discounts
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Configure promotional coupons, threshold rules, and subscription discounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={openCreateModal}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create a coupon</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Promo Savings with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Promo Redemption</span>
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
              <span className="text-xs font-semibold text-slate-700">Active Campaign Rules</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {discounts.length} <span className="text-sm font-normal text-slate-500">campaigns</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>8.2% customer uptake</span>
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
              <span className="text-xs font-semibold text-slate-700">Average Savings</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              15.0% <span className="text-sm font-normal text-slate-500">average</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>Balanced margin protection</span>
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
              <span className="text-xs font-semibold text-slate-700">Active Coupons</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              PROMO2026
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Live Checkout Codes</div>
          </div>
          <div className="flex items-center justify-between gap-1.5 pt-3">
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              15% OFF
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-[#5b52f9] text-white font-mono shadow-xs">
              SAVE10
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              FLAT500
            </div>
            <button
              onClick={openCreateModal}
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Add Code
            </button>
          </div>
        </div>
      </div>

      {/* 3. Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Promotional Coupons ({discounts.length})
          </div>
        </div>

        {/* Discounts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Min Spend Requirement</th>
                <th className="py-3 px-4">Redemption Count</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading discounts...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No active discount codes.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-[#1f2038] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                          <Percent className="h-4 w-4" />
                        </div>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                          {d.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">
                      {d.name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `₹${d.value} FLAT`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {d.minPurchase ? formatCurrency(d.minPurchase) : 'No Minimum'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {d.currentUses} {d.maxUses ? `/ ${d.maxUses}` : 'uses'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(d)}
                        className="h-7 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] cursor-pointer inline-flex items-center gap-1 transition-all"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscount ? `Edit ${editingDiscount.code}` : 'Create Promotional Coupon'}
        description="Configure promotional codes with percentage or fixed discount values."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Coupon Code *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO2026"
                required
                className="text-xs font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Campaign Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enterprise Q1 Special"
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Discount Type *</Label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as DiscountType)}
                className="text-xs"
              >
                <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                <option value={DiscountType.FIXED}>Fixed Amount (₹)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Value ({type === 'PERCENTAGE' ? '%' : '₹'}) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Min Purchase Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 1000"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Maximum Uses</Label>
              <Input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : '')}
                placeholder="Unlimited if blank"
                className="text-xs"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white">
              {saving ? 'Saving...' : editingDiscount ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
