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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 text-white items-center justify-center font-bold text-2xl shadow-md mb-2">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-slate-500">
            Recover access to your Brightloop Software account
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Forgot your password?</CardTitle>
            <CardDescription>
              Enter your verified email and we will issue a secure single-use reset token.
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="space-y-4 pt-2">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Reset Instructions Sent
                </div>
                <p className="text-xs text-emerald-700">
                  If an account exists with <strong>{email}</strong>, a password reset link has been dispatched.
                </p>
              </div>

              {devResetUrl && (
                <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                  <span className="font-bold text-blue-700 uppercase tracking-wide block text-[10px]">
                    Development Testing Link:
                  </span>
                  <a
                    href={devResetUrl}
                    className="text-blue-600 underline font-mono break-all hover:text-blue-800"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubmitted(false);
                  setDevResetUrl(null);
                }}
              >
                Send Another Request
              </Button>
            </CardContent>
          ) : (
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
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 pt-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Dispatching...' : 'Send Reset Link'}
                  {!loading && <Send className="ml-2 h-4 w-4" />}
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
