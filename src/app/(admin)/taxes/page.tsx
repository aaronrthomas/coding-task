'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ReceiptIndianRupee, Plus, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ProductType } from '@prisma/client';

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
        isActive: true,
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
        toast.success(data.message || 'Tax rule saved');
        setIsModalOpen(false);
        fetchTaxes();
      } else {
        toast.error(data.error || 'Failed to save tax rule');
      }
    } catch {
      toast.error('Network error during tax save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this tax rule?')) return;
    try {
      const res = await fetch(`/api/taxes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Tax rule deactivated');
        fetchTaxes();
      }
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tax Management</h1>
          <p className="text-sm text-slate-500">
            Configure GST, VAT, and sales tax rules applied to recurring invoices
          </p>
        </div>

        <Button onClick={openCreateModal} className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Tax Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading tax rules...</div>
        ) : taxes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No tax rules configured. Click &quot;Add Tax Rule&quot; to define your rates.
          </div>
        ) : (
          taxes.map((t) => (
            <Card key={t.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      {t.name}
                    </CardTitle>
                    {t.applicableProductType && (
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        Applies to: {t.applicableProductType}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {t.description && (
                  <CardDescription className="text-xs mt-1">
                    {t.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Standard Rate</span>
                    <div className="text-2xl font-bold text-slate-900">
                      {t.rate}%
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    Calculated per invoice line
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Created {formatDate(t.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(t)}
                      className="h-7 text-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    {t.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(t.id)}
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

      {/* Tax Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTax ? 'Edit Tax Rule' : 'Create Tax Rule'}
        description="Applied automatically to eligible line items during billing"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="taxName">Tax Rule Name *</Label>
            <Input
              id="taxName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GST 18%"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">Tax Rate (%) *</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxType">Applicable Category</Label>
              <Select
                id="taxType"
                value={applicableProductType}
                onChange={(e) => setApplicableProductType(e.target.value)}
              >
                <option value="">All Product Categories</option>
                <option value={ProductType.SOFTWARE}>SOFTWARE</option>
                <option value={ProductType.SERVICE}>SERVICE</option>
                <option value={ProductType.SUBSCRIPTION_TIER}>SUBSCRIPTION_TIER</option>
                <option value={ProductType.HARDWARE}>HARDWARE</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="taxDesc">Description</Label>
            <Input
              id="taxDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Regulatory reference or notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingTax ? 'Update Tax Rule' : 'Create Tax Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
