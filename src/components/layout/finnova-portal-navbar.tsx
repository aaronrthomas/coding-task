'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Menu,
  X,
  LogOut,
  Receipt,
  User,
  CreditCard,
  Repeat,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { UserSession } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FinnovaPortalNavbarProps {
  user: UserSession;
}

export function FinnovaPortalNavbar({ user }: FinnovaPortalNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const portalNavItems = [
    { name: 'Overview', href: '/portal', prefix: '+' },
    { name: 'Invoices', href: '/portal/invoices', prefix: '✦' },
    { name: 'Subscriptions', href: '/portal/subscriptions', prefix: '' },
    { name: 'Payments', href: '/portal/payments', prefix: '' },
    { name: 'Profile', href: '/portal/profile', prefix: '' },
  ];

  const isCurrentActive = (href: string) => {
    if (href === '/portal') return pathname === '/portal';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="relative w-full pb-6">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <Link href="/portal" className="flex items-center gap-2.5 group">
            {/* Ribbon / Origami 'N' Style Logo from Reference */}
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
                  CUSTOMER
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-tight hidden sm:block mt-0.5">
                Self-Service Billing &amp; Subscriptions
              </span>
            </div>
          </Link>

          {/* Quick Notification Pill Badge */}
          <div className="hidden sm:flex items-center justify-center h-8 px-2.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-600 shadow-2xs">
            Portal
          </div>
        </div>

        {/* Center: The Signature Dark Pill Navigation Menu (Desktop) */}
        <nav className="hidden lg:flex items-center bg-[#131422] text-slate-300 rounded-full p-1.5 shadow-xl shadow-slate-900/10 border border-slate-800">
          {portalNavItems.map((item) => {
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
        </nav>

        {/* Right: Quick Action Square Badges & Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Icon: Invoices shortcut */}
          <Link
            href="/portal/invoices"
            title="My Invoices"
            className="hidden xl:flex h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 text-slate-600 items-center justify-center transition-all hover:scale-105"
          >
            <Receipt className="h-4 w-4" />
          </Link>

          {/* Return to Admin console (if admin or staff) */}
          {(user.role === Role.ADMIN || user.role === Role.STAFF) && (
            <Link
              href="/dashboard"
              title="Return to Admin Console"
              className="h-9 px-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium text-xs flex items-center gap-1.5 shadow-2xs hover:bg-indigo-100 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Quick Icon: Notifications (Bell with red unread dot) */}
          <button
            title="Account Notifications"
            onClick={() => toast.info('Account up to date. No pending billing alerts.')}
            className="relative h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative pl-1">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-900 to-indigo-900 text-white font-bold text-xs flex items-center justify-center shadow-sm border border-white">
                {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
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
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Customer
                    </span>
                  </div>

                  <Link
                    href="/portal/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    My Account Profile
                  </Link>

                  <Link
                    href="/portal/invoices"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Receipt className="h-4 w-4 text-slate-400" />
                    Invoices &amp; Receipts
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
            Customer Menu
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {portalNavItems.map((item) => {
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

          {(user.role === Role.ADMIN || user.role === Role.STAFF) && (
            <div className="pt-2 border-t border-slate-800">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-300 hover:bg-white/10 rounded-xl"
              >
                <LayoutDashboard className="h-4 w-4" />
                Return to Admin Console
              </Link>
            </div>
          )}

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
