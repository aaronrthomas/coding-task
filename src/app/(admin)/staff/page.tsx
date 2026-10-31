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
import { UserCog, Plus, ShieldCheck, UserCheck, Check, X } from 'lucide-react';
import { Role } from '@prisma/client';

export default function StaffPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Password does not meet required complexity standards.');
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
        toast.success(data.message);
        setIsModalOpen(false);
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to create account');
      }
    } catch {
      toast.error('Network error creating staff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff &amp; Role Management</h1>
          <p className="text-sm text-slate-500">
            Manage administrative personnel and operational staff roles (Admin Only)
          </p>
        </div>

        <Button onClick={openCreateModal} className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Staff Account
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading personnel records...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No staff accounts found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                          u.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {u.role === 'ADMIN' ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-semibold text-xs">Active</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Staff Account"
        description="Creates an internal operations user with role-based access"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="stName">Full Name *</Label>
            <Input
              id="stName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stEmail">Corporate Email *</Label>
            <Input
              id="stEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah@brightloop.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stRole">Assigned Role *</Label>
            <Select
              id="stRole"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value={Role.STAFF}>STAFF (Day-to-day operations &amp; billing)</option>
              <option value={Role.ADMIN}>ADMIN (Full system &amp; config authority)</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stPass">Temporary Password *</Label>
            <Input
              id="stPass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <div className="pt-2 p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-600 mb-1">Complexity Requirements:</div>
              <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-700' : 'text-slate-500'}`}>
                {hasLength ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                <span>More than 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700' : 'text-slate-500'}`}>
                {hasUpper ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700' : 'text-slate-500'}`}>
                {hasLower ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                <span>At least one lowercase letter (a-z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700' : 'text-slate-500'}`}>
                {hasSpecial ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                <span>At least one special character</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !isPasswordValid}>
              {saving ? 'Creating Account...' : 'Provision Staff'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
