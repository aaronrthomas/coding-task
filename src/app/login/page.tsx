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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 text-white items-center justify-center font-bold text-2xl shadow-md mb-2">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Brightloop Software
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to access your financial operations dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>
              Enter your corporate or customer credentials
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="text-center text-xs text-slate-500">
                Don&apos;t have a customer account?{' '}
                <Link href="/register" className="text-blue-600 hover:underline font-semibold">
                  Register here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Quick Demo Accounts Helper */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            Quick Demo Accounts (1-Click Fill)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@brightloop.com', 'AdminPass@2026')}
              className="text-left p-2 rounded border border-slate-200 hover:bg-blue-50/60 hover:border-blue-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                <ShieldCheck className="h-3 w-3 text-blue-600" />
                Admin
              </div>
              <div className="text-[10px] text-slate-500 truncate">admin@brightloop.com</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('sarah.staff@brightloop.com', 'StaffPass@2026')}
              className="text-left p-2 rounded border border-slate-200 hover:bg-blue-50/60 hover:border-blue-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                <UserCheck className="h-3 w-3 text-emerald-600" />
                Staff
              </div>
              <div className="text-[10px] text-slate-500 truncate">sarah.staff@...</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('alex@acmecorp.com', 'CustPass@2026!')}
              className="text-left p-2 rounded border border-slate-200 hover:bg-blue-50/60 hover:border-blue-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                <Users className="h-3 w-3 text-purple-600" />
                Customer
              </div>
              <div className="text-[10px] text-slate-500 truncate">alex@acmecorp.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
