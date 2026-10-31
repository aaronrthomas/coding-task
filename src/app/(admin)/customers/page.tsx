'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Plus,
  Eye,
  Archive,
  ChevronLeft,
  ChevronRight,
  Building,
  Mail,
  Phone,
} from 'lucide-react';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  billingAddress: string | null;
  taxId: string | null;
  isArchived: boolean;
  createdAt: string;
  _count: {
    subscriptions: number;
    invoices: number;
    payments: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // New Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTaxId, setNewTaxId] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?page=${page}&pageSize=10&search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotal(json.data.total);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          companyName: newCompany || null,
          phone: newPhone || null,
          billingAddress: newAddress || null,
          taxId: newTaxId || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Customer registered successfully');
        setIsModalOpen(false);
        // Reset form
        setNewName('');
        setNewEmail('');
        setNewCompany('');
        setNewPhone('');
        setNewAddress('');
        setNewTaxId('');
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to create customer');
      }
    } catch {
      toast.error('Network error during customer creation');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">
            Manage corporate clients, accounts, and subscription relationships ({total} total)
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Customer
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, company, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Customer Data Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Subscriptions</th>
                <th className="py-3 px-4 text-center">Invoices</th>
                <th className="py-3 px-4 text-center">Payments</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Loading customer accounts...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-semibold text-blue-600 hover:underline block"
                      >
                        {c.name}
                      </Link>
                      <span className="text-[11px] text-slate-400">{c.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      {c.companyName ? (
                        <span className="font-medium text-slate-800">{c.companyName}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {c.phone || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px]">
                        {c._count.subscriptions}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {c._count.invoices}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]">
                        {c._count.payments}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/customers/${c.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({total} records)
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

      {/* Add Customer Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer"
        description="Enter billing credentials and corporate info"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="custName">Customer / Contact Name *</Label>
            <Input
              id="custName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custEmail">Email Address *</Label>
            <Input
              id="custEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. john@enterprise.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="custCompany">Company Name</Label>
              <Input
                id="custCompany"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Enterprise Ltd"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custPhone">Phone Number</Label>
              <Input
                id="custPhone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custAddress">Billing Address</Label>
            <Input
              id="custAddress"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Street, City, State, Postal Code"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custTax">Tax ID / GSTIN</Label>
            <Input
              id="custTax"
              value={newTaxId}
              onChange={(e) => setNewTaxId(e.target.value)}
              placeholder="e.g. 29ABCDE1234F1Z5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Saving...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
