'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, LogOut, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserSession } from '@/types';
import { toast } from 'sonner';

interface TopbarProps {
  user: UserSession;
}

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const [isBillingRunning, setIsBillingRunning] = useState(false);

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
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-slate-800 tracking-tight">
          Financial &amp; Subscription Operations
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick action: Trigger Recurring Billing Engine */}
        {(user.role === 'ADMIN' || user.role === 'STAFF') && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunBillingNow}
            disabled={isBillingRunning}
            className="text-xs font-medium border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50"
          >
            <Play className={`h-3.5 w-3.5 mr-1.5 ${isBillingRunning ? 'animate-spin' : 'text-blue-600'}`} />
            {isBillingRunning ? 'Processing Billing...' : 'Run Billing Engine'}
          </Button>
        )}

        {/* User Info & Role Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {user.name}
            </span>
            <span className="text-[11px] text-slate-500">{user.email}</span>
          </div>

          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium text-xs">
            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Log out"
            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
