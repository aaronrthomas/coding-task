'use client';

import { useState, useEffect } from 'react';
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
import { FileText, Plus, Trash2, ArrowRight, CheckCircle2, Repeat, Eye } from 'lucide-react';
import { QuotationStatus } from '@prisma/client';

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

    // Reset variant if product changes
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotations &amp; Proposals</h1>
          <p className="text-sm text-slate-500">
            Create custom subscription proposals and convert accepted quotes into recurring contracts
          </p>
        </div>

        <Button onClick={openCreateModal} className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Quotation
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading quotations...</td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No quotations generated yet.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-blue-600">
                      {q.quotationNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{q.customer.name}</span>
                      <span className="text-[11px] text-slate-400">{q.customer.email}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(q.validUntil)}</td>
                    <td className="py-3 px-4"><StatusBadge status={q.status} /></td>
                    <td className="py-3 px-4 text-right">{formatCurrency(q.subtotal)}</td>
                    <td className="py-3 px-4 text-right text-slate-500">+{formatCurrency(q.taxTotal)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(q.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {q.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => handleUpdateStatus(q.id, QuotationStatus.SENT)}
                          >
                            Mark Sent
                          </Button>
                        )}

                        {q.status === 'SENT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] text-emerald-700 border-emerald-200 bg-emerald-50"
                            onClick={() => handleUpdateStatus(q.id, QuotationStatus.ACCEPTED)}
                          >
                            Mark Accepted
                          </Button>
                        )}

                        {q.status === 'ACCEPTED' && !q.convertedSubscriptionId && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-blue-600 text-white"
                            onClick={() => openConvertModal(q)}
                          >
                            <Repeat className="h-3 w-3 mr-1" />
                            Convert to Sub
                          </Button>
                        )}

                        {q.convertedSubscriptionId && (
                          <Link href={`/subscriptions/${q.convertedSubscriptionId}`}>
                            <span className="text-[11px] font-semibold text-emerald-600 hover:underline">
                              View Sub
                            </span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Quotation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Quotation"
        description="Select customer, add products and variants, and calculate taxes"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qCust">Select Customer *</Label>
              <Select
                id="qCust"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qDays">Validity Period (Days)</Label>
              <Input
                id="qDays"
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value, 10) || 30)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qNotes">Notes / Terms</Label>
            <Input
              id="qNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Standard 30-day payment terms apply"
            />
          </div>

          {/* Line items builder */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-slate-800">Quotation Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Line
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {lineItems.map((item, idx) => {
                const currentProd = products.find((p) => p.id === item.productId);
                return (
                  <div key={idx} className="p-2.5 rounded border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 block mb-1">Product</span>
                        <Select
                          value={item.productId}
                          onChange={(e) => updateLine(idx, 'productId', e.target.value)}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatCurrency(p.salesPrice)})
                            </option>
                          ))}
                        </Select>
                      </div>

                      {currentProd?.variants && currentProd.variants.length > 0 && (
                        <div className="w-40">
                          <span className="text-[10px] text-slate-400 block mb-1">Variant</span>
                          <Select
                            value={item.variantId}
                            onChange={(e) => updateLine(idx, 'variantId', e.target.value)}
                          >
                            <option value="">Base Product</option>
                            {currentProd.variants.map((v: any) => (
                              <option key={v.id} value={v.id}>
                                {v.name} (+₹{v.priceAdjustment})
                              </option>
                            ))}
                          </Select>
                        </div>
                      )}

                      <div className="w-20">
                        <span className="text-[10px] text-slate-400 block mb-1">Qty</span>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                        />
                      </div>

                      <div className="w-20">
                        <span className="text-[10px] text-slate-400 block mb-1">Tax %</span>
                        <Input
                          type="number"
                          min="0"
                          value={item.taxRate}
                          onChange={(e) => updateLine(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(idx)}
                        className="text-slate-400 hover:text-red-600 mt-4 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Generating Quote...' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Convert to Subscription Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Convert Quotation to Subscription"
        description="Transforms the accepted quotation into an active recurring subscription contract."
      >
        <div className="space-y-4">
          <div className="p-3 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <div>Converting Quote: <strong>{convertingQuotation?.quotationNumber}</strong></div>
            <div>Customer: <strong>{convertingQuotation?.customer.name}</strong></div>
            <div>Total Contract Value: <strong>{formatCurrency(convertingQuotation?.grandTotal)}</strong></div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="convPlan">Select Target Subscription Plan *</Label>
            <Select
              id="convPlan"
              value={convertPlanId}
              onChange={(e) => setConvertPlanId(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.billingFrequency} ({formatCurrency(p.price)})
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setConvertModalOpen(false)} disabled={converting}>
              Cancel
            </Button>
            <Button onClick={handleConvertQuotation} disabled={converting}>
              {converting ? 'Creating Subscription...' : 'Confirm Conversion'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
