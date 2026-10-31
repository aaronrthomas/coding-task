'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  ReceiptIndianRupee,
  BarChart3,
  UserCog,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { cn } from '@/lib/utils';
import { UserSession } from '@/types';

interface SidebarProps {
  user: UserSession;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  // Define sidebar navigation items and role permissions
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: [Role.ADMIN, Role.STAFF],
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      roles: [Role.ADMIN, Role.STAFF],
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      roles: [Role.ADMIN, Role.STAFF],
    },
    {
      name: 'Plans',
      href: '/plans',
      icon: Layers,
      roles: [Role.ADMIN, Role.STAFF],
    },
    {
      name: 'Quotations',
      href: '/quotations',
      icon: FileText,
      roles: [Role.ADMIN, Role.STAFF],
    },
    {
      name: 'Subscriptions',
      href: '/subscriptions',
      icon: Repeat,
      roles: [Role.ADMIN, Role.STAFF],
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: Receipt,
      roles: [Role.ADMIN, Role.STAFF],
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: CreditCard,
      roles: [Role.ADMIN, Role.STAFF],
    },
    {
      name: 'Discounts',
      href: '/discounts',
      icon: Percent,
      roles: [Role.ADMIN],
    },
    {
      name: 'Taxes',
      href: '/taxes',
      icon: ReceiptIndianRupee,
      roles: [Role.ADMIN],
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: [Role.ADMIN, Role.STAFF],
    },
    {
      name: 'Staff Management',
      href: '/staff',
      icon: UserCog,
      roles: [Role.ADMIN],
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: [Role.ADMIN],
    },
  ];

  // Filter items based on user role
  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            B
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm tracking-tight block">
              Brightloop
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Software Billing
            </span>
          </div>
        </Link>
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          {user.role}
        </span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Operations
        </div>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Billing Engine: <strong className="text-emerald-700">Active</strong></span>
        </div>
      </div>
    </aside>
  );
}
