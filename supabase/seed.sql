-- ==============================================================================
-- BRIGHTLOOP SOFTWARE - SUPABASE SEED DATA
-- Default catalog, plans, taxes, discounts, demo customers, subscriptions & invoices
-- ==============================================================================

-- 1. Insert Products
INSERT INTO public.products (id, name, type, sales_price, cost_price, description, is_active)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'Business Software (ERP Core)', 'SOFTWARE', 2000.00, 500.00, 'Enterprise ERP Suite for Financial and Operational Workflows', true),
    ('c0000001-0000-0000-0000-000000000002', 'Cloud Hosting Enterprise', 'SERVICE', 5000.00, 1500.00, 'High-Availability Multi-Region Kubernetes Compute Cluster', true),
    ('c0000001-0000-0000-0000-000000000003', 'Professional IT Advisory', 'SERVICE', 3500.00, 1000.00, 'Dedicated Solutions Architect & Technical Account Manager', true),
    ('c0000001-0000-0000-0000-000000000004', 'Developer Workspace Pro', 'SOFTWARE', 800.00, 150.00, 'Cloud Development IDE with Automated CI/CD Pipelines', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Product Variants
INSERT INTO public.product_variants (id, product_id, name, price_adjustment, sku, is_active)
VALUES
    ('c0000002-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Odoo Connector', 560.00, 'ERP-ODOO-MOD', true),
    ('c0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'SAP Integration Suite', 1200.00, 'ERP-SAP-MOD', true),
    ('c0000002-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000002', '16 vCPU / 64GB RAM Boost', 2500.00, 'CLOUD-16C-64G', true),
    ('c0000002-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000004', 'Unlimited Team Collaboration', 400.00, 'DEV-TEAM-ADDON', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Subscription Plans
INSERT INTO public.plans (id, name, description, billing_frequency, min_quantity, start_date, end_date, auto_close, can_pause, can_renew, can_early_close, is_active)
VALUES
    ('c0000003-0000-0000-0000-000000000001', 'Monthly Professional Tier', 'Standard Monthly Billing with full platform access and automated invoicing', 'MONTHLY', 1, NOW() - INTERVAL '60 days', NOW() + INTERVAL '365 days', false, true, true, true, true),
    ('c0000003-0000-0000-0000-000000000002', 'Yearly Enterprise Contract', 'Annual Billing Commitment with priority 24/7 SLA and custom integrations', 'YEARLY', 1, NOW() - INTERVAL '120 days', NOW() + INTERVAL '730 days', false, true, true, true, true),
    ('c0000003-0000-0000-0000-000000000003', 'Weekly Growth Tier', 'Agile Weekly Billing for high-turnover consulting teams and contractors', 'WEEKLY', 1, NOW() - INTERVAL '30 days', NOW() + INTERVAL '180 days', false, true, true, true, true),
    ('c0000003-0000-0000-0000-000000000004', 'Daily Pilot Tier', 'Automated Daily Cadence for enterprise sandbox pilots and stress-testing', 'DAILY', 1, NOW() - INTERVAL '10 days', NOW() + INTERVAL '30 days', true, true, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Tax Rules
INSERT INTO public.tax_rules (id, name, rate, description, is_global, is_active)
VALUES
    ('c0000004-0000-0000-0000-000000000001', 'GST 18% (Standard Domestic)', 18.00, 'Standard Goods & Services Tax for India & Domestic SaaS Clients', true, true),
    ('c0000004-0000-0000-0000-000000000002', 'VAT 20% (UK & EU)', 20.00, 'Value Added Tax for cross-border European and UK digital services', true, true),
    ('c0000004-0000-0000-0000-000000000003', 'State Sales Tax (8%)', 8.00, 'Standard US State Level Digital Services Surcharge', true, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Discount Rules
INSERT INTO public.discount_rules (id, code, description, type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, times_used, is_active)
VALUES
    ('c0000005-0000-0000-0000-000000000001', 'WELCOME20', '20% Welcome Discount for new enterprise clients', 'PERCENTAGE', 20.00, 1000.00, 1, NOW() - INTERVAL '30 days', NOW() + INTERVAL '90 days', 500, 12, true),
    ('c0000005-0000-0000-0000-000000000002', 'EARLYBIRD500', 'Fixed INR 500 Flat Savings on contracts over INR 2500', 'FIXED', 500.00, 2500.00, 1, NOW() - INTERVAL '15 days', NOW() + INTERVAL '60 days', 100, 4, true),
    ('c0000005-0000-0000-0000-000000000003', 'EXPIRED2024', 'Historical Promotional Coupon (Expired)', 'PERCENTAGE', 15.00, 500.00, 1, NOW() - INTERVAL '365 days', NOW() - INTERVAL '30 days', 50, 50, false),
    ('c0000005-0000-0000-0000-000000000004', 'MAXEDOUT', 'Usage-Exhausted Coupon Code', 'FIXED', 1000.00, 2000.00, 1, NOW() - INTERVAL '10 days', NOW() + INTERVAL '60 days', 5, 5, true)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Demo Customers
INSERT INTO public.customers (id, name, email, company_name, phone, billing_address, tax_id, is_archived)
VALUES
    ('c0000006-0000-0000-0000-000000000001', 'Priya Sharma', 'priya@techvision.io', 'TechVision Analytics Pvt Ltd', '+91 98765 22222', 'Cyber City, Gurugram, HR, India', '06AAACT4321K1Z2', false),
    ('c0000006-0000-0000-0000-000000000002', 'Alex Morgan', 'alex@acmecorp.com', 'Acme Technologies Ltd', '+1 415 555 0192', '100 Market St, San Francisco, CA, USA', 'US-EIN-9481920', false),
    ('c0000006-0000-0000-0000-000000000003', 'Jane Doe', 'jane@globex.io', 'Globex Industries International', '+44 20 7946 0912', 'Canary Wharf, London, UK', 'GB-VAT-8910293', false),
    ('c0000006-0000-0000-0000-000000000004', 'Marcus Vance', 'marcus@vanguardlabs.com', 'Vanguard Labs LLC', '+1 212 555 8839', 'Midtown East, New York, NY, USA', 'US-EIN-1293847', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Demo User Profiles
INSERT INTO public.user_profiles (id, email, name, role, is_active, password_hash)
VALUES
    ('c0000007-0000-0000-0000-000000000001', 'admin@brightloop.com', 'System Admin', 'ADMIN', true, '$2b$10$w09uQ42mH48zL4PZ3mG19uK1a5vL3v79WzRz1e3y4u5i6o7p8q9r.'),
    ('c0000007-0000-0000-0000-000000000002', 'sarah.staff@brightloop.com', 'Sarah Jenkins', 'STAFF', true, '$2b$10$w09uQ42mH48zL4PZ3mG19uK1a5vL3v79WzRz1e3y4u5i6o7p8q9r.'),
    ('c0000007-0000-0000-0000-000000000003', 'alex@acmecorp.com', 'Alex Morgan', 'CUSTOMER', true, '$2b$10$w09uQ42mH48zL4PZ3mG19uK1a5vL3v79WzRz1e3y4u5i6o7p8q9r.')
ON CONFLICT (email) DO NOTHING;

-- Link Alex to Customer Record
UPDATE public.user_profiles
SET customer_id = 'c0000006-0000-0000-0000-000000000002'
WHERE email = 'alex@acmecorp.com';

UPDATE public.customers
SET user_id = 'c0000007-0000-0000-0000-000000000003'
WHERE email = 'alex@acmecorp.com';
