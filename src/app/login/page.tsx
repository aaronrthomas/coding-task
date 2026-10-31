'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Welcome back, ${data.data.name}!`);
        router.push(data.data.redirectTo || '/dashboard');
        router.refresh();
      } else {
        toast.error(data.error || 'Invalid credentials');
      }
    } catch {
      toast.error('Network error during login');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    toast.info(`Filled credentials for ${demoEmail}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#edf0f7]">
      <div className="w-full max-w-lg space-y-6">
        {/* Finnova Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#5b52f9] via-[#7a70ff] to-[#a89eff] flex items-center justify-center shadow-lg shadow-[#5b52f9]/20 transform rotate-[-6deg]">
              <div className="h-4 w-4 bg-white/90 rounded-sm rotate-45 transform" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 uppercase">
                  Brightloop
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-white font-mono font-bold">
                  80
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smart Finances, Better Business</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-2">
            Welcome to Finnova Platform
          </h1>
          <p className="text-xs text-slate-500 max-w-xs">
            Unified billing, subscription lifecycle, and customer receivables for Admin, Staff &amp; Customers
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl sm:rounded-[32px] border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500">Enter your corporate credentials or customer portal login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#5b52f9] focus:ring-[#5b52f9]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#5b52f9] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#5b52f9] focus:ring-[#5b52f9]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-[#5b52f9] hover:bg-[#483ef3] text-white font-semibold shadow-md shadow-[#5b52f9]/20 transition-all cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="text-center text-xs text-slate-500 pt-1">
              New customer?{' '}
              <Link href="/register" className="text-[#5b52f9] hover:underline font-semibold">
                Register Customer Account
              </Link>
            </div>
          </form>

          {/* 1-Click Demo Accounts Selector */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Instant Demo Access
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                Click any card to fill
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@brightloop.com', 'AdminPass@2026')}
                className="text-left p-3 rounded-2xl border border-slate-200/90 hover:border-[#5b52f9] hover:bg-[#5b52f9]/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 text-[#5b52f9] flex items-center justify-center">
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#5b52f9]">Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">admin@brightloop.com</div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">Full Control</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('sarah.staff@brightloop.com', 'StaffPass@2026')}
                className="text-left p-3 rounded-2xl border border-slate-200/90 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <UserCheck className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">Staff</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">sarah.staff@...</div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">Billing &amp; Invoices</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('alex@acmecorp.com', 'CustPass@2026!')}
                className="text-left p-3 rounded-2xl border border-slate-200/90 hover:border-purple-500 hover:bg-purple-500/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Users className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-purple-600">Customer</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">alex@acmecorp.com</div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">Portal Self-Service</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
