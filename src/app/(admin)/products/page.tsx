'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
} from 'lucide-react';
import { ProductType } from '@prisma/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Variant {
  id?: string;
  name: string;
  priceAdjustment: number;
  isActive: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  type: ProductType;
  salesPrice: number;
  costPrice: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  variants: Variant[];
  plans: { id: string; name: string }[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>(ProductType.SOFTWARE);
  const [salesPrice, setSalesPrice] = useState(2000);
  const [costPrice, setCostPrice] = useState(800);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<Variant[]>([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setType(ProductType.SOFTWARE);
    setSalesPrice(2000);
    setCostPrice(800);
    setDescription('');
    setIsActive(true);
    setVariants([
      { name: 'Enterprise Add-on', priceAdjustment: 560, isActive: true },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setName(prod.name);
    setType(prod.type);
    setSalesPrice(Number(prod.salesPrice));
    setCostPrice(Number(prod.costPrice));
    setDescription(prod.description || '');
    setIsActive(prod.isActive);
    setVariants(prod.variants.map((v) => ({ ...v, priceAdjustment: Number(v.priceAdjustment) })));
    setIsModalOpen(true);
  };

  const addVariantRow = () => {
    setVariants([...variants, { name: '', priceAdjustment: 0, isActive: true }]);
  };

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantRow = (index: number, field: keyof Variant, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        type,
        salesPrice: Number(salesPrice),
        costPrice: Number(costPrice),
        description: description || null,
        isActive,
        variants: variants.filter((v) => v.name.trim().length > 0),
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Product saved successfully');
        setIsModalOpen(false);
        fetchProducts();
      } else {
        toast.error(data.error || 'Failed to save product');
      }
    } catch {
      toast.error('Network error during save');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? p.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

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
              Products &amp; Pricing
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Configure software licenses, base sales prices, cost bases, and add-on variant pricing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={openCreateModal}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add a product</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overdue Balance with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Catalog Volume</span>
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
              <span className="text-xs font-semibold text-slate-700">Active SKUs</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {products.length} <span className="text-sm font-normal text-slate-500">products</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>8.2% new items added</span>
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
              <span className="text-xs font-semibold text-slate-700">Gross Margin</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              74% <span className="text-sm font-normal text-slate-500">average</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>Healthy SaaS gross margin</span>
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
              <span className="text-xs font-semibold text-slate-700">Catalog Valuation</span>
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
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Recurring License Portfolio</div>
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
              Add SKU
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-full px-3.5 py-1.5 pr-7 text-xs text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer focus:outline-hidden"
            >
              <option value="">All product types</option>
              <option value="SOFTWARE">Software</option>
              <option value="SERVICE">Service</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>Brightloop SaaS Catalog</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name..."
            className="rounded-full bg-white border-slate-200 pl-8 pr-4 text-xs h-9 shadow-2xs focus-visible:ring-indigo-500"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 4. Signature Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Catalog Products ({products.length})
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setTypeFilter('')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                typeFilter === ''
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              All Products
            </button>
            <button
              onClick={() => setTypeFilter('SOFTWARE')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                typeFilter === 'SOFTWARE'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Software
            </button>
            <button
              onClick={() => setTypeFilter('SERVICE')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                typeFilter === 'SERVICE'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Services
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Sales Price</th>
                <th className="py-3 px-4">Cost Basis</th>
                <th className="py-3 px-4">Add-On Variants</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#1f2038] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <div>{p.name}</div>
                          {p.description && (
                            <div className="text-[10px] text-slate-400 font-normal">{p.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {formatCurrency(p.salesPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatCurrency(p.costPrice)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.variants && p.variants.length > 0 ? (
                          p.variants.map((v, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10 font-mono"
                            >
                              {v.name} (+₹{v.priceAdjustment})
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(p)}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Create Catalog Product'}
        description="Specify sales prices, cost basis, and optional customer add-on variants."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Product Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Brightloop Analytics Pro"
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Product Type *</Label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
                className="text-xs"
              >
                <option value={ProductType.SOFTWARE}>Software License</option>
                <option value={ProductType.SERVICE}>Managed Service / Consulting</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Sales Price (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={salesPrice}
                onChange={(e) => setSalesPrice(Number(e.target.value))}
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cost Basis (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Product Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enterprise subscription module"
              className="text-xs"
            />
          </div>

          {/* Variants section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Add-on Variants</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariantRow} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Variant
              </Button>
            </div>

            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Input
                  placeholder="Variant name"
                  value={v.name}
                  onChange={(e) => updateVariantRow(i, 'name', e.target.value)}
                  className="text-xs flex-1"
                />
                <Input
                  type="number"
                  placeholder="+₹ Adjustment"
                  value={v.priceAdjustment}
                  onChange={(e) => updateVariantRow(i, 'priceAdjustment', Number(e.target.value))}
                  className="text-xs w-28"
                />
                <button
                  type="button"
                  onClick={() => removeVariantRow(i)}
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white">
              {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
