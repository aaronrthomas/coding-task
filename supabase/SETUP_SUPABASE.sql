-- =====================================================================
-- Brightloop Software - Supabase Database Setup
-- Paste this entire script into the Supabase SQL Editor and click RUN
-- URL: https://supabase.com/dashboard/project/hknaaykwtboelqfyjjcp/sql/new
-- =====================================================================

-- ==================== PART 1: ENUMS ====================
-- Use DO blocks to safely create enums (PostgreSQL has no CREATE TYPE IF NOT EXISTS)

DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ProductType" AS ENUM ('SOFTWARE', 'SERVICE', 'HARDWARE', 'SUBSCRIPTION_TIER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "BillingFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SubscriptionStatus" AS ENUM ('DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'UPI', 'CARD', 'CASH', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENTAGE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "BillingRecordStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==================== PART 2: TABLES ====================

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "supabaseUid" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT,
    "billingAddress" TEXT,
    "taxId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL DEFAULT 'SOFTWARE',
    "salesPrice" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "billingFrequency" "BillingFrequency" NOT NULL DEFAULT 'MONTHLY',
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "autoClose" BOOLEAN NOT NULL DEFAULT false,
    "canEarlyClose" BOOLEAN NOT NULL DEFAULT true,
    "canPause" BOOLEAN NOT NULL DEFAULT true,
    "canRenew" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuotationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPlanId" TEXT,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "templateLinesJson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuotationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Quotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "grandTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "convertedSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "subscriptionNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "billingFrequency" "BillingFrequency" NOT NULL,
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "paymentTerms" TEXT NOT NULL DEFAULT 'Due upon receipt',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "grandTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "autoClose" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubscriptionItem" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "SubscriptionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubscriptionStatusHistory" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "fromStatus" "SubscriptionStatus",
    "toStatus" "SubscriptionStatus" NOT NULL,
    "reason" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TaxRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "applicableProductType" "ProductType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TaxRuleProduct" (
    "id" TEXT NOT NULL,
    "taxRuleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "TaxRuleProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DiscountRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "value" DECIMAL(12,2) NOT NULL,
    "minPurchase" DECIMAL(12,2),
    "minQuantity" INTEGER,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "productId" TEXT,
    "isWholeSubscription" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscountRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DiscountUsage" (
    "id" TEXT NOT NULL,
    "discountRuleId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceId" TEXT,
    "customerId" TEXT,
    "appliedAmount" DECIMAL(12,2) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscountUsage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "customerId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalTax" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "grandTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "outstandingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "transactionRef" TEXT,
    "notes" TEXT,
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BillingRecord" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "BillingRecordStatus" NOT NULL,
    "invoiceId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ==================== PART 3: INDEXES ====================

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseUid_key" ON "User"("supabaseUid");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_userId_key" ON "Customer"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_isArchived_idx" ON "Customer"("isArchived");
CREATE INDEX IF NOT EXISTS "Product_isActive_idx" ON "Product"("isActive");
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX IF NOT EXISTS "Plan_productId_idx" ON "Plan"("productId");
CREATE INDEX IF NOT EXISTS "Plan_isActive_idx" ON "Plan"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");
CREATE INDEX IF NOT EXISTS "Quotation_customerId_idx" ON "Quotation"("customerId");
CREATE INDEX IF NOT EXISTS "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_subscriptionNumber_key" ON "Subscription"("subscriptionNumber");
CREATE INDEX IF NOT EXISTS "Subscription_customerId_idx" ON "Subscription"("customerId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_nextBillingDate_idx" ON "Subscription"("nextBillingDate");
CREATE INDEX IF NOT EXISTS "SubscriptionItem_subscriptionId_idx" ON "SubscriptionItem"("subscriptionId");
CREATE INDEX IF NOT EXISTS "SubscriptionStatusHistory_subscriptionId_idx" ON "SubscriptionStatusHistory"("subscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "TaxRuleProduct_taxRuleId_productId_key" ON "TaxRuleProduct"("taxRuleId", "productId");
CREATE INDEX IF NOT EXISTS "TaxRule_isActive_idx" ON "TaxRule"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "DiscountRule_code_key" ON "DiscountRule"("code");
CREATE INDEX IF NOT EXISTS "DiscountRule_isActive_idx" ON "DiscountRule"("isActive");
CREATE INDEX IF NOT EXISTS "DiscountUsage_discountRuleId_idx" ON "DiscountUsage"("discountRuleId");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_subscriptionId_periodStart_periodEnd_key" ON "Invoice"("subscriptionId", "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_paymentReference_key" ON "Payment"("paymentReference");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_customerId_idx" ON "Payment"("customerId");
CREATE UNIQUE INDEX IF NOT EXISTS "BillingRecord_subscriptionId_periodStart_periodEnd_key" ON "BillingRecord"("subscriptionId", "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ==================== PART 4: FOREIGN KEYS ====================

DO $$ BEGIN
  ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Plan" ADD CONSTRAINT "Plan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "QuotationTemplate" ADD CONSTRAINT "QuotationTemplate_defaultPlanId_fkey" FOREIGN KEY ("defaultPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SubscriptionStatusHistory" ADD CONSTRAINT "SubscriptionStatusHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SubscriptionStatusHistory" ADD CONSTRAINT "SubscriptionStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "TaxRuleProduct" ADD CONSTRAINT "TaxRuleProduct_taxRuleId_fkey" FOREIGN KEY ("taxRuleId") REFERENCES "TaxRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "TaxRuleProduct" ADD CONSTRAINT "TaxRuleProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "DiscountRule" ADD CONSTRAINT "DiscountRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "DiscountUsage" ADD CONSTRAINT "DiscountUsage_discountRuleId_fkey" FOREIGN KEY ("discountRuleId") REFERENCES "DiscountRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "DiscountUsage" ADD CONSTRAINT "DiscountUsage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "DiscountUsage" ADD CONSTRAINT "DiscountUsage_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "DiscountUsage" ADD CONSTRAINT "DiscountUsage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==================== PART 5: ROW LEVEL SECURITY ====================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass RLS (server-side Prisma queries)
-- service_role already bypasses RLS in Supabase by default, but explicit policies help
CREATE POLICY "allow_all_service_role_User" ON "User" TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role_Customer" ON "Customer" TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role_Product" ON "Product" TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role_Plan" ON "Plan" TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role_Subscription" ON "Subscription" TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role_Invoice" ON "Invoice" TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role_Payment" ON "Payment" TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role_BillingRecord" ON "BillingRecord" TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role_AuditLog" ON "AuditLog" TO service_role USING (true) WITH CHECK (true);

-- ==================== PART 6: SEED DATA ====================

-- Admin user (password: AdminPass@2026)
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@brightloop.com',
  'System Administrator',
  '$2b$10$BpP3aku7xSs66Dw51SRPZOQa6YrS0x/j2gr0eUpRvbZILgY4aZKiO',
  'ADMIN', true, NOW(), NOW()
) ON CONFLICT ("email") DO NOTHING;

-- Staff user 1 (password: StaffPass@2026)
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'sarah.staff@brightloop.com',
  'Sarah Jenkins',
  '$2b$10$6S.T6OZR0umNUaMGS2MjcOnavJ2Kei/vtOrhRCta6AS5UMX1NZDTW',
  'STAFF', true, NOW(), NOW()
) ON CONFLICT ("email") DO NOTHING;

-- Staff user 2 (password: StaffPass@2026)
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'david.billing@brightloop.com',
  'David Billing',
  '$2b$10$6S.T6OZR0umNUaMGS2MjcOnavJ2Kei/vtOrhRCta6AS5UMX1NZDTW',
  'STAFF', true, NOW(), NOW()
) ON CONFLICT ("email") DO NOTHING;

-- Customer 1: Alex Morgan (password: CustPass@2026!)
DO $$
DECLARE
  u_id TEXT;
  c_id TEXT;
BEGIN
  u_id := gen_random_uuid()::text;
  c_id := gen_random_uuid()::text;
  INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
  VALUES (u_id, 'alex@acmecorp.com', 'Alex Morgan', '$2b$10$fSYYad37oCGsz5arePZa3evPKVbQIV/IG2O.z3KsVElw9/9RMYkR.', 'CUSTOMER', true, NOW(), NOW())
  ON CONFLICT ("email") DO NOTHING;
  SELECT "id" INTO u_id FROM "User" WHERE email = 'alex@acmecorp.com';
  INSERT INTO "Customer" ("id", "userId", "name", "email", "companyName", "phone", "billingAddress", "taxId", "createdAt", "updatedAt")
  VALUES (c_id, u_id, 'Alex Morgan', 'alex@acmecorp.com', 'Acme Corp Technologies', '+91 98765 11111', 'Tower B, Tech Park, Bangalore, KA', '29ABCDE1234F1Z5', NOW(), NOW())
  ON CONFLICT ("email") DO NOTHING;
END $$;

-- Customer 2: Priya Sharma (password: CustPass@2026!)
DO $$
DECLARE
  u_id TEXT;
  c_id TEXT;
BEGIN
  u_id := gen_random_uuid()::text;
  c_id := gen_random_uuid()::text;
  INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
  VALUES (u_id, 'priya@techvision.io', 'Priya Sharma', '$2b$10$fSYYad37oCGsz5arePZa3evPKVbQIV/IG2O.z3KsVElw9/9RMYkR.', 'CUSTOMER', true, NOW(), NOW())
  ON CONFLICT ("email") DO NOTHING;
  SELECT "id" INTO u_id FROM "User" WHERE email = 'priya@techvision.io';
  INSERT INTO "Customer" ("id", "userId", "name", "email", "companyName", "phone", "billingAddress", "taxId", "createdAt", "updatedAt")
  VALUES (c_id, u_id, 'Priya Sharma', 'priya@techvision.io', 'TechVision Analytics Pvt Ltd', '+91 98765 22222', 'Cyber City, Gurugram, HR', '06AAACT4321K1Z2', NOW(), NOW())
  ON CONFLICT ("email") DO NOTHING;
END $$;

-- Customer 3: Marco Rossi (password: CustPass@2026!)
DO $$
DECLARE
  u_id TEXT;
  c_id TEXT;
BEGIN
  u_id := gen_random_uuid()::text;
  c_id := gen_random_uuid()::text;
  INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
  VALUES (u_id, 'marco@globallogistics.com', 'Marco Rossi', '$2b$10$fSYYad37oCGsz5arePZa3evPKVbQIV/IG2O.z3KsVElw9/9RMYkR.', 'CUSTOMER', true, NOW(), NOW())
  ON CONFLICT ("email") DO NOTHING;
  SELECT "id" INTO u_id FROM "User" WHERE email = 'marco@globallogistics.com';
  INSERT INTO "Customer" ("id", "userId", "name", "email", "companyName", "phone", "billingAddress", "taxId", "createdAt", "updatedAt")
  VALUES (c_id, u_id, 'Marco Rossi', 'marco@globallogistics.com', 'Global Logistics Software Inc', '+91 98765 33333', 'Bandra Kurla Complex, Mumbai, MH', '27AABCG9876L1Z8', NOW(), NOW())
  ON CONFLICT ("email") DO NOTHING;
END $$;

-- Sample Products
INSERT INTO "Product" ("id", "name", "type", "salesPrice", "costPrice", "description", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Brightloop Core Suite', 'SOFTWARE', 4999.00, 1200.00, 'Full-featured subscription management platform', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Analytics Pro Module', 'SOFTWARE', 2499.00, 600.00, 'Advanced analytics and reporting module', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Priority Support Service', 'SERVICE', 1999.00, 400.00, '24/7 dedicated support with 1-hour SLA', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Starter Plan', 'SUBSCRIPTION_TIER', 999.00, 250.00, 'Entry-level subscription tier', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Enterprise Suite', 'SOFTWARE', 14999.00, 3500.00, 'Full enterprise feature set with unlimited users', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Tax Rules
INSERT INTO "TaxRule" ("id", "name", "rate", "description", "applicableProductType", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'GST 18% - Software', 18.00, 'GST for software products and SaaS', 'SOFTWARE', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'GST 18% - Services', 18.00, 'GST for professional services', 'SERVICE', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'GST 12% - Subscription Tiers', 12.00, 'GST for subscription tier products', 'SUBSCRIPTION_TIER', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Discount Rules
INSERT INTO "DiscountRule" ("id", "code", "name", "type", "value", "maxUses", "currentUses", "isActive", "isWholeSubscription", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'LAUNCH20', 'Launch Offer 20%', 'PERCENTAGE', 20.00, 100, 0, true, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'FLAT500', 'Flat 500 Off', 'FIXED', 500.00, 50, 0, true, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ANNUAL15', 'Annual Subscription 15%', 'PERCENTAGE', 15.00, NULL, 0, true, true, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

SELECT 'SUCCESS: Brightloop database schema and seed data applied!' AS result;
