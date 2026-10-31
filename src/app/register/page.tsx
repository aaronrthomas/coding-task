'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Mail, User, Building, Check, X, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time password criteria
  const hasLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error('Please meet all password requirements before submitting.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, companyName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Registration successful! Redirecting to portal...');
        router.push('/portal');
        router.refresh();
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch {
      toast.error('Network error during registration');
    } finally {
      setLoading(false);
    }
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
            Create Customer Account
          </h1>
          <p className="text-xs text-slate-500 max-w-xs">
            Join the customer self-service billing portal to review subscriptions, invoices, and instant checkout
          </p>
        </div>

        <div className="bg-white rounded-3xl sm:rounded-[32px] border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Customer Onboarding</h2>
            <p className="text-xs text-slate-500">
              Enter your details to create your self-service account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#5b52f9] focus:ring-[#5b52f9]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#5b52f9] focus:ring-[#5b52f9]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs font-semibold text-slate-700">Company Name (Optional)</Label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Acme Technologies Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#5b52f9] focus:ring-[#5b52f9]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
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

              {/* Password Criteria Checklist */}
              <div className="pt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">Security Requirements:</div>
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
                  <span>At least one special character (!@#$%^&amp;*...)</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full h-11 rounded-full bg-[#5b52f9] hover:bg-[#483ef3] text-white font-semibold shadow-md shadow-[#5b52f9]/20 transition-all cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="text-center text-xs text-slate-500 pt-1">
              Already registered?{' '}
              <Link href="/login" className="text-[#5b52f9] hover:underline font-semibold">
                Sign in to your account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
