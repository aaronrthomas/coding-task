'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Package, Plus, Trash2, Edit3, CheckCircle2, XCircle, Layers } from 'lucide-react';
import { ProductType } from '@prisma/client';

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>(ProductType.SOFTWARE);
  const [salesPrice, setSalesPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
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
      { name: 'Odoo Extension', priceAdjustment: 560, isActive: true },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products &amp; Pricing</h1>
          <p className="text-sm text-slate-500">
            Configure catalog software products, cost bases, and add-on variant pricing
          </p>
        </div>

        <Button onClick={openCreateModal} className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading catalog products...</div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No products configured yet. Click &quot;Add Product&quot; to create one.
          </div>
        ) : (
          products.map((p) => (
            <Card key={p.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {p.type}
                    </span>
                    <CardTitle className="text-base font-bold text-slate-900 mt-2">
                      {p.name}
                    </CardTitle>
                  </div>
                  {p.isActive ? (
                    <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      <XCircle className="h-3 w-3 mr-1" /> Inactive
                    </span>
                  )}
                </div>
                {p.description && (
                  <CardDescription className="line-clamp-2 text-xs mt-1">
                    {p.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Pricing Info */}
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Base Sales Price</span>
                    <span className="text-base font-bold text-slate-900">
                      {formatCurrency(p.salesPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Cost Price</span>
                    <span className="text-slate-600 font-medium">
                      {formatCurrency(p.costPrice)}
                    </span>
                  </div>
                </div>

                {/* Variants List */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Variants ({p.variants.length})
                    </span>
                    <span>Adjusted Total</span>
                  </div>
                  {p.variants.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">No variants configured.</div>
                  ) : (
                    <div className="space-y-1">
                      {p.variants.map((v) => {
                        const finalUnitPrice = Number(p.salesPrice) + Number(v.priceAdjustment);
                        return (
                          <div
                            key={v.id || v.name}
                            className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50/60 border border-slate-100"
                          >
                            <span className="font-medium text-slate-800">{v.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-blue-600 font-semibold">
                                +{formatCurrency(v.priceAdjustment)}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">
                                = {formatCurrency(finalUnitPrice)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {p.plans.length} linked plan(s)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(p)}
                    className="h-7 text-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product Configuration' : 'Create New Product'}
        description="Base sales price and variant adjustments are validated on the server"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="pName">Product Name *</Label>
              <Input
                id="pName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Business Software"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pType">Product Type</Label>
              <Select
                id="pType"
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
              >
                <option value={ProductType.SOFTWARE}>SOFTWARE</option>
                <option value={ProductType.SERVICE}>SERVICE</option>
                <option value={ProductType.SUBSCRIPTION_TIER}>SUBSCRIPTION_TIER</option>
                <option value={ProductType.HARDWARE}>HARDWARE</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pSales">Base Sales Price (₹) *</Label>
              <Input
                id="pSales"
                type="number"
                step="0.01"
                min="0"
                value={salesPrice}
                onChange={(e) => setSalesPrice(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pCost">Cost Price (₹)</Label>
              <Input
                id="pCost"
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pDesc">Description / Notes</Label>
            <Input
              id="pDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enterprise software suite with modules"
            />
          </div>

          {/* Variants Configuration */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <Label>Product Variants &amp; Price Adjustments</Label>
                <p className="text-[11px] text-slate-500">
                  e.g. Odoo variant adds ₹560 adjustment to the base price
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariantRow}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Variant
              </Button>
            </div>

            {variants.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 rounded bg-slate-50 text-center">
                No variants added.
              </div>
            ) : (
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Variant name (e.g. Odoo)"
                      value={v.name}
                      onChange={(e) => updateVariantRow(idx, 'name', e.target.value)}
                      className="flex-1 text-xs"
                      required
                    />
                    <div className="flex items-center gap-1 w-36">
                      <span className="text-xs text-slate-400">+₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Adj."
                        value={v.priceAdjustment}
                        onChange={(e) =>
                          updateVariantRow(idx, 'priceAdjustment', parseFloat(e.target.value) || 0)
                        }
                        className="text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariantRow(idx)}
                      className="text-slate-400 hover:text-red-600 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
