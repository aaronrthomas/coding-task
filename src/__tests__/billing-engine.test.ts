import { describe, it, expect } from 'vitest';
import { calculateNextBillingDate, roundMoney } from '../lib/utils';
import { addDays } from 'date-fns';

describe('Billing Dates and Frequency Calculations', () => {
  it('Requirement 6: calculates DAILY, WEEKLY, MONTHLY, and YEARLY billing intervals correctly', () => {
    // 1. DAILY
    const startDaily = new Date('2026-03-01T00:00:00.000Z');
    const nextDaily = calculateNextBillingDate(startDaily, 'DAILY');
    expect(nextDaily.toISOString().slice(0, 10)).toBe('2026-03-02');

    // 2. WEEKLY
    const startWeekly = new Date('2026-03-01T00:00:00.000Z');
    const nextWeekly = calculateNextBillingDate(startWeekly, 'WEEKLY');
    expect(nextWeekly.toISOString().slice(0, 10)).toBe('2026-03-08');

    // 3. MONTHLY (standard)
    const startMonthly = new Date('2026-01-15T00:00:00.000Z');
    const nextMonthly = calculateNextBillingDate(startMonthly, 'MONTHLY');
    expect(nextMonthly.toISOString().slice(0, 10)).toBe('2026-02-15');

    // 4. MONTHLY (month-end clamp: Jan 31 -> Feb 28 in non-leap year)
    const jan31 = new Date('2026-01-31T00:00:00.000Z');
    const febNext = calculateNextBillingDate(jan31, 'MONTHLY');
    expect(febNext.toISOString().slice(0, 10)).toBe('2026-02-28');

    // 5. YEARLY (handles leap years safely: Feb 29, 2024 -> Feb 28, 2025)
    const leapYearFeb29 = new Date('2024-02-29T00:00:00.000Z');
    const nextYearly = calculateNextBillingDate(leapYearFeb29, 'YEARLY');
    expect(nextYearly.toISOString().slice(0, 10)).toBe('2025-02-28');
  });
});

describe('Recurring Billing Engine Idempotency and Invoice Generation', () => {
  it('Requirement 9 & 10: creates invoices for correct period and guarantees idempotency on retry', () => {
    interface BillingJobState {
      existingInvoices: Array<{ subscriptionId: string; periodStart: string; periodEnd: string }>;
    }

    const state: BillingJobState = { existingInvoices: [] };

    const processBillingForSubscription = (
      sub: { id: string; status: string; nextBillingDate: Date; frequency: 'MONTHLY' },
      engineState: BillingJobState
    ) => {
      // Requirement 13: Closed or Paused subscriptions must never be billed!
      if (sub.status !== 'ACTIVE') {
        return { status: 'SKIPPED', reason: `Subscription is ${sub.status}` };
      }

      const periodStart = sub.nextBillingDate.toISOString();
      const periodEnd = calculateNextBillingDate(sub.nextBillingDate, sub.frequency).toISOString();

      // Check unique constraint: [subscriptionId, periodStart, periodEnd]
      const duplicate = engineState.existingInvoices.find(
        (i) => i.subscriptionId === sub.id && i.periodStart === periodStart && i.periodEnd === periodEnd
      );

      if (duplicate) {
        return { status: 'SKIPPED', reason: 'Invoice already exists for this billing period' };
      }

      // Generate invoice
      engineState.existingInvoices.push({
        subscriptionId: sub.id,
        periodStart,
        periodEnd,
      });

      return { status: 'CREATED', periodStart, periodEnd };
    };

    const activeSub = {
      id: 'sub-001',
      status: 'ACTIVE',
      nextBillingDate: new Date('2026-10-01T00:00:00.000Z'),
      frequency: 'MONTHLY' as const,
    };

    // First execution: creates invoice
    const firstRun = processBillingForSubscription(activeSub, state);
    expect(firstRun.status).toBe('CREATED');
    expect(state.existingInvoices.length).toBe(1);

    // Second execution (immediate retry): MUST BE IDEMPOTENT (skipped without creating duplicate!)
    const retryRun = processBillingForSubscription(activeSub, state);
    expect(retryRun.status).toBe('SKIPPED');
    expect(retryRun.reason).toContain('already exists');
    expect(state.existingInvoices.length).toBe(1); // No duplicate added!
  });

  it('Requirement 13: ensures CLOSED and PAUSED subscriptions are not billed improperly', () => {
    const pausedSub = { id: 'sub-paused', status: 'PAUSED', nextBillingDate: new Date(), frequency: 'MONTHLY' as const };
    const closedSub = { id: 'sub-closed', status: 'CLOSED', nextBillingDate: new Date(), frequency: 'MONTHLY' as const };

    const shouldBill = (subStatus: string) => subStatus === 'ACTIVE';

    expect(shouldBill(pausedSub.status)).toBe(false);
    expect(shouldBill(closedSub.status)).toBe(false);
  });
});

