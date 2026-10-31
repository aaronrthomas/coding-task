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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 text-white items-center justify-center font-bold text-2xl shadow-md mb-2">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create Customer Account
          </h1>
          <p className="text-sm text-slate-500">
            Join Brightloop Software to manage subscriptions and invoices
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Customer Registration</CardTitle>
            <CardDescription>
              Enter your details to create your self-service account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="alex@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company">Company Name (Optional)</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="Acme Technologies Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
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

                {/* Password Criteria Checklist */}
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
                    <span>At least one special character (!@#$%^&amp;*...)</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" className="w-full" disabled={loading || !isPasswordValid}>
                {loading ? 'Creating Account...' : 'Complete Registration'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="text-center text-xs text-slate-500">
                Already registered?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-semibold">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
