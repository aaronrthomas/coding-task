'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
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
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
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
      const res = await fetch(
        `/api/customers?page=${page}&pageSize=10&search=${encodeURIComponent(search)}`
      );
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

  const handleArchive = async (id: string, currentlyArchived: boolean) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !currentlyArchived }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Customer ${currentlyArchived ? 'unarchived' : 'archived'} successfully`);
        fetchCustomers();
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  // Filtered customers by tab
  const filteredCustomers = customers.filter((c) => {
    if (statusTab === 'ACTIVE') return !c.isArchived;
    if (statusTab === 'ARCHIVED') return c.isArchived;
    return true;
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
              Customers Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Manage enterprise clients, corporate billing contacts, and subscription accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add a customer</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: High Value Accounts with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Accounts Overdue</span>
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
              <span className="text-xs font-semibold text-slate-700">Active Billed Clients</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {total || 142} <span className="text-sm font-normal text-slate-500">clients</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>8.2% new client growth</span>
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
              <span className="text-xs font-semibold text-slate-700">Average Onboarding</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              16 <span className="text-sm font-normal text-slate-500">hours</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>2 days faster turnaround</span>
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
              <span className="text-xs font-semibold text-slate-700">Available Payout Pool</span>
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
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Corporate Subscriptions Total</div>
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
              onClick={() => setIsModalOpen(true)}
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Add Client
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

          <button
            onClick={() => {
              if (statusTab === 'ALL') setStatusTab('ACTIVE');
              else if (statusTab === 'ACTIVE') setStatusTab('ARCHIVED');
              else setStatusTab('ALL');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <span>Status: {statusTab}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>Corporate &amp; Enterprise</span>
            <Building className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, company, or email"
            className="rounded-full bg-white border-slate-200 pl-8 pr-4 text-xs h-9 shadow-2xs focus-visible:ring-indigo-500"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 4. Signature Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Enterprise Client Roster ({total})
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={cn(
                  'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                  statusTab === tab
                    ? 'bg-[#5b52f9] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {tab === 'ALL' ? 'All Customers' : tab === 'ACTIVE' ? 'Active' : 'Archived'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Subscriptions</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No customers match the current search or filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#1f2038] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={`/customers/${cust.id}`}
                            className="font-bold text-white hover:text-indigo-300 transition-colors"
                          >
                            {cust.name}
                          </Link>
                          {cust.isArchived && (
                            <span className="ml-2 text-[9px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded">
                              Archived
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">
                        {cust.companyName || 'Individual Account'}
                      </span>
                      {cust.taxId && (
                        <div className="text-[10px] text-slate-400">GST: {cust.taxId}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{cust.email}</div>
                      {cust.phone && <div className="text-[10px] text-slate-400">{cust.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {cust._count?.subscriptions || 0} active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(cust.createdAt)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/customers/${cust.id}`}>
                          <button
                            className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                            title="View customer profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleArchive(cust.id, cust.isArchived)}
                          className={cn(
                            'h-7 px-2 rounded-lg text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1',
                            cust.isArchived
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 hover:bg-white/20 text-slate-300'
                          )}
                          title={cust.isArchived ? 'Restore Customer' : 'Archive Customer'}
                        >
                          <Archive className="h-3 w-3" />
                          <span>{cust.isArchived ? 'Restore' : 'Archive'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({total} customers)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Register Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Enterprise Customer"
        description="Register a new customer organization or individual for billing and subscription management."
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="James Carter"
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email Address *</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="james@acmecorp.com"
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Company Name</Label>
              <Input
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Acme Corp LLC"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number</Label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Billing Address</Label>
            <Input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="100 Enterprise Way, Suite 400"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">GSTIN / Tax ID</Label>
            <Input
              value={newTaxId}
              onChange={(e) => setNewTaxId(e.target.value)}
              placeholder="29AAAAA0000A1Z5"
              className="text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={creating}
              className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white"
            >
              {creating ? 'Registering...' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
