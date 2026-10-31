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
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Set New Password</CardTitle>
        <CardDescription>
          Enter your single-use reset token and choose a new secure password.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="token">Reset Token</Label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="token"
                type="text"
                placeholder="Paste token from reset email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="pl-9 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pl-9"
              />
            </div>

            <div className="pt-2 p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-600 mb-1">Password Requirements:</div>
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2">
          <Button type="submit" className="w-full" disabled={loading || !isPasswordValid || !token}>
            {loading ? 'Updating Password...' : 'Save New Password'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          <div className="text-center text-xs text-slate-500">
            Remembered your credentials?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 text-white items-center justify-center font-bold text-2xl shadow-md mb-2">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-sm text-slate-500">
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
