-- ==============================================================================
-- BRIGHTLOOP SOFTWARE - SUPABASE POSTGRESQL MIGRATION
-- Modules: Users, Customers, Products, Variants, Plans, Quotations, 
--          Subscriptions, Invoices, Payments, Taxes, Discounts, Billing, Audit
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('SOFTWARE', 'SERVICE', 'HARDWARE', 'SUBSCRIPTION_TIER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE billing_frequency AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE quotation_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('BANK_TRANSFER', 'UPI', 'CARD', 'CASH', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('FIXED', 'PERCENTAGE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE billing_record_status AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLES DEFINITION

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50),
    billing_address TEXT,
    tax_id VARCHAR(100),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (Linked with Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supabase_uid UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role user_role DEFAULT 'CUSTOMER',
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add customer foreign key back to user_profiles
DO $$ BEGIN
    ALTER TABLE public.customers
    ADD CONSTRAINT fk_customers_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type product_type DEFAULT 'SOFTWARE',
    sales_price DECIMAL(12, 2) DEFAULT 0.00,
    cost_price DECIMAL(12, 2) DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price_adjustment DECIMAL(12, 2) DEFAULT 0.00,
    sku VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    billing_frequency billing_frequency DEFAULT 'MONTHLY',
    min_quantity INTEGER DEFAULT 1,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    auto_close BOOLEAN DEFAULT FALSE,
    can_pause BOOLEAN DEFAULT TRUE,
    can_renew BOOLEAN DEFAULT TRUE,
    can_early_close BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Rules
CREATE TABLE IF NOT EXISTS public.tax_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rate DECIMAL(5, 2) NOT NULL,
    description TEXT,
    is_global BOOLEAN DEFAULT TRUE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Rules
CREATE TABLE IF NOT EXISTS public.discount_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    type discount_type DEFAULT 'PERCENTAGE',
    value DECIMAL(12, 2) NOT NULL,
    min_purchase_amount DECIMAL(12, 2) DEFAULT 0.00,
    min_quantity INTEGER DEFAULT 1,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    max_uses INTEGER,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotation Templates
CREATE TABLE IF NOT EXISTS public.quotation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status quotation_status DEFAULT 'DRAFT',
    valid_until TIMESTAMPTZ,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    total_tax DECIMAL(12, 2) DEFAULT 0.00,
    total_discount DECIMAL(12, 2) DEFAULT 0.00,
    grand_total DECIMAL(12, 2) DEFAULT 0.00,
    notes TEXT,
    converted_subscription_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotation Line Items
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status subscription_status DEFAULT 'DRAFT',
    billing_frequency billing_frequency DEFAULT 'MONTHLY',
    start_date TIMESTAMPTZ NOT NULL,
    next_billing_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ,
    auto_close BOOLEAN DEFAULT FALSE,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    total_tax DECIMAL(12, 2) DEFAULT 0.00,
    total_discount DECIMAL(12, 2) DEFAULT 0.00,
    grand_total DECIMAL(12, 2) DEFAULT 0.00,
    discount_id UUID REFERENCES public.discount_rules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Line Items
CREATE TABLE IF NOT EXISTS public.subscription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Audit Status History
CREATE TABLE IF NOT EXISTS public.subscription_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    from_status subscription_status,
    to_status subscription_status NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    status invoice_status DEFAULT 'DRAFT',
    invoice_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    total_tax DECIMAL(12, 2) DEFAULT 0.00,
    total_discount DECIMAL(12, 2) DEFAULT 0.00,
    grand_total DECIMAL(12, 2) DEFAULT 0.00,
    amount_paid DECIMAL(12, 2) DEFAULT 0.00,
    outstanding_balance DECIMAL(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Idempotency constraint to prevent duplicate invoice generation
    CONSTRAINT unique_subscription_period UNIQUE (subscription_id, period_start, period_end)
);

-- Invoice Line Items (Immutable financial snapshots)
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method payment_method DEFAULT 'CARD',
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    transaction_ref VARCHAR(255),
    notes TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Usage
CREATE TABLE IF NOT EXISTS public.discount_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_id UUID NOT NULL REFERENCES public.discount_rules(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing Records (Engine Log)
CREATE TABLE IF NOT EXISTS public.billing_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    execution_date TIMESTAMPTZ DEFAULT NOW(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    status billing_record_status DEFAULT 'SUCCESS',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDICES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_archived ON public.customers(is_archived);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON public.subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Helper functions to get authenticated user role & customer_id from JWT auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.user_profiles WHERE supabase_uid = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_customer_id()
RETURNS UUID AS $$
    SELECT customer_id FROM public.user_profiles WHERE supabase_uid = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES: USER PROFILES
CREATE POLICY "Admins have full access to user profiles"
    ON public.user_profiles FOR ALL
    USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Users can view and edit their own profile"
    ON public.user_profiles FOR ALL
    USING (supabase_uid = auth.uid());

CREATE POLICY "Staff can view user profiles"
    ON public.user_profiles FOR SELECT
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

-- POLICIES: CUSTOMERS
CREATE POLICY "Admin and Staff can manage customers"
    ON public.customers FOR ALL
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Customers can view their own customer record"
    ON public.customers FOR SELECT
    USING (id = public.get_current_customer_id());

-- POLICIES: PRODUCTS & VARIANTS
CREATE POLICY "Admin can manage products"
    ON public.products FOR ALL
    USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "All authenticated users can view active products"
    ON public.products FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage variants"
    ON public.product_variants FOR ALL
    USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "All authenticated users can view active variants"
    ON public.product_variants FOR SELECT
    USING (auth.role() = 'authenticated');

-- POLICIES: PLANS
CREATE POLICY "Admin can manage plans"
    ON public.plans FOR ALL
    USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "All authenticated users can view active plans"
    ON public.plans FOR SELECT
    USING (auth.role() = 'authenticated');

-- POLICIES: SUBSCRIPTIONS & ITEMS
CREATE POLICY "Admin and Staff can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Customers can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (customer_id = public.get_current_customer_id());

CREATE POLICY "Admin and Staff can manage subscription items"
    ON public.subscription_items FOR ALL
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Customers can view their own subscription items"
    ON public.subscription_items FOR SELECT
    USING (subscription_id IN (
        SELECT id FROM public.subscriptions WHERE customer_id = public.get_current_customer_id()
    ));

-- POLICIES: INVOICES & INVOICE ITEMS
CREATE POLICY "Admin and Staff can manage invoices"
    ON public.invoices FOR ALL
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Customers can view their own invoices"
    ON public.invoices FOR SELECT
    USING (customer_id = public.get_current_customer_id());

CREATE POLICY "Admin and Staff can manage invoice items"
    ON public.invoice_items FOR ALL
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Customers can view their own invoice items"
    ON public.invoice_items FOR SELECT
    USING (invoice_id IN (
        SELECT id FROM public.invoices WHERE customer_id = public.get_current_customer_id()
    ));

-- POLICIES: PAYMENTS
CREATE POLICY "Admin and Staff can manage payments"
    ON public.payments FOR ALL
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Customers can view their own payments"
    ON public.payments FOR SELECT
    USING (customer_id = public.get_current_customer_id());

CREATE POLICY "Customers can record online payments for their invoices"
    ON public.payments FOR INSERT
    WITH CHECK (customer_id = public.get_current_customer_id());

-- POLICIES: TAX RULES & DISCOUNTS
CREATE POLICY "Admin can manage tax rules"
    ON public.tax_rules FOR ALL
    USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Staff can view tax rules"
    ON public.tax_rules FOR SELECT
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Admin can manage discount rules"
    ON public.discount_rules FOR ALL
    USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Authenticated users can view valid discount rules"
    ON public.discount_rules FOR SELECT
    USING (auth.role() = 'authenticated');

-- POLICIES: BILLING RECORDS & AUDIT LOGS
CREATE POLICY "Admin and Staff can view billing records"
    ON public.billing_records FOR SELECT
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Admin can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.get_current_user_role() IN ('ADMIN', 'STAFF'));

-- 6. AUTOMATIC AUTH USER PROFILE SYNC TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (supabase_uid, email, name, role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CUSTOMER'),
        TRUE
    )
    ON CONFLICT (email) DO UPDATE
    SET supabase_uid = NEW.id,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (enabled when using Supabase Auth)
DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN undefined_table THEN null; END $$;
