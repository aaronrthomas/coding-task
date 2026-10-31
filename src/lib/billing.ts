import prisma from '@/lib/db';
import { calculateNextBillingDate, roundMoney } from '@/lib/utils';
import { BillingRecordStatus, InvoiceStatus, Prisma, SubscriptionStatus } from '@prisma/client';

export interface BillingEngineResult {
  processedCount: number;
  invoicesCreated: number;
  skippedCount: number;
  errorsCount: number;
  details: Array<{
    subscriptionId: string;
    subscriptionNumber: string;
    status: 'CREATED' | 'SKIPPED' | 'ERROR';
    invoiceNumber?: string;
    reason?: string;
  }>;
}

/**
 * Generates an sequential invoice number, e.g. INV-2026-0001
 */
export async function generateInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  const padded = String(count + 1).padStart(5, '0');
  const candidate = `INV-${year}-${padded}`;

  // Ensure uniqueness
  const exists = await prisma.invoice.findUnique({
    where: { invoiceNumber: candidate },
  });
  if (exists) {
    return `INV-${year}-${padded}-${Math.floor(100 + Math.random() * 900)}`;
  }
  return candidate;
}

/**
 * Execute the recurring billing engine.
 * Idempotent, transaction-safe, processes due active subscriptions.
 */
