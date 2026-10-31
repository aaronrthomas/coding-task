# Brightloop Software — Subscription Management System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.0.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19.3-teal?style=flat&logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-15%20Passing-emerald?style=flat&logo=vitest)](https://vitest.dev/)

A full-stack, enterprise-grade B2B Subscription Management and Recurring Billing platform engineered for **Brightloop Software**. Features role-based access control (Admin, Staff, Customer), complete subscription lifecycle workflows, an idempotent recurring billing engine, immutable invoice snapshots, partial payment reconciliation, financial reporting with CSV exports, and a dedicated self-service customer portal.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Key Modules & Capabilities](#key-modules--capabilities)
4. [Prerequisites & System Requirements](#prerequisites--system-requirements)
5. [Installation & Setup](#installation--setup)
6. [Database Setup & Seeding](#database-setup--seeding)
7. [Demo Accounts & Credentials](#demo-accounts--credentials)
8. [Recurring Billing Engine & Cron Operations](#recurring-billing-engine--cron-operations)
9. [Financial Logic & Calculation Rules](#financial-logic--calculation-rules)
10. [Test Suite & Verification](#test-suite--verification)
11. [Production Deployment Guide](#production-deployment-guide)
12. [Security & Performance Design](#security--performance-design)

---

## Architecture Overview

```mermaid
graph TD
    Client[Browser / Portal Client] -->|HTTPS Requests| NextServer[Next.js 16 App Router Server]
    NextServer -->|Server-Side Auth & RBAC| AuthGuard[JWT Session & Role Guard]
    AuthGuard -->|Admin / Staff Routes| AdminApp[Admin & Staff Operations]
    AuthGuard -->|Customer Routes| PortalApp[Customer Self-Service Portal]
    AuthGuard -->|Cron / Webhook / API| BillingEngine[Idempotent Billing Engine]
    
    AdminApp --> Prisma[Prisma ORM 6.19.3]
    PortalApp --> Prisma
    BillingEngine --> Prisma
    
    Prisma --> Postgres[(PostgreSQL 18 Database)]
```

The system is structured as a monolithic Next.js App Router application backed by PostgreSQL and Prisma ORM:
- **Presentation Layer**: Built with React 19, Tailwind CSS, Lucide icons, and Recharts. Implements a clean, high-contrast B2B SaaS interface with persistent navigation, responsive layouts, accessible forms, and Sonner toasts.
- **Service & Business Layer**: Isolated server-side TypeScript modules in `src/lib/` ensuring business logic (pricing, discounts, tax snapshots, billing period advance, payments) is centralized, transactional, and independent of UI components.
- **Data Layer**: Fully normalized relational database model in Prisma featuring 19 interconnected models, unique constraints, foreign keys, and decimal fields for financial precision.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server-side rendering, API Route Handlers, layout grouping |
| **Language** | TypeScript 5 | Strict end-to-end type safety |
| **Styling** | Tailwind CSS v4 & custom tokens | Responsive, accessible, enterprise financial UI |
| **Database** | PostgreSQL 18 | ACID-compliant relational data persistence |
| **ORM** | Prisma 6.19.3 | Schema management, type-safe queries, migration tooling |
| **Authentication** | Server-side JWT (`jose`) & `bcryptjs` | HttpOnly cookies, session management, RBAC |
| **Validation** | Zod 3.24.2 | Server and client runtime schema validation |
| **Forms** | React Hook Form | Dynamic forms, line item builders, reactive validations |
| **Data Tables** | TanStack Table | Server-side pagination, searching, sorting, and filtering |
| **Visualizations** | Recharts | Revenue trends, invoice status charts, billing analytics |
| **Notifications** | Sonner | Real-time toast feedback for all operational actions |
| **Testing** | Vitest 4 | Unit and integration testing of critical financial workflows |

---

## Key Modules & Capabilities

### 1. Authentication & Role-Based Access Control (RBAC)
- **Roles**:
  - **Admin**: Full system control. Product catalog, pricing rules, tax rules, discount rules, staff management, audit logs, and system settings.
  - **Staff**: Operational workflows. Customer management, quotations, subscriptions, invoice generation, payment recording, and operational reports. Restricted from staff creation and system configuration.
  - **Customer**: Access strictly isolated to their own customer profile, subscriptions, invoices, and payment history via the Customer Portal (`/portal`).
- **Security**:
  - Password complexity enforcement: minimum 8 characters, at least one uppercase letter, one lowercase letter, and one special character (`[!@#$%^&*(),.?":{}|<>]`).
  - Passwords hashed with `bcryptjs` (salt rounds: 10).
  - Secure HS256 JWT tokens stored in `HttpOnly`, `SameSite=Lax` cookies.
  - Server-side authorization guards on all API handlers and server routes.
  - Forgot-password flow with time-limited (1-hour), single-use reset tokens delivered securely (with mock/console dev email fallback).

### 2. Customer 360 Management
- Full CRUD operations with soft archiving to prevent breaking historical invoices or payment records.
- Complete customer profile with company details, tax ID (GST/VAT), billing address, and account creation dates.
- Associated subscription history, active receivables, and aggregate invoice/payment ledger.

### 3. Products & Configurable Variant Pricing
- Product catalog with sales price, cost price, and status controls.
- **Product Variants with Price Adjustments**: Supports additive price adjustments (e.g. *Business Software* base ₹2,000 + *Odoo* variant ₹560 = ₹2,560 unit price).
- Server-side price calculation that never trusts client-submitted totals.

### 4. Subscription Plan Management
- Multi-frequency billing plans: **Daily**, **Weekly**, **Monthly**, and **Yearly**.
- Plan configurations: minimum quantity, availability dates, auto-close switches, and permission flags for early closure, pause/resume, and renewal.

### 5. Quotations & Quotation Templates
- Reusable quotation templates with predefined plans, line items, and quantities.
- Quotation workflow: `Draft` &rarr; `Quotation (Sent)` &rarr; `Accepted` / `Expired` / `Cancelled`.
- 1-click **Convert to Subscription** preserving quotation line items, prices, and customer details without duplication.

### 6. Subscription Lifecycle Management
- Workflow: `Draft` &rarr; `Quotation` &rarr; `Confirmed` &rarr; `Active` &rarr; `Closed`.
- Actions: Pause, Resume, Renew, and Early Close.
- Server-generated unique subscription identifiers (`SUB-YYYYMM-XXXX`).
- Automatic calendar arithmetic handling month-end boundaries (e.g., Jan 31 &rarr; Feb 28/29) and leap years.
- Complete audit trail tracking status transitions in `SubscriptionStatusHistory`.

### 7. Tax Rules & Immutable Snapshots
- Admin-configurable tax rules (e.g. GST 18%, VAT 20%, State Sales Tax 8%).
- Can be applied globally or to specific products.
- Applied tax rates and calculated amounts are stored as **immutable snapshots** on invoice line items, ensuring historical invoices never change when tax rules are updated.

### 8. Discount Rules & Usage Enforcement
- Supports **Percentage** and **Fixed-Amount** discounts.
- Constraints: minimum purchase amount, minimum item quantity, date validity ranges, and lifetime usage limits.
- Transactional discount usage tracking (`DiscountUsage`) with automatic rollback if invoice generation fails.

### 9. Invoice Management & Reconciliation
- Invoice workflow: `Draft` &rarr; `Confirmed` &rarr; `Paid`.
- Unique invoice numbering (`INV-YYYYMM-XXXX`).
- Real-time balance calculation: `outstandingBalance = totalAmount - amountPaid`.
- Overdue tracking: dynamic status derived when `dueDate < now` and `outstandingBalance > 0`.
- Printable invoice view with `window.print()` styling optimized for A4 paper export.

### 10. Recurring Billing Engine
- **Idempotency**: Enforces unique `[subscriptionId, periodStart, periodEnd]` database constraint to prevent duplicate billing.
- **Transactional**: Executes invoice creation, line snapshot recording, discount usage incrementing, and subscription `nextBillingDate` advancement within an ACID transaction.
- **Auto-Close**: Subscriptions configured with `autoClose: true` automatically transition to `Closed` when their expiry date is reached.
- Accessible via manual UI trigger in the Topbar, `/api/billing/run` API endpoint, and automated cron triggers.

### 11. Payment Recording & Reconciliation
- Supports Bank Transfer, UPI, Credit/Debit Card, Cash, and Cheque.
- Supports full and partial payments.
- Atomic balance recalculation with invoice status update to `Paid` only when balance reaches zero.
- Reconciled payment logs linked to both invoice and customer ledger.

### 12. Customer Portal (`/portal`)
- Completely separate portal for end customers.
- Displays active subscriptions, next renewal dates, current invoices, payment history, and profile details.
- Strict server-side ownership checks ensure customers can never view or access another customer's data.

### 13. Financial Reports & Analytics
- Executive dashboard with database-calculated KPIs:
  - Active Subscriptions, Period Revenue Collected, Outstanding Receivables, Overdue Balance.
  - Interactive Recharts revenue trend line chart and invoice status distribution.
- Dedicated Reports page:
  - Revenue collected over time by date range.
  - Payment method breakdown.
  - Plan and product performance metrics.
  - Discount usage reports.
  - **Export to CSV** for offline accounting and reconciliation.

---

## Prerequisites & System Requirements

- **Node.js**: v18.18.0 or later (v20+ recommended)
- **PostgreSQL**: v14, v15, v16, v17, or v18
- **Package Manager**: `npm`, `yarn`, or `pnpm`

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "coding task"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```env
   # Database Connection String
   DATABASE_URL="postgresql://postgres:postgres@localhost:8000/brightloop_db?schema=public"

   # Auth & Session Secret (minimum 32 characters)
   JWT_SECRET="brightloop-super-secret-jwt-token-key-2026-production-grade"

   # Billing Engine Cron Trigger Secret
   BILLING_CRON_SECRET="brightloop-billing-cron-secret-key-2026"

   # Application URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

---

## Database Setup & Seeding

1. **Push Schema to PostgreSQL**:
   ```bash
   npx prisma db push
   ```
   *(Or run migrations using `npx prisma migrate dev`)*

2. **Seed Database with Demo Data**:
   ```bash
   npm run db:seed
   ```
   The seed script populates the database with:
   - 1 Admin user (`admin@brightloop.com`)
   - 2 Staff users (`sarah.staff@brightloop.com`, `david.billing@brightloop.com`)
   - 5 Customers with linked user portal accounts
   - 4 Products with configurable variants
   - 4 Subscription plans (Daily, Weekly, Monthly, Yearly)
   - Multiple tax rules (GST 18%, VAT 20%, State Tax 8%)
   - Discount rules (active, expired, and usage-exhausted)
   - Realistic subscriptions in all lifecycle states (`Draft`, `Quotation`, `Confirmed`, `Active`, `Paused`, `Closed`)
   - Invoices across all statuses (`Draft`, `Confirmed`, `Paid`, `Partially Paid`, `Overdue`)
   - Payment transaction records and billing history

---

## Demo Accounts & Credentials

For fast evaluation, the login page features **1-Click Demo Fill** buttons. You can also sign in manually with the following accounts:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@brightloop.com` | `AdminPass@2026` | Full access: products, plans, taxes, discounts, staff, settings |
| **Staff** | `sarah.staff@brightloop.com` | `StaffPass@2026` | Operations: customers, quotations, subscriptions, invoices, payments |
| **Staff** | `david.billing@brightloop.com` | `StaffPass@2026` | Billing operations & customer payment reconciliation |
| **Customer** | `alex@acmecorp.com` | `CustPass@2026!` | Customer self-service portal (`/portal`) |
| **Customer** | `jane@globex.io` | `CustPass@2026!` | Customer self-service portal (`/portal`) |

---

## Recurring Billing Engine & Cron Operations

### How the Engine Works
The engine (`src/lib/billing.ts`) executes an end-to-end recurring billing cycle:
1. Queries all subscriptions where `status = 'ACTIVE'`, `nextBillingDate <= now`, and `autoClose = false` (or within expiry).
2. Validates plan eligibility and calculates line item unit prices including variant price adjustments.
3. Automatically evaluates and applies eligible discount rules (checking start/end dates, minimum quantity, and remaining usage count).
4. Applies configured tax rules and rounds lines to 2 decimal places.
5. In a database transaction:
   - Creates the `Invoice` with `status: 'CONFIRMED'`.
   - Creates `InvoiceItem` snapshots storing immutable pricing, tax, and discount details.
   - Records discount usage in `DiscountUsage` and increments `timesUsed`.
   - Records a `BillingRecord` documenting execution status and processed totals.
   - Advances `nextBillingDate` to the next cycle based on frequency (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
   - If a subscription reaches its `endDate` and `autoClose` is enabled, transitions its status to `CLOSED`.

### Triggering the Billing Engine

#### 1. Interactive Topbar Button (Admin & Staff)
Click the **"Run Billing Engine"** button located in the top navigation bar of the application dashboard. A toast notification will display the number of invoices generated and subscriptions processed.

#### 2. Manual API Request
```bash
curl -X POST http://localhost:3000/api/billing/run \
  -H "Authorization: Bearer brightloop-billing-cron-secret-key-2026"
```

#### 3. Production Automated Scheduler (Cron / Vercel Cron)
To run automated billing every morning at 02:00 UTC, configure a cron job or Vercel Cron:

**Vercel `vercel.json` Configuration**:
```json
{
  "crons": [
    {
      "path": "/api/billing/run",
      "schedule": "0 2 * * *"
    }
  ]
}
```

The endpoint validates either:
- An authenticated session with `ADMIN` or `STAFF` role, or
- A valid Bearer token matching `BILLING_CRON_SECRET`.

---

## Financial Logic & Calculation Rules

### Decimal-Safe Precision
All monetary operations utilize standard 2-decimal rounded financial arithmetic via `roundMoney(val)`:
```typescript
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
```

### Variant Pricing Formula
```
Unit Price = Base Product Price + Variant Price Adjustment
```
*Example*: Product Base ₹2,000 + Variant Adjustment ₹560 = **₹2,560**.

### Discount & Tax Order of Operations
1. **Subtotal**: Sum of `(Quantity * Unit Price)` across all line items.
2. **Discounts**:
   - Fixed discounts: Deducted directly from subtotal.
   - Percentage discounts: `Subtotal * (Discount Rate / 100)`.
   - Validated against minimum purchase amounts, minimum line quantities, date bounds, and maximum usage limits.
3. **Taxable Amount**: `Subtotal - Total Discounts`.
4. **Taxes**: `Taxable Amount * (Tax Rate / 100)`.
5. **Grand Total**: `Taxable Amount + Total Taxes`.

---

## Test Suite & Verification

The test suite runs using **Vitest** and covers all 14 business-critical workflows specified in the challenge.

### Run All Tests
```bash
npm run test
```

### Test Suite Structure
- [src/__tests__/auth-and-security.test.ts](file:///e:/OG/coding%20task/src/__tests__/auth-and-security.test.ts):
  - Password complexity validation (length, uppercase, lowercase, special characters).
  - Password hashing and verification.
  - Role-based authorization: non-admin users cannot create staff accounts.
  - Multi-tenant isolation: customer cannot access another customer's records.
- [src/__tests__/pricing-tax-discount.test.ts](file:///e:/OG/coding%20task/src/__tests__/pricing-tax-discount.test.ts):
  - Product variants modify final unit prices correctly.
  - Tax calculation precision and decimal rounding.
  - Discount validation: date ranges, minimum purchase requirements, and usage limits.
- [src/__tests__/billing-engine.test.ts](file:///e:/OG/coding%20task/src/__tests__/billing-engine.test.ts):
  - Next billing date calculation for Daily, Weekly, Monthly, and Yearly frequencies.
  - Month-end date clamping (Jan 31 &rarr; Feb 28) and leap year handling.
  - Idempotency: duplicate billing for the same subscription and period is rejected.
  - Partial and full payment balance reconciliation.
  - Overdue invoice detection logic.
  - Paused and closed subscriptions excluded from billing.
  - Pagination and filtering utility verification.
- [src/__tests__/integration.test.ts](file:///e:/OG/coding%20task/src/__tests__/integration.test.ts):
  - Database integration: duplicate email registration rejection.
  - Live billing engine execution: invoice creation, billing record logging, and next billing date advancement.

---

## Production Deployment Guide

### Deploying to Vercel with Hosted PostgreSQL (Neon / Supabase / AWS RDS)

1. **Database Setup**:
   - Provision a PostgreSQL database instance on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [AWS RDS](https://aws.amazon.com/rds/).
   - Copy the connection string.

2. **Deploy with Vercel**:
   - Import your repository into Vercel.
   - Set the following environment variables in Vercel Project Settings:
     - `DATABASE_URL`: Your hosted PostgreSQL connection URI with SSL (`?sslmode=require`).
     - `JWT_SECRET`: A secure 32+ character random secret string.
     - `BILLING_CRON_SECRET`: A secure random secret string for scheduled billing calls.
     - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL (e.g., `https://brightloop.vercel.app`).
   - Run database schema migration on build:
     ```bash
     npx prisma db push && npm run db:seed
     ```

3. **Verify Deployment**:
   - Log in using `admin@brightloop.com` / `AdminPass@2026`.
   - Access Dashboard, test subscription workflows, trigger the billing engine, and inspect reports.

---

## Security & Performance Design

- **Server-Side Authorization**: Every protected API route validates sessions using JWT verification and role checks. Roles and ownership cannot be manipulated on the client.
- **Data Isolation**: Customer portal queries enforce `where: { customerId: user.customerId }`, preventing IDOR vulnerabilities.
- **SQL Injection Prevention**: Prisma ORM utilizes parameterized queries exclusively.
- **N+1 Query Avoidance**: Queries use selective `include` joins to fetch related items, customers, and plans in single roundtrips.
- **Fast Response Times**: Indexed fields on `customerId`, `subscriptionId`, `status`, `nextBillingDate`, and `invoiceDate` ensure low latency under high volume.
- **Zero Placeholder Data**: All dashboard metrics, graphs, tables, and reports are dynamically aggregated from active database rows.

---

## License

This project was built for the Brightloop Software technical assessment. All rights reserved.
