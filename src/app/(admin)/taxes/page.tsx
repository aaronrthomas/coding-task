'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ReceiptIndianRupee,
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
import { ProductType } from '@prisma/client';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [rate, setRate] = useState(18);
  const [description, setDescription] = useState('');
  const [applicableProductType, setApplicableProductType] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taxes');
      const json = await res.json();
      if (json.success) setTaxes(json.data);
    } catch {
      toast.error('Failed to load tax rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const openCreateModal = () => {
    setEditingTax(null);
    setName('GST 18%');
    setRate(18);
    setDescription('Standard Goods and Services Tax for SaaS software');
    setApplicableProductType(ProductType.SOFTWARE);
    setIsModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingTax(t);
    setName(t.name);
    setRate(Number(t.rate));
    setDescription(t.description || '');
    setApplicableProductType(t.applicableProductType || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        rate: Number(rate),
        description: description || null,
        applicableProductType: applicableProductType || null,
      };

      const url = editingTax ? `/api/taxes/${editingTax.id}` : '/api/taxes';
      const method = editingTax ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Tax rule saved successfully');
        setIsModalOpen(false);
        fetchTaxes();
      } else {
        toast.error(data.error || 'Failed to save tax rule');
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
              Tax Rates &amp; GST Rules
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Automated percentage tax calculations, applicable product categories, and statutory compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={openCreateModal}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create a tax rule</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tax Compliance with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Tax Compliance</span>
              <div className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              100% Automated
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>GST &amp; state taxation rules</span>
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
              <span className="text-xs font-semibold text-slate-700">Configured Rules</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {taxes.length} <span className="text-sm font-normal text-slate-500">rules</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>Standard 18% SaaS base</span>
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
              <span className="text-xs font-semibold text-slate-700">Effective Tax Rate</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              18.0% <span className="text-sm font-normal text-slate-500">blended</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>Indian GST Statutory Bracket</span>
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
              <span className="text-xs font-semibold text-slate-700">Statutory Tax Pool</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              Brightloop Tax
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Automated Invoice Application</div>
          </div>
          <div className="flex items-center justify-between gap-1.5 pt-3">
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              CGST
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-[#5b52f9] text-white font-mono shadow-xs">
              SGST
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              IGST
            </div>
            <button
              onClick={openCreateModal}
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Add Rule
            </button>
          </div>
        </div>
      </div>

      {/* 3. Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Statutory Tax Configurations ({taxes.length})
          </div>
        </div>

        {/* Taxes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tax Rule Name</th>
                <th className="py-3 px-4">Tax Rate (%)</th>
                <th className="py-3 px-4">Applicable Product Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading tax rules...
                  </td>
                </tr>
              ) : taxes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No tax rules found.
                  </td>
                </tr>
              ) : (
                taxes.map((t) => (
                  <tr key={t.id} className="hover:bg-[#1f2038] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                          <ReceiptIndianRupee className="h-4 w-4" />
                        </div>
                        <span>{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-300 text-sm">
                      {t.rate}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {t.applicableProductType || 'All Categories'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {t.description || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(t)}
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
        title={editingTax ? `Edit ${editingTax.name}` : 'Create Tax Rule'}
        description="Configure tax percentage rate and category targeting for recurring invoices."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Rule Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="GST 18%"
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rate (%) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Applicable Product Category</Label>
            <Select
              value={applicableProductType}
              onChange={(e) => setApplicableProductType(e.target.value)}
              className="text-xs"
            >
              <option value="">Apply to all products</option>
              <option value={ProductType.SOFTWARE}>Software licenses only</option>
              <option value={ProductType.SERVICE}>Services only</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goods and Services Tax statutory rule"
              className="text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white">
              {saving ? 'Saving...' : editingTax ? 'Save Changes' : 'Create Tax Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
