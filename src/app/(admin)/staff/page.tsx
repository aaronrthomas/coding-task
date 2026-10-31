'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  UserCog,
  Plus,
  ShieldCheck,
  UserCheck,
  Check,
  X,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function StaffPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.STAFF);
  const [saving, setSaving] = useState(false);

  // Real-time password criteria
  const hasLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      const json = await res.json();
      if (json.success) setUsers(json.data);
      else toast.error(json.error || 'Access denied');
    } catch {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole(Role.STAFF);
    setIsModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error('Please fulfill all password security rules');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`User ${name} created with role ${role}`);
        setIsModalOpen(false);
        fetchStaff();
      } else {
        toast.error(data.error || 'Creation failed');
      }
    } catch {
      toast.error('Network error during staff creation');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
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
              Staff &amp; RBAC Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Manage enterprise employees, role privileges, and authentication credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={openCreateModal}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add staff member</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overdue Balance with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Security Audit</span>
              <div className="h-5 w-5 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center text-xs font-bold">
                !
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              100% Compliant
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Argon2id password hashes active</span>
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
              <span className="text-xs font-semibold text-slate-700">Active Operators</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {users.length} <span className="text-sm font-normal text-slate-500">accounts</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>Full audit trail logging</span>
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
              <span className="text-xs font-semibold text-slate-700">Role Privilege Level</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              Strict RBAC
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>Protected routes verified</span>
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
              <span className="text-xs font-semibold text-slate-700">Operator Directory</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              Brightloop IAM
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Enterprise Staff Credentials</div>
          </div>
          <div className="flex items-center justify-between gap-1.5 pt-3">
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              Admin
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-[#5b52f9] text-white font-mono shadow-xs">
              Staff
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              Customer
            </div>
            <button
              onClick={openCreateModal}
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Add User
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-full px-3.5 py-1.5 pr-7 text-xs text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer focus:outline-hidden"
            >
              <option value="">All user roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="STAFF">Staff Operator</option>
              <option value="CUSTOMER">Customer Account</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span>Access Audit Verified</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name or email"
            className="rounded-full bg-white border-slate-200 pl-8 pr-4 text-xs h-9 shadow-2xs focus-visible:ring-indigo-500"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 4. Signature Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-5 md:p-7 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div className="text-base font-bold text-white tracking-wide">
            Staff Personnel Roster ({users.length})
          </div>

          <div className="flex items-center bg-[#1d1f36] rounded-full p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setRoleFilter('')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                roleFilter === ''
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              All Personnel
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                roleFilter === 'ADMIN'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Admins
            </button>
            <button
              onClick={() => setRoleFilter('STAFF')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
                roleFilter === 'STAFF'
                  ? 'bg-[#5b52f9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Staff
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Operator Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role Privileges</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading personnel...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1f2038] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase',
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : u.role === 'STAFF'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        )}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Staff Operator"
        description="Create employee credentials with role-based access control and password constraints."
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Full Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Miller"
              required
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Email Address *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@brightloop.com"
              required
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Initial Password *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 9 characters with upper, lower, and special"
              required
              className="text-xs"
            />
            {/* Live Password Strength indicator */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-600 mt-1">
              <div className="flex items-center gap-1.5">
                {hasLength ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                <span>9+ characters length</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasUpper ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasLower ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                <span>At least one lowercase letter (a-z)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasSpecial ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                <span>At least one special character (!@#$...)</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Assigned Role</Label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="text-xs"
            >
              <option value={Role.STAFF}>STAFF (Operational Invoicing &amp; CRM)</option>
              <option value={Role.ADMIN}>ADMIN (Full Configuration &amp; IAM)</option>
            </Select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving || !isPasswordValid}
              className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white"
            >
              {saving ? 'Creating...' : 'Provision Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
