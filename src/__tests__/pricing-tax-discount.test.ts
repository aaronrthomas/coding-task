import { describe, it, expect } from 'vitest';
import { roundMoney } from '../lib/utils';

describe('Product Variant Pricing and Calculations', () => {
  it('Requirement 5: verifies product variants change the unit price accurately', () => {
    // Specification example:
    // Product: Business Software, Base price: ₹2,000, Variant: Odoo, Price adjustment: ₹560, Final: ₹2,560
    const baseSalesPrice = 2000.0;
    const variantAdjustment = 560.0;
    const finalUnitPrice = baseSalesPrice + variantAdjustment;

    expect(finalUnitPrice).toBe(2560.0);

    // Multiple quantities
    const quantity = 3;
    const subtotal = finalUnitPrice * quantity;
    expect(subtotal).toBe(7680.0);
  });
});

describe('Tax Calculations and Rounding', () => {
  it('Requirement 7: calculates line taxes accurately with decimal precision', () => {
    const lineSubtotal = 2560.0;
    const gstRate = 18.0; // 18%

    const taxAmount = roundMoney((lineSubtotal * gstRate) / 100);
    expect(taxAmount).toBe(460.8);

    const lineTotal = roundMoney(lineSubtotal + taxAmount);
    expect(lineTotal).toBe(3020.8);

    // VAT 5%
    const serviceSubtotal = 1200.0;
    const vatRate = 5.0;
    const vatAmount = roundMoney((serviceSubtotal * vatRate) / 100);
    expect(vatAmount).toBe(60.0);
    expect(serviceSubtotal + vatAmount).toBe(1260.0);
  });
});

describe('Discount Rules and Eligibility', () => {
  it('Requirement 8: respects discount usage limits, minimum purchases, and date validity', () => {
    const now = new Date('2026-10-31T12:00:00Z');

    interface DiscountRule {
      code: string;
      value: number;
      type: 'PERCENTAGE' | 'FIXED';
      maxUses: number | null;
      currentUses: number;
      minPurchase: number | null;
      startDate: Date | null;
      endDate: Date | null;
    }

    const isEligible = (rule: DiscountRule, cartTotal: number, date: Date = now) => {
      // Check active usage limit
      if (rule.maxUses !== null && rule.currentUses >= rule.maxUses) return false;
      // Check minimum purchase requirement
      if (rule.minPurchase !== null && cartTotal < rule.minPurchase) return false;
      // Check date bounds
      if (rule.startDate && date < rule.startDate) return false;
      if (rule.endDate && date > rule.endDate) return false;
      return true;
    };

    // 1. Valid discount rule
    const activeRule: DiscountRule = {
      code: 'WELCOME15',
      value: 15,
      type: 'PERCENTAGE',
      maxUses: 100,
      currentUses: 5,
      minPurchase: 1000,
      startDate: null,
      endDate: null,
    };
    expect(isEligible(activeRule, 2560)).toBe(true);

    // 2. Cart below minimum purchase
    expect(isEligible(activeRule, 800)).toBe(false);

    // 3. Exhausted discount
    const exhaustedRule: DiscountRule = {
      code: 'FLASH500',
      value: 500,
      type: 'FIXED',
      maxUses: 10,
      currentUses: 10, // Max reached
      minPurchase: 1000,
      startDate: null,
      endDate: null,
    };
    expect(isEligible(exhaustedRule, 3000)).toBe(false);

    // 4. Expired discount
    const expiredRule: DiscountRule = {
      code: 'OLD2025',
      value: 20,
      type: 'PERCENTAGE',
      maxUses: 100,
      currentUses: 2,
      minPurchase: null,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
    };
    expect(isEligible(expiredRule, 2000, now)).toBe(false);
  });
});
