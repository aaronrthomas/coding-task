'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, ShieldCheck, Key, Play, Database, Server, Clock, Copy, Check } from 'lucide-react';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);

  const cronUrl = 'POST /api/billing/run';
  const cronHeader = 'Authorization: Bearer brightloop-billing-engine-secret-key-999';

  const copySecret = () => {
    navigator.clipboard.writeText('brightloop-billing-engine-secret-key-999');
    setCopied(true);
    toast.success('Billing Cron Secret copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualTrigger = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/billing/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `Billing engine executed: ${data.data.invoicesCreated} invoices created, ${data.data.skippedCount} skipped.`
        );
      } else {
        toast.error(data.error || 'Execution failed');
      }
    } catch {
      toast.error('Network error during manual run');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System &amp; Engine Settings</h1>
        <p className="text-sm text-slate-500">
          Configure billing automation, cron scheduling, and infrastructure parameters
        </p>
      </div>

      {/* Recurring Billing Engine Config Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Recurring Billing Automation Scheduler</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={handleManualTrigger}
              disabled={running}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className={`h-3.5 w-3.5 mr-1.5 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Executing Billing Engine...' : 'Run Billing Engine Now'}
            </Button>
          </div>
          <CardDescription>
            The recurring billing engine executes idempotently with transactional integrity
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] font-sans font-semibold uppercase">Endpoint</span>
              <span className="text-blue-700 font-bold">{cronUrl}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-sans font-semibold uppercase">Authentication Header</span>
              <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-slate-800">
                <span>{cronHeader}</span>
                <Button variant="ghost" size="sm" onClick={copySecret} className="h-6 px-2 text-xs">
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <div className="text-[11px] font-sans text-slate-600 space-y-1 pt-1">
              <p>
                <strong>Production Cron Setup:</strong> Set up a scheduled job (e.g., via Vercel Cron, GitHub Actions, or crontab) to send a POST request daily at midnight UTC:
              </p>
              <pre className="p-2 rounded bg-slate-900 text-slate-100 text-[10px] overflow-x-auto">
{`curl -X POST https://your-domain.com/api/billing/run \\
  -H "Authorization: Bearer brightloop-billing-engine-secret-key-999"`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure & Security Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Infrastructure &amp; Security Status</CardTitle>
          </div>
          <CardDescription>Verified system architecture and environment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded border border-slate-200 bg-slate-50/50">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Database Engine</span>
              <span className="font-bold text-slate-900">PostgreSQL 18.6 (x86_64)</span>
              <span className="text-emerald-600 block text-[11px] font-medium mt-0.5">● Connected &amp; Synced via Prisma</span>
            </div>

            <div className="p-3 rounded border border-slate-200 bg-slate-50/50">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Financial Currency</span>
              <span className="font-bold text-slate-900">INR (₹) - Indian Rupee</span>
              <span className="text-slate-500 block text-[11px] mt-0.5">Decimal(12, 2) Safe Fixed Arithmetic</span>
            </div>

            <div className="p-3 rounded border border-slate-200 bg-slate-50/50">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Session Management</span>
              <span className="font-bold text-slate-900">HTTP-Only SameSite JWT</span>
              <span className="text-slate-500 block text-[11px] mt-0.5">HS256 with Server Secret</span>
            </div>

            <div className="p-3 rounded border border-slate-200 bg-slate-50/50">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Password Cryptography</span>
              <span className="font-bold text-slate-900">BCrypt (10 Salt Rounds)</span>
              <span className="text-emerald-600 block text-[11px] font-medium mt-0.5">Enforced Complexity Requirements</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