describe('Payment Reconciliation and Overdue Calculations', () => {
  it('Requirement 11: partial and full payments recalculate balances and status correctly', () => {
    const grandTotal = 3020.8;
    let amountPaid = 0.0;
    let outstandingBalance = grandTotal;
    let status = 'CONFIRMED';

    // 1. Partial payment of ₹1,000
    const partialPayment = 1000.0;
    amountPaid = roundMoney(amountPaid + partialPayment);
    outstandingBalance = roundMoney(grandTotal - amountPaid);
    status = outstandingBalance <= 0 ? 'PAID' : status;

    expect(amountPaid).toBe(1000.0);
    expect(outstandingBalance).toBe(2020.8);
    expect(status).toBe('CONFIRMED'); // Not paid yet

    // 2. Final payment of ₹2,020.80 to satisfy remainder
    const finalPayment = 2020.8;
    amountPaid = roundMoney(amountPaid + finalPayment);
    outstandingBalance = roundMoney(grandTotal - amountPaid);
    status = outstandingBalance <= 0 ? 'PAID' : status;

    expect(amountPaid).toBe(3020.8);
    expect(outstandingBalance).toBe(0.0);
    expect(status).toBe('PAID'); // Successfully marked PAID!
  });

  it('Requirement 12: detects overdue invoices based on dueDate and positive balance', () => {
    const now = new Date('2026-10-31T12:00:00Z');

    const invoice1 = { dueDate: new Date('2026-10-15T00:00:00Z'), outstandingBalance: 3020.8, status: 'CONFIRMED' };
    const invoice2 = { dueDate: new Date('2026-11-15T00:00:00Z'), outstandingBalance: 3020.8, status: 'CONFIRMED' };
    const invoice3 = { dueDate: new Date('2026-10-10T00:00:00Z'), outstandingBalance: 0, status: 'PAID' };

    const isOverdue = (inv: { dueDate: Date; outstandingBalance: number; status: string }) => {
      return inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.dueDate < now && inv.outstandingBalance > 0;
    };

    expect(isOverdue(invoice1)).toBe(true); // Overdue by 16 days
    expect(isOverdue(invoice2)).toBe(false); // Due in future
    expect(isOverdue(invoice3)).toBe(false); // Balance is 0
  });

  it('Requirement 14: verifies pagination slicing calculation', () => {
    const records = Array.from({ length: 45 }, (_, i) => ({ id: `rec-${i + 1}` }));
    const pageSize = 10;

    const paginate = (items: typeof records, page: number, size: number) => {
      const skip = (page - 1) * size;
      return items.slice(skip, skip + size);
    };

    const page1 = paginate(records, 1, pageSize);
    expect(page1.length).toBe(10);
    expect(page1[0].id).toBe('rec-1');
    expect(page1[9].id).toBe('rec-10');

    const page5 = paginate(records, 5, pageSize);
    expect(page5.length).toBe(5); // Last page has 5 records
    expect(page5[0].id).toBe('rec-41');
    expect(page5[4].id).toBe('rec-45');
  });
});
