import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-slate-900 text-white',
        secondary: 'border-transparent bg-slate-100 text-slate-800',
        outline: 'border border-slate-200 text-slate-700 bg-white',
        success: 'border-transparent bg-emerald-50 text-emerald-700 border border-emerald-200',
        warning: 'border-transparent bg-amber-50 text-amber-700 border border-amber-200',
        destructive: 'border-transparent bg-red-50 text-red-700 border border-red-200',
        info: 'border-transparent bg-blue-50 text-blue-700 border border-blue-200',
        purple: 'border-transparent bg-purple-50 text-purple-700 border border-purple-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  switch (s) {
    case 'ACTIVE':
    case 'PAID':
    case 'ACCEPTED':
    case 'SUCCESS':
      return <Badge variant="success">{status}</Badge>;
    case 'CONFIRMED':
    case 'SENT':
      return <Badge variant="info">{status}</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary">{status}</Badge>;
    case 'PAUSED':
    case 'PARTIAL':
      return <Badge variant="warning">{status}</Badge>;
    case 'OVERDUE':
    case 'CANCELLED':
    case 'CLOSED':
    case 'EXPIRED':
    case 'FAILED':
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export { Badge, badgeVariants };
