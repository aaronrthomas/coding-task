'use client';

import { useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { cn } from '@/lib/utils';
import { UserSession } from '@/types';

interface SidebarProps {
  user: UserSession;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sections = [
    {
      title: 'Operations',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.STAFF] },
        { name: 'Customers', href: '/customers', icon: Users, roles: [Role.ADMIN, Role.STAFF] },
        { name: 'Subscriptions', href: '/subscriptions', icon: Repeat, roles: [Role.ADMIN, Role.STAFF] },
        { name: 'Invoices', href: '/invoices', icon: Receipt, roles: [Role.ADMIN, Role.STAFF] },
        { name: 'Payments', href: '/payments', icon: CreditCard, roles: [Role.ADMIN, Role.STAFF] },
        { name: 'Quotations', href: '/quotations', icon: FileText, roles: [Role.ADMIN, Role.STAFF] },
      ],
    },
    {
      title: 'Catalog & Billing',
      items: [
        { name: 'Products', href: '/products', icon: Package, roles: [Role.ADMIN, Role.STAFF] },
        { name: 'Plans', href: '/plans', icon: Layers, roles: [Role.ADMIN, Role.STAFF] },
        { name: 'Taxes', href: '/taxes', icon: ReceiptIndianRupee, roles: [Role.ADMIN] },
        { name: 'Discounts', href: '/discounts', icon: Percent, roles: [Role.ADMIN] },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Reports', href: '/reports', icon: BarChart3, roles: [Role.ADMIN, Role.STAFF] },
        { name: 'Staff Management', href: '/staff', icon: UserCog, roles: [Role.ADMIN] },
        { name: 'Settings', href: '/settings', icon: Settings, roles: [Role.ADMIN] },
      ],
    },
  ];

  const renderNavContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            BL
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm tracking-tight leading-tight">
              Brightloop
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Subscription Billing
            </span>
          </div>
        </Link>
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {user.role}
        </span>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            (item.roles as Role[]).includes(user.role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
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
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-500">Billing Engine</span>
            <span className="text-xs font-semibold text-emerald-700">Online &amp; Idempotent</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="h-9 w-9 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700"
          title="Toggle Navigation"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-white h-full z-50 shadow-2xl flex flex-col">
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white flex-col shrink-0 min-h-screen">
        {renderNavContent()}
      </aside>
    </>
  );
}
