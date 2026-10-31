'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Settings,
  ShieldCheck,
  Key,
  Play,
  Database,
  Server,
  Clock,
  Copy,
  Check,
  Calendar,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);

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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Subheader: Back Button, Title, Subtitle, and Primary Action Pill */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/dashboard"
            className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-all shadow-2xs hover:scale-105"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              System &amp; Engine Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
              Configure billing automation, cron scheduling, and infrastructure parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleManualTrigger}
            disabled={running}
            className="bg-[#5b52f9] hover:bg-[#4d44e8] text-white rounded-full px-5 py-2.5 font-medium shadow-md shadow-indigo-500/25 text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Zap className={cn('h-4 w-4', running && 'animate-spin')} />
            <span>Run Billing Engine Now</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Finnova 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Engine Health with Desk Image */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Billing Engine Status</span>
              <div className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              Operational
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Cron endpoint authenticated</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-36 h-24 opacity-85 pointer-events-none rounded-br-2xl overflow-hidden">
            <Image
              src="/finnova-desk.jpg"
              alt="Office Desk"
              width={160}
              height={120}
              className="object-cover object-center w-full h-full"
            />
          </div>
        </div>

        {/* KPI 2: Due within next month with Vertical Purple Bars */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Database Engine</span>
              <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Database className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              PostgreSQL 18
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>Port 8000 Connected</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-1.5 pt-4 h-12">
            {[
              { label: 'Jul', h: 'h-4', color: 'bg-indigo-200' },
              { label: 'Aug', h: 'h-6', color: 'bg-indigo-300' },
              { label: 'Sep', h: 'h-5', color: 'bg-indigo-300' },
              { label: 'Oct', h: 'h-7', color: 'bg-indigo-400' },
              { label: 'Nov', h: 'h-9', color: 'bg-indigo-500' },
              { label: 'Dec', h: 'h-10', color: 'bg-[#5b52f9]' },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className={`w-full max-w-[12px] rounded-t-sm ${bar.h} ${bar.color}`} />
                <span className="text-[9px] text-slate-400 mt-1">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KPI 3: Average time to get paid with Sparkline */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">App Router Runtime</span>
              <div className="h-6 w-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                <Server className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              Next.js 16
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>Edge-ready Session Cookies</span>
            </div>
          </div>
          <div className="pt-2 h-10 w-full">
            <svg viewBox="0 0 160 36" fill="none" className="w-full h-full">
              <path
                d="M2 30 C 25 32, 40 24, 60 22 C 80 20, 100 12, 120 10 C 140 8, 150 4, 158 2"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="2" cy="30" r="2.5" fill="#6366f1" />
              <circle cx="60" cy="22" r="2.5" fill="#6366f1" />
              <circle cx="120" cy="10" r="2.5" fill="#6366f1" />
              <circle cx="158" cy="2" r="3" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* KPI 4: Available for Instant Payout with Card Badges */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Security Architecture</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              Argon2id + JWT
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Role-Based Access Control</div>
          </div>
          <div className="flex items-center justify-between gap-1.5 pt-3">
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              Prisma
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-[#5b52f9] text-white font-mono shadow-xs">
              Zod
            </div>
            <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-slate-600">
              Vitest
            </div>
            <button
              onClick={handleManualTrigger}
              className="text-[11px] font-semibold bg-slate-900 text-white rounded-full px-2.5 py-1 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Trigger
            </button>
          </div>
        </div>
      </div>

      {/* 3. Dark Master Container */}
      <div className="bg-[#141527] rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Recurring Billing Engine Scheduler
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated invoice generation triggers based on contract nextBillingDate.
            </p>
          </div>

          <span className="text-xs font-semibold uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>CRON Schedule Active</span>
          </span>
        </div>

        <div className="space-y-4 pt-2">
          <div className="bg-[#18192d] p-5 rounded-2xl border border-slate-800/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Webhook Endpoint</span>
              <span className="font-mono text-white font-bold bg-white/10 px-2 py-0.5 rounded">
                POST /api/billing/run
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Bearer Secret Key</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded">
                  brightloop-billing-engine-secret-key-999
                </span>
                <button
                  onClick={copySecret}
                  className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
                  title="Copy secret"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
              <span className="text-slate-400">Recommended Cron Cadence</span>
              <span className="text-slate-300 font-mono">0 0 * * * (Every midnight UTC)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
