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
import { Percent, Plus, Edit3, Trash2, Tag, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { DiscountType } from '@prisma/client';

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
    setName('New Year Promotional');
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
    setMaxUses(d.maxUses !== null ? d.maxUses : '');
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
        isWholeSubscription: true,
        isActive: true,
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
      toast.error('Network error saving discount');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this discount rule?')) return;
    try {
      const res = await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Discount deactivated');
        fetchDiscounts();
      }
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Discount Rules</h1>
          <p className="text-sm text-slate-500">
            Define fixed or percentage coupon rules, usage limits, and automatic billing application
          </p>
        </div>

        <Button onClick={openCreateModal} className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Discount Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading discount rules...</div>
        ) : discounts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No discount rules configured. Click &quot;Create Discount Rule&quot; to add one.
          </div>
        ) : (
          discounts.map((d) => (
            <Card key={d.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {d.code}
                    </span>
                    <CardTitle className="text-base font-bold text-slate-900 mt-2">
                      {d.name}
                    </CardTitle>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      d.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Value</span>
                    <div className="text-xl font-bold text-slate-900">
                      {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `₹${d.value} OFF`}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span>Usage: <strong>{d.currentUses}</strong> / {d.maxUses ? d.maxUses : '∞'}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {d.minPurchase && (
                    <div>Min Purchase: <strong>{formatCurrency(d.minPurchase)}</strong></div>
                  )}
                  <div>
                    Validity:{' '}
                    {d.startDate ? formatDate(d.startDate) : 'Now'} &rarr;{' '}
                    {d.endDate ? formatDate(d.endDate) : 'No expiration'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {d._count?.usages ?? 0} time(s) applied
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(d)}
                      className="h-7 text-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    {d.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(d.id)}
                        className="h-7 text-xs text-red-600 hover:bg-red-50"
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscount ? 'Edit Discount Rule' : 'Create Discount Rule'}
        description="Discounts are applied transactionally with usage tracking"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discCode">Coupon Code *</Label>
              <Input
                id="discCode"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. FLASH20"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discName">Rule Name *</Label>
              <Input
                id="discName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Flash 20% Discount"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discType">Discount Type</Label>
              <Select
                id="discType"
                value={type}
                onChange={(e) => setType(e.target.value as DiscountType)}
              >
                <option value={DiscountType.PERCENTAGE}>PERCENTAGE (%)</option>
                <option value={DiscountType.FIXED}>FIXED AMOUNT (₹)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discVal">Discount Value *</Label>
              <Input
                id="discVal"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discMin">Minimum Purchase (₹)</Label>
              <Input
                id="discMin"
                type="number"
                placeholder="Optional minimum"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discMax">Max Usage Limit</Label>
              <Input
                id="discMax"
                type="number"
                placeholder="Unlimited if empty"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dStart">Start Date</Label>
              <Input
                id="dStart"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dEnd">End Date</Label>
              <Input
                id="dEnd"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingDiscount ? 'Update Discount' : 'Create Discount'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