export async function runRecurringBillingEngine(targetSubscriptionId?: string): Promise<BillingEngineResult> {
  const now = new Date();

  // Find active subscriptions that are due for billing
  const whereClause: Prisma.SubscriptionWhereInput = {
    status: SubscriptionStatus.ACTIVE,
    nextBillingDate: { lte: now },
  };

  if (targetSubscriptionId) {
    whereClause.id = targetSubscriptionId;
  }

  const dueSubscriptions = await prisma.subscription.findMany({
    where: whereClause,
    include: {
      customer: true,
      plan: true,
      items: {
        include: {
          product: {
            include: {
              taxRules: {
                include: { taxRule: true },
              },
            },
          },
          variant: true,
        },
      },
    },
  });

  const result: BillingEngineResult = {
    processedCount: dueSubscriptions.length,
    invoicesCreated: 0,
    skippedCount: 0,
    errorsCount: 0,
    details: [],
  };

  for (const sub of dueSubscriptions) {
    const periodStart = new Date(sub.nextBillingDate);
    const periodEnd = calculateNextBillingDate(periodStart, sub.billingFrequency);
    const dueDate = new Date(periodStart);
    dueDate.setDate(dueDate.getDate() + 15); // Standard 15-day payment term

    // 1. Check idempotency: Verify if an invoice or billing record already exists for this exact period
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        subscriptionId: sub.id,
        periodStart: periodStart,
        periodEnd: periodEnd,
      },
    });

    if (existingInvoice) {
      result.skippedCount++;
      result.details.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        status: 'SKIPPED',
        reason: `Invoice ${existingInvoice.invoiceNumber} already exists for this billing period.`,
      });
      continue;
    }

    // 2. Validate subscription expiry & auto-close condition
    if (sub.expiryDate && sub.expiryDate < periodStart) {
      // Subscription has already passed expiry date. Close it if autoClose is true.
      if (sub.autoClose) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.CLOSED },
        });
        await prisma.subscriptionStatusHistory.create({
          data: {
            subscriptionId: sub.id,
            fromStatus: SubscriptionStatus.ACTIVE,
            toStatus: SubscriptionStatus.CLOSED,
            reason: 'Auto-closed upon reaching expiry date.',
          },
        });
      }
      result.skippedCount++;
      result.details.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        status: 'SKIPPED',
        reason: 'Subscription has reached its expiration date.',
      });
      continue;
    }

    // 3. Process line items, taxes, and discounts within a transaction
    try {
      const invoiceNumber = await generateInvoiceNumber();

      await prisma.$transaction(async (tx) => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        interface ProcessedLineItem {
          productId: string;
          variantId: string | null;
          description: string;
          quantity: number;
          unitPrice: number;
          taxRate: number;
          taxAmount: number;
          discountAmount: number;
          lineTotal: number;
        }

        const lineItemsToCreate: ProcessedLineItem[] = [];

        for (const item of sub.items) {
          // Calculate unit price from base salesPrice + variant adjustment
          const basePrice = Number(item.product.salesPrice);
          const adjustment = item.variant ? Number(item.variant.priceAdjustment) : 0;
          const calculatedUnitPrice = basePrice + adjustment;
          const lineSubtotal = calculatedUnitPrice * item.quantity;
          subtotal += lineSubtotal;

          // Determine applicable tax rate
          let lineTaxRate = 0;
          if (item.product.taxRules && item.product.taxRules.length > 0) {
            const activeTax = item.product.taxRules.find((tr) => tr.taxRule.isActive);
            if (activeTax) {
              lineTaxRate = Number(activeTax.taxRule.rate);
            }
          }
          const lineTaxAmount = roundMoney((lineSubtotal * lineTaxRate) / 100);
          totalTax += lineTaxAmount;

          const lineTotal = roundMoney(lineSubtotal + lineTaxAmount);

          const desc = item.variant
            ? `${item.product.name} (${item.variant.name})`
            : item.product.name;

          lineItemsToCreate.push({
            productId: item.productId,
            variantId: item.variantId,
            description: desc,
            quantity: item.quantity,
            unitPrice: calculatedUnitPrice,
            taxRate: lineTaxRate,
            taxAmount: lineTaxAmount,
            discountAmount: 0,
            lineTotal: lineTotal,
          });
        }

        // Check for active eligible discounts
        const eligibleDiscounts = await tx.discountRule.findMany({
          where: {
            isActive: true,
            OR: [{ startDate: null }, { startDate: { lte: now } }],
            AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
          },
        });

        let appliedDiscountRuleId: string | null = null;
        let appliedDiscountAmount = 0;

        for (const disc of eligibleDiscounts) {
          // Check usage limit
          if (disc.maxUses !== null && disc.currentUses >= disc.maxUses) {
            continue;
          }
          // Check minimum purchase
          if (disc.minPurchase !== null && subtotal < Number(disc.minPurchase)) {
            continue;
          }

          if (disc.isWholeSubscription) {
            let discountValue = 0;
            if (disc.type === 'PERCENTAGE') {
              discountValue = roundMoney((subtotal * Number(disc.value)) / 100);
            } else {
              discountValue = Number(disc.value);
            }

            if (discountValue > subtotal) {
              discountValue = subtotal;
            }

            appliedDiscountRuleId = disc.id;
            appliedDiscountAmount = discountValue;
            totalDiscount += discountValue;
            break; // Apply best valid whole subscription discount
          }
        }

        const grandTotal = roundMoney(Math.max(0, subtotal + totalTax - totalDiscount));

        // Create the Invoice
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            status: InvoiceStatus.CONFIRMED,
            invoiceDate: periodStart,
            periodStart: periodStart,
            periodEnd: periodEnd,
            dueDate: dueDate,
            subtotal: new Prisma.Decimal(subtotal),
            totalTax: new Prisma.Decimal(totalTax),
            totalDiscount: new Prisma.Decimal(totalDiscount),
            grandTotal: new Prisma.Decimal(grandTotal),
            amountPaid: new Prisma.Decimal(0.0),
            outstandingBalance: new Prisma.Decimal(grandTotal),
            notes: `Recurring billing for ${sub.plan.name} (${sub.billingFrequency})`,
            items: {
              create: lineItemsToCreate.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: new Prisma.Decimal(item.unitPrice),
                taxRate: new Prisma.Decimal(item.taxRate),
                taxAmount: new Prisma.Decimal(item.taxAmount),
                discountAmount: new Prisma.Decimal(item.discountAmount),
                lineTotal: new Prisma.Decimal(item.lineTotal),
              })),
            },
          },
        });

        // Record discount usage if applied
        if (appliedDiscountRuleId && appliedDiscountAmount > 0) {
          await tx.discountUsage.create({
            data: {
              discountRuleId: appliedDiscountRuleId,
              subscriptionId: sub.id,
              invoiceId: invoice.id,
              customerId: sub.customerId,
              appliedAmount: new Prisma.Decimal(appliedDiscountAmount),
            },
          });
          await tx.discountRule.update({
            where: { id: appliedDiscountRuleId },
            data: { currentUses: { increment: 1 } },
          });
        }

        // Record billing record for idempotency and audit
        await tx.billingRecord.create({
          data: {
            subscriptionId: sub.id,
            periodStart,
            periodEnd,
            status: BillingRecordStatus.SUCCESS,
            invoiceId: invoice.id,
          },
        });

        // Advance subscription nextBillingDate
        const nextDate = calculateNextBillingDate(periodEnd, sub.billingFrequency);
        let updatedStatus = sub.status;

        // Auto-close if autoClose is true and expiry date is reached
        if (sub.autoClose && sub.expiryDate && sub.expiryDate <= periodEnd) {
          updatedStatus = SubscriptionStatus.CLOSED;
          await tx.subscriptionStatusHistory.create({
            data: {
              subscriptionId: sub.id,
              fromStatus: sub.status,
              toStatus: SubscriptionStatus.CLOSED,
              reason: 'Auto-closed after billing current period reaching expiry date.',
            },
          });
        }

        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            nextBillingDate: nextDate,
            status: updatedStatus,
            subtotal: new Prisma.Decimal(subtotal),
            taxTotal: new Prisma.Decimal(totalTax),
            discountTotal: new Prisma.Decimal(totalDiscount),
            grandTotal: new Prisma.Decimal(grandTotal),
          },
        });
      });

      result.invoicesCreated++;
      result.details.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        status: 'CREATED',
        invoiceNumber,
      });
    } catch (err: unknown) {
      result.errorsCount++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      result.details.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        status: 'ERROR',
        reason: errorMessage,
      });

      // Log failure in BillingRecord for retry audit
      try {
        await prisma.billingRecord.create({
          data: {
            subscriptionId: sub.id,
            periodStart,
            periodEnd,
            status: BillingRecordStatus.FAILED,
            errorMessage,
          },
        });
      } catch {
        // Suppress secondary logging error
      }
    }
  }

  return result;
}
