'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Repeat,
  Search,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
} from 'lucide-react';
import { SubscriptionStatus } from '@prisma/client';

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
    // Load metadata for modals
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
          <p className="text-sm text-slate-500">
            Lifecycle management, recurring contracts, and billing automation ({total} total)
          </p>
        </div>

        <Button onClick={openCreateModal} className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Subscription
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by subscription #, customer, or plan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-44 text-xs"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PAUSED">PAUSED</option>
          <option value="CLOSED">CLOSED</option>
          <option value="DRAFT">DRAFT</option>
        </Select>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan &amp; Cadence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4 text-right">Cycle Total</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading subscriptions...</td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No subscriptions match search/filters.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/subscriptions/${sub.id}`}
                        className="font-semibold text-blue-600 hover:underline block"
                      >
                        {sub.subscriptionNumber}
                      </Link>
                      <span className="text-[10px] text-slate-400">
                        {sub._count?.invoices ?? 0} invoice(s)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{sub.customer.name}</span>
                      <span className="text-[11px] text-slate-400">{sub.customer.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{sub.plan.name}</span>
                      <span className="text-[11px] text-slate-500">{sub.billingFrequency}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(sub.nextBillingDate)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(sub.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/subscriptions/${sub.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500" title="View details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        {sub.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleTransition(sub.id, 'ACTIVATE')}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Activate
                          </Button>
                        )}

                        {sub.status === 'ACTIVE' && (
                          <>
                            {sub.plan.canPause && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] text-amber-700 bg-amber-50 border-amber-200"
                                onClick={() => handleTransition(sub.id, 'PAUSE')}
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </Button>
                            )}
                            {sub.plan.canEarlyClose && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] text-red-600 border-red-200"
                                onClick={() => handleTransition(sub.id, 'CLOSE')}
                              >
                                Close
                              </Button>
                            )}
                          </>
                        )}

                        {sub.status === 'PAUSED' && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-blue-600 text-white"
                            onClick={() => handleTransition(sub.id, 'RESUME')}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </Button>
                        )}

                        {sub.status === 'CLOSED' && sub.plan.canRenew && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] text-emerald-700 border-emerald-200 bg-emerald-50"
                            onClick={() => handleTransition(sub.id, 'RENEW')}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Renew
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({total} subscriptions)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Subscription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Subscription"
        description="Provision a direct recurring contract for a customer"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subCust">Select Customer *</Label>
            <Select
              id="subCust"
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subPlan">Select Subscription Plan *</Label>
            <Select
              id="subPlan"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              required
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.billingFrequency} ({formatCurrency(p.price)})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="subStart">Start Date *</Label>
              <Input
                id="subStart"
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subExpiry">Expiry Date (Optional)</Label>
              <Input
                id="subExpiry"
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Product & Variant Line Item */}
          <div className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
            <span className="font-semibold text-slate-800 block">Subscription Line Item:</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Product</Label>
                <Select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = products.find((prod) => prod.id === e.target.value);
                    setSelectedVariantId(p?.variants?.[0]?.id || '');
                  }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.salesPrice)})</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Variant</Label>
                <Select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                >
                  <option value="">None / Base</option>
                  {products
                    .find((p) => p.id === selectedProductId)
                    ?.variants?.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.name} (+₹{v.priceAdjustment})</option>
                    ))}
                </Select>
              </div>
            </div>

            <div className="w-24">
              <Label className="text-[11px]">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={newAutoClose}
              onChange={(e) => setNewAutoClose(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Auto-close subscription automatically upon reaching expiry date</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Subscription'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
