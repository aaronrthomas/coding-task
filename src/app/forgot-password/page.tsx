'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        toast.success(data.message);
        if (data.devResetUrl) {
          setDevResetUrl(data.devResetUrl);
        }
      } else {
        toast.error(data.error || 'Failed to dispatch reset request');
      }
    } catch {
      toast.error('Network error occurred');
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
            Reset Account Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs">
            Recover access to your Brightloop Software financial operations workspace
          </p>
        </div>

        <div className="bg-white rounded-3xl sm:rounded-[32px] border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Forgot your password?</h2>
            <p className="text-xs text-slate-500">
              Enter your verified email and we will issue a secure single-use reset token.
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Reset Instructions Sent
                </div>
                <p className="text-xs text-emerald-700">
                  If an account exists with <strong>{email}</strong>, a password reset link has been dispatched.
                </p>
              </div>

              {devResetUrl && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 space-y-1.5">
                  <span className="font-bold text-[#5b52f9] uppercase tracking-wide block text-[10px]">
                    Development Testing Link:
                  </span>
                  <a
                    href={devResetUrl}
                    className="text-[#5b52f9] underline font-mono break-all hover:text-indigo-800"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full h-11 rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
                onClick={() => {
                  setSubmitted(false);
                  setDevResetUrl(null);
                }}
              >
                Send Another Request
              </Button>
            </div>
          ) : (
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-full bg-[#5b52f9] hover:bg-[#483ef3] text-white font-semibold shadow-md shadow-[#5b52f9]/20 transition-all cursor-pointer"
              >
                {loading ? 'Dispatching...' : 'Send Reset Link'}
                {!loading && <Send className="ml-2 h-4 w-4" />}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
