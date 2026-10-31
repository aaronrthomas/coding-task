'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Key, Check, X, ArrowRight } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const hasLength = newPassword.length > 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error('Password does not meet required complexity standards.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        router.push('/login');
      } else {
        toast.error(data.error || 'Password reset failed');
      }
    } catch {
      toast.error('Network error during reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl sm:rounded-[32px] border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900">Set New Password</h2>
        <p className="text-xs text-slate-500">
          Enter your single-use reset token and choose a new secure password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="token" className="text-xs font-semibold text-slate-700">Reset Token</Label>
          <div className="relative">
            <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="token"
              type="text"
              placeholder="Paste token from reset email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#5b52f9] focus:ring-[#5b52f9] font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-slate-700">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#5b52f9] focus:ring-[#5b52f9]"
            />
          </div>

          <div className="pt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">Password Requirements:</div>
            <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              {hasLength ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
              <span>More than 8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              {hasUpper ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
              <span>At least one uppercase letter (A-Z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              {hasLower ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
              <span>At least one lowercase letter (a-z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              {hasSpecial ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
              <span>At least one special character</span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !isPasswordValid || !token}
          className="w-full h-11 rounded-full bg-[#5b52f9] hover:bg-[#483ef3] text-white font-semibold shadow-md shadow-[#5b52f9]/20 transition-all cursor-pointer"
        >
          {loading ? 'Updating Password...' : 'Save New Password'}
          {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>

        <div className="text-center text-xs text-slate-500 pt-1">
          Remembered your credentials?{' '}
          <Link href="/login" className="text-[#5b52f9] hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#edf0f7]">
      <div className="w-full max-w-lg space-y-6">
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
            Create New Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs">
            Verify token and update your credentials
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
