import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { addDays, addMonths, addYears, format } from 'date-fns';
import { Prisma } from '@prisma/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with standard symbol and 2 decimals
 */
export function formatCurrency(
  amount: number | string | Prisma.Decimal | null | undefined,
  currency: string = 'INR'
): string {
  if (amount === null || amount === undefined) {
    return '₹0.00';
  }
  const numeric = typeof amount === 'number' ? amount : Number(amount.toString());
  if (isNaN(numeric)) return '₹0.00';

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Format date consistently (UTC / standard date representation)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd MMM yyyy');
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd MMM yyyy, HH:mm');
}

/**
 * Safe 2-decimal arithmetic rounding to avoid JS IEEE-754 precision issues
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate the next billing date for a given frequency and base date
 * Handles month-end clamp and leap years safely using date-fns
 */
export function calculateNextBillingDate(
  currentDate: Date,
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  intervals: number = 1
): Date {
  const base = new Date(currentDate);
  switch (frequency) {
    case 'DAILY':
      return addDays(base, intervals);
    case 'WEEKLY':
      return addDays(base, intervals * 7);
    case 'MONTHLY':
      return addMonths(base, intervals);
    case 'YEARLY':
      return addYears(base, intervals);
    default:
      return addMonths(base, intervals);
  }
}
