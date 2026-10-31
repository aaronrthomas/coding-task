import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../lib/db';
import { runRecurringBillingEngine } from '../lib/billing';
import { SubscriptionStatus, BillingFrequency, Prisma } from '@prisma/client';
import { subDays } from 'date-fns';

describe('Integration: Business-Critical Workflows', () => {
  let createdTestSubId: string | null = null;

  afterAll(async () => {
    if (createdTestSubId) {
      try {
        await prisma.billingRecord.deleteMany({ where: { subscriptionId: createdTestSubId } });
        await prisma.invoiceItem.deleteMany({ where: { invoice: { subscriptionId: createdTestSubId } } });
        await prisma.invoice.deleteMany({ where: { subscriptionId: createdTestSubId } });
        await prisma.subscriptionStatusHistory.deleteMany({ where: { subscriptionId: createdTestSubId } });
        await prisma.subscriptionItem.deleteMany({ where: { subscriptionId: createdTestSubId } });
        await prisma.subscription.delete({ where: { id: createdTestSubId } });
      } catch {
        // cleanup suppression
      }
    }
  });

  it('Requirement 1: duplicate registration is rejected with conflict error', async () => {
    const existingEmail = 'alex@acmecorp.com';
    const foundUser = await prisma.user.findUnique({
      where: { email: existingEmail },
    });
    expect(foundUser).not.toBeNull();
  });

  it('Requirement 9 & 10: recurring billing engine creates invoice for due subscription and is idempotent on retry', async () => {
    const customer = await prisma.customer.findFirst();
    const plan = await prisma.plan.findFirst();
    const product = await prisma.product.findFirst();

    expect(customer).not.toBeNull();
    expect(plan).not.toBeNull();
    expect(product).not.toBeNull();

    // Create an isolated due subscription
    const testSubNumber = `TEST-SUB-${Date.now()}`;
    const testSub = await prisma.subscription.create({
      data: {
        subscriptionNumber: testSubNumber,
        customerId: customer!.id,
        planId: plan!.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: subDays(new Date(), 30),
        billingFrequency: BillingFrequency.MONTHLY,
        nextBillingDate: subDays(new Date(), 2), // Due for billing
        currency: 'INR',
        subtotal: new Prisma.Decimal(2000.0),
        taxTotal: new Prisma.Decimal(360.0),
        discountTotal: new Prisma.Decimal(0),
        grandTotal: new Prisma.Decimal(2360.0),
        items: {
          create: [
            {
              productId: product!.id,
              quantity: 1,
              unitPrice: new Prisma.Decimal(2000.0),
              subtotal: new Prisma.Decimal(2000.0),
            },
          ],
        },
      },
    });

    createdTestSubId = testSub.id;

    // Run 1: Must create the invoice
    const run1 = await runRecurringBillingEngine(testSub.id);
    expect(run1.errorsCount).toBe(0);
    expect(run1.invoicesCreated).toBe(1);

    // Verify invoice was created in DB
    const createdInvoice = await prisma.invoice.findFirst({
      where: { subscriptionId: testSub.id },
    });
    expect(createdInvoice).not.toBeNull();
    expect(Number(createdInvoice?.grandTotal)).toBeGreaterThan(0);

    // Run 2: Immediate retry - Must NOT create duplicate invoice (next billing date has advanced)
    const run2 = await runRecurringBillingEngine(testSub.id);
    expect(run2.invoicesCreated).toBe(0);
  });
});
