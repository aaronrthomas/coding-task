'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Layers, Plus, Edit3, Trash2, Calendar, Check, X, ShieldAlert } from 'lucide-react';
import { BillingFrequency } from '@prisma/client';

interface PlanItem {
  id: string;
  name: string;
  productId: string;
  description: string | null;
  price: number;
  billingFrequency: BillingFrequency;
  minQuantity: number;
  availableFrom: string | null;
  availableUntil: string | null;
  autoClose: boolean;
  canEarlyClose: boolean;
  canPause: boolean;
  canRenew: boolean;
  isActive: boolean;
  product: { id: string; name: string };
  _count?: { subscriptions: number };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(1500);
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>(BillingFrequency.MONTHLY);
  const [minQuantity, setMinQuantity] = useState(1);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [autoClose, setAutoClose] = useState(false);
  const [canEarlyClose, setCanEarlyClose] = useState(true);
  const [canPause, setCanPause] = useState(true);
  const [canRenew, setCanRenew] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, prodsRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/products'),
      ]);
      const plansJson = await plansRes.json();
      const prodsJson = await prodsRes.json();
      if (plansJson.success) setPlans(plansJson.data);
      if (prodsJson.success) setProducts(prodsJson.data);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setProductId(products[0]?.id || '');
    setDescription('');
    setPrice(1500);
    setBillingFrequency(BillingFrequency.MONTHLY);
    setMinQuantity(1);
    setAvailableFrom('');
    setAvailableUntil('');
    setAutoClose(false);
    setCanEarlyClose(true);
    setCanPause(true);
    setCanRenew(true);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: PlanItem) => {
    setEditingPlan(plan);
    setName(plan.name);
    setProductId(plan.productId);
    setDescription(plan.description || '');
    setPrice(Number(plan.price));
    setBillingFrequency(plan.billingFrequency);
    setMinQuantity(plan.minQuantity);
    setAvailableFrom(plan.availableFrom ? plan.availableFrom.slice(0, 10) : '');
    setAvailableUntil(plan.availableUntil ? plan.availableUntil.slice(0, 10) : '');
    setAutoClose(plan.autoClose);
    setCanEarlyClose(plan.canEarlyClose);
    setCanPause(plan.canPause);
    setCanRenew(plan.canRenew);
    setIsActive(plan.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        productId,
        description: description || null,
        price: Number(price),
        billingFrequency,
        minQuantity: Number(minQuantity),
        availableFrom: availableFrom || null,
        availableUntil: availableUntil || null,
        autoClose,
        canEarlyClose,
        canPause,
        canRenew,
        isActive,
      };

      const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Plan saved successfully');
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to save plan');
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscription Plans</h1>
          <p className="text-sm text-slate-500">
            Define recurring billing intervals, minimum quantities, and lifecycle rules
          </p>
        </div>

        <Button onClick={openCreateModal} className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading subscription plans...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No plans configured. Click &quot;Create Plan&quot; to define your first billing tier.
          </div>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {plan.billingFrequency}
                    </span>
                    <CardTitle className="text-base font-bold text-slate-900 mt-2">
                      {plan.name}
                    </CardTitle>
                    <span className="text-xs text-slate-500 font-medium">
                      Product: {plan.product?.name}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      plan.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {plan.description && (
                  <CardDescription className="text-xs mt-1.5 line-clamp-2">
                    {plan.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Recurring Rate</span>
                    <div className="text-xl font-bold text-slate-900">
                      {formatCurrency(plan.price)}
                      <span className="text-xs font-normal text-slate-500">/{plan.billingFrequency.toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span>Min Qty: <strong>{plan.minQuantity}</strong></span>
                  </div>
                </div>

                {/* Permissions & Lifecycle Policy */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    {plan.canPause ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3 text-slate-300" />}
                    <span>Allow Pausing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {plan.canEarlyClose ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3 text-slate-300" />}
                    <span>Allow Early Close</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {plan.canRenew ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3 text-slate-300" />}
                    <span>Allow Renewal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {plan.autoClose ? <Check className="h-3 w-3 text-blue-600" /> : <X className="h-3 w-3 text-slate-300" />}
                    <span>Auto-close on Expiry</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {plan._count?.subscriptions ?? 0} active subscriptions
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(plan)}
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

      {/* Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Plan Settings' : 'Create Subscription Plan'}
        description="Configure billing interval and lifecycle permissions"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="planName">Plan Name *</Label>
            <Input
              id="planName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pro Monthly Tier"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="planProd">Associated Product *</Label>
              <Select
                id="planProd"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="planFreq">Billing Frequency *</Label>
              <Select
                id="planFreq"
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
              >
                <option value={BillingFrequency.DAILY}>DAILY</option>
                <option value={BillingFrequency.WEEKLY}>WEEKLY</option>
                <option value={BillingFrequency.MONTHLY}>MONTHLY</option>
                <option value={BillingFrequency.YEARLY}>YEARLY</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="planPrice">Price per Cycle (₹) *</Label>
              <Input
                id="planPrice"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="planMinQty">Minimum Quantity</Label>
              <Input
                id="planMinQty"
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="planDesc">Plan Description</Label>
            <Input
              id="planDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Features, SLA, and terms"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pFrom">Available From</Label>
              <Input
                id="pFrom"
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pUntil">Available Until</Label>
              <Input
                id="pUntil"
                type="date"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
              />
            </div>
          </div>

          {/* Lifecycle Permissions Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <Label className="block mb-2 font-semibold text-slate-800">
              Lifecycle Permissions &amp; Policy:
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canPause}
                  onChange={(e) => setCanPause(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Allow Pausing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canEarlyClose}
                  onChange={(e) => setCanEarlyClose(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Allow Early Closure</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canRenew}
                  onChange={(e) => setCanRenew(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Allow Renewal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoClose}
                  onChange={(e) => setAutoClose(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Auto-Close on Expiration</span>
              </label>
            </div>
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
              {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
