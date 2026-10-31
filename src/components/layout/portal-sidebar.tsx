'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Repeat,
  Receipt,
  CreditCard,
  User,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserSession } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function PortalSidebar({ user }: { user: UserSession }) {
  const pathname = usePathname();
  const router = useRouter();

  const portalNav = [
    { name: 'Overview', href: '/portal', icon: LayoutDashboard },
    { name: 'My Subscriptions', href: '/portal/subscriptions', icon: Repeat },
    { name: 'My Invoices', href: '/portal/invoices', icon: Receipt },
    { name: 'Payment History', href: '/portal/payments', icon: CreditCard },
    { name: 'Account Profile', href: '/portal/profile', icon: User },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-screen">
      <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
        <Link href="/portal" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            B
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm tracking-tight block">
              Brightloop
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Customer Portal
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Self Service
        </div>
        {portalNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 rounded-l-none'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-blue-600' : 'text-slate-400'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
              {user.name}
            </span>
            <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
              {user.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Log out"
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
