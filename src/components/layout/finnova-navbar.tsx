'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap,
  Bell,
  Settings,
  Calendar,
  Layers,
  Package,
  ReceiptIndianRupee,
  BarChart3,
  UserCog,
  Menu,
  X,
  LogOut,
  ChevronDown,
  FileText,
  Percent,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { UserSession } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FinnovaNavbarProps {
  user: UserSession;
}

export function FinnovaNavbar({ user }: FinnovaNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

  // Primary navigation pill items
  const primaryNavItems = [
    { name: 'Overview', href: '/dashboard', prefix: '+' },
    { name: 'Estimates', href: '/quotations', prefix: '' },
    { name: 'Invoices', href: '/invoices', prefix: '✦' },
    { name: 'Payments', href: '/payments', prefix: '' },
    { name: 'Recurring', href: '/subscriptions', prefix: '' },
    { name: 'Customers', href: '/customers', prefix: '' },
  ];

  // Secondary items in the "More" dropdown
  const secondaryNavItems = [
    { name: 'Products', href: '/products', icon: Package, roles: [Role.ADMIN, Role.STAFF] },
    { name: 'Plans', href: '/plans', icon: Layers, roles: [Role.ADMIN, Role.STAFF] },
    { name: 'Taxes', href: '/taxes', icon: ReceiptIndianRupee, roles: [Role.ADMIN] },
    { name: 'Discounts', href: '/discounts', icon: Percent, roles: [Role.ADMIN] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: [Role.ADMIN, Role.STAFF] },
    { name: 'Staff Management', href: '/staff', icon: UserCog, roles: [Role.ADMIN] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: [Role.ADMIN] },
  ].filter((item) => (item.roles as Role[]).includes(user.role));

  const isCurrentActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="relative w-full pb-6">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            {/* Ribbon / Origami 'N' Style Logo from Screenshot */}
            <div className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366f1] via-[#818cf8] to-[#4f46e5] text-white shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
              >
                <path
                  d="M4 18V6L12 14V6L20 14V18L12 10V18L4 18Z"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-none">
                  FINNOVA
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 hidden sm:inline-block">
                  BRIGHTLOOP
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-tight hidden sm:block mt-0.5">
                Smart Finances, Better Business
              </span>
            </div>
          </Link>

          {/* Quick Notification Pill Badge (from Screenshot: '80') */}
          <div className="hidden sm:flex items-center justify-center h-8 px-2.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-600 shadow-2xs">
            80
          </div>
        </div>

        {/* Center: The Signature Dark Pill Navigation Menu (Desktop) */}
        <nav className="hidden lg:flex items-center bg-[#131422] text-slate-300 rounded-full p-1.5 shadow-xl shadow-slate-900/10 border border-slate-800">
          {primaryNavItems.map((item) => {
            const active = isCurrentActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5',
                  active
                    ? 'bg-[#5b52f9] text-white shadow-md shadow-indigo-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                )}
              >
                {item.prefix && <span className="opacity-90">{item.prefix}</span>}
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* More Dropdown (for Products, Plans, Taxes, Reports, etc.) */}
          {secondaryNavItems.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1 cursor-pointer',
                  secondaryNavItems.some((i) => isCurrentActive(i.href))
                    ? 'bg-[#5b52f9]/30 text-indigo-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                )}
              >
                <span>More</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {isMoreOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMoreOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1b2e] border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Additional Modules
                    </div>
                    {secondaryNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isCurrentActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors',
                            active
                              ? 'text-white bg-indigo-600/30 font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-white/10'
                          )}
                        >
                          <Icon className="h-4 w-4 text-indigo-400" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Right: Quick Action Square Badges & Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Icon: Plans / Documents */}
          <Link
            href="/plans"
            title="Subscription Plans"
            className="hidden xl:flex h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 text-slate-600 items-center justify-center transition-all hover:scale-105"
          >
            <FileText className="h-4 w-4" />
          </Link>

          {/* Quick Icon: Run Billing Engine (Lightning Bolt) */}
          {(user.role === Role.ADMIN || user.role === Role.STAFF) && (
            <button
              onClick={handleRunBillingNow}
              disabled={isBillingRunning}
              title="Run Recurring Billing Engine"
              className={cn(
                'h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-indigo-50 hover:border-indigo-200 text-indigo-600 flex items-center justify-center transition-all hover:scale-105 cursor-pointer',
                isBillingRunning && 'animate-spin border-indigo-400 bg-indigo-50'
              )}
            >
              <Zap className="h-4 w-4 fill-indigo-600" />
            </button>
          )}

          {/* Quick Icon: Calendar / Schedules */}
          <Link
            href="/subscriptions"
            title="Billing Schedules"
            className="hidden xl:flex h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 text-slate-600 items-center justify-center transition-all hover:scale-105"
          >
            <Calendar className="h-4 w-4" />
          </Link>

          {/* Quick Icon: Products / Catalog */}
          <Link
            href="/products"
            title="Products Catalog"
            className="hidden xl:flex h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 text-slate-600 items-center justify-center transition-all hover:scale-105"
          >
            <Package className="h-4 w-4" />
          </Link>

          {/* Quick Icon: Taxes & Rules */}
          {user.role === Role.ADMIN && (
            <Link
              href="/taxes"
              title="Tax & Discount Rules"
              className="hidden xl:flex h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 text-slate-600 items-center justify-center transition-all hover:scale-105"
            >
              <ReceiptIndianRupee className="h-4 w-4" />
            </Link>
          )}

          {/* Quick Icon: Notifications (Bell with red unread dot) */}
          <button
            title="Notifications"
            onClick={() => toast.info('System operational. Billing engine healthy.')}
            className="relative h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Quick Icon: Settings Gear */}
          {user.role === Role.ADMIN && (
            <Link
              href="/settings"
              title="System Settings"
              className="hidden md:flex h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 text-slate-600 items-center justify-center transition-all hover:scale-105"
            >
              <Settings className="h-4 w-4" />
            </Link>
          )}

          {/* User Profile Avatar with Dropdown */}
          <div className="relative pl-1">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-900 to-indigo-900 text-white font-bold text-xs flex items-center justify-center shadow-sm border border-white">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {user.role}
                    </span>
                  </div>

                  {user.role === Role.ADMIN && (
                    <Link
                      href="/staff"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <UserCog className="h-4 w-4 text-slate-400" />
                      Staff Management
                    </Link>
                  )}

                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    Settings
                  </Link>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-slate-100 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Responsive Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 p-4 bg-[#131422] text-white rounded-2xl shadow-2xl border border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Main Operations
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {primaryNavItems.map((item) => {
              const active = isCurrentActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5',
                    active
                      ? 'bg-[#5b52f9] text-white shadow-md'
                      : 'text-slate-300 hover:bg-white/10'
                  )}
                >
                  {item.prefix && <span className="opacity-80">{item.prefix}</span>}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Configuration &amp; Reports
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium rounded-xl transition-all flex items-center gap-2',
                    active
                      ? 'bg-[#5b52f9]/40 text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/10'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center px-2">
            <span className="text-xs text-slate-400">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
