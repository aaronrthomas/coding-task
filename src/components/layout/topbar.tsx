'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Play, LogOut, User as UserIcon, ShieldCheck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserSession } from '@/types';
import { toast } from 'sonner';

interface TopbarProps {
  user: UserSession;
}

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Derive human-readable section name from pathname
  const sectionName = pathname.split('/')[1] || 'Dashboard';
  const formattedSection = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success('Logged out successfully');
        router.push('/login');
        router.refresh();
      }
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleRunBillingNow = async () => {
    setIsBillingRunning(true);
    try {
      const res = await fetch('/api/billing/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `Billing engine executed: ${data.data.invoicesCreated} invoice(s) generated, ${data.data.skippedCount} skipped.`
        );
        router.refresh();
      } else {
        toast.error(data.error || 'Billing engine execution failed');
      }
    } catch {
      toast.error('Network error during billing run');
    } finally {
      setIsBillingRunning(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Contextual Breadcrumb / Title */}
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <span className="text-xs font-medium text-slate-400">Brightloop</span>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
          {formattedSection}
        </h1>
      </div>

      {/* Action Controls & User Account */}
      <div className="flex items-center gap-3">
        {/* Quick Trigger: Recurring Billing Engine */}
        {(user.role === 'ADMIN' || user.role === 'STAFF') && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunBillingNow}
            disabled={isBillingRunning}
            className="text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs h-8"
          >
            <Play className={`h-3 w-3 mr-1.5 ${isBillingRunning ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
            {isBillingRunning ? 'Processing Billing...' : 'Run Billing Engine'}
          </Button>
        )}

        {/* User Account Dropdown */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500">{user.role}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
