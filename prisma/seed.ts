import { PrismaClient, Role, ProductType, BillingFrequency, QuotationStatus, SubscriptionStatus, InvoiceStatus, PaymentMethod, DiscountType, BillingRecordStatus, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subDays, addMonths, subMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Brightloop Software database...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.billingRecord.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.discountUsage.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionStatusHistory.deleteMany();
  await prisma.subscriptionItem.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.taxRuleProduct.deleteMany();
  await prisma.taxRule.deleteMany();
  await prisma.discountRule.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing tables.');

  // 2. Passwords hashing
  const adminPassHash = await bcrypt.hash('AdminPass@2026', 10);
  const staffPassHash = await bcrypt.hash('StaffPass@2026', 10);
  const custPassHash = await bcrypt.hash('CustPass@2026!', 10);

  // 3. Create Admin & Staff Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@brightloop.com',
      passwordHash: adminPassHash,
      role: Role.ADMIN,
    },
  });

  const staffUser1 = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'sarah.staff@brightloop.com',
      passwordHash: staffPassHash,
      role: Role.STAFF,
    },
  });

  const staffUser2 = await prisma.user.create({
    data: {
      name: 'David Billing',
      email: 'david.billing@brightloop.com',
      passwordHash: staffPassHash,
      role: Role.STAFF,
    },
  });

  console.log('Created Admin & 2 Staff accounts.');

  // 4. Create 5 Customers with linked Users
  const customerData = [
    {
      name: 'Alex Morgan',
      email: 'alex@acmecorp.com',
      companyName: 'Acme Corp Technologies',
      phone: '+91 98765 11111',
      billingAddress: 'Tower B, Tech Park, Bangalore, KA, India',
      taxId: '29ABCDE1234F1Z5',
    },
    {
      name: 'Priya Sharma',
      email: 'priya@techvision.io',
      companyName: 'TechVision Analytics Pvt Ltd',
      phone: '+91 98765 22222',
      billingAddress: 'Cyber City, Gurugram, HR, India',
      taxId: '06AAACT4321K1Z2',
    },
    {
      name: 'Marco Rossi',
      email: 'marco@globallogistics.com',
      companyName: 'Global Logistics Software Inc',
      phone: '+91 98765 33333',
      billingAddress: 'Bandra Kurla Complex, Mumbai, MH, India',
      taxId: '27AABCG9876L1Z8',
    },
    {
      name: 'Elena Rostova',
      email: 'elena@cloudscale.net',
      companyName: 'CloudScale Infrastructure Solutions',
      phone: '+91 98765 44444',
      billingAddress: 'Hitec City, Hyderabad, TG, India',
      taxId: '36AACC8888P1Z4',
    },
    {
      name: 'David Kim',
      email: 'david@apexsolutions.co',
      companyName: 'Apex Financial Software Ltd',
      phone: '+91 98765 55555',
      billingAddress: 'Salt Lake Sector V, Kolkata, WB, India',
      taxId: '19AAACF9999Q1Z1',
    },
  ];

  const customers = [];
  for (const cd of customerData) {
    const user = await prisma.user.create({
      data: {
        name: cd.name,
        email: cd.email,
        passwordHash: custPassHash,
        role: Role.CUSTOMER,
      },
    });

    const cust = await prisma.customer.create({
      data: {
        userId: user.id,
        name: cd.name,
        email: cd.email,
        companyName: cd.companyName,
        phone: cd.phone,
        billingAddress: cd.billingAddress,
        taxId: cd.taxId,
      },
    });
    customers.push(cust);
  }
  console.log(`Created ${customers.length} customer accounts with linked user logins.`);

  // 5. Create Products & Product Variants
  // Product 1: Business Software (base ₹2000), variant Odoo (+₹560), final ₹2560
  const prod1 = await prisma.product.create({
    data: {
      name: 'Business Software',
      type: ProductType.SOFTWARE,
      salesPrice: new Prisma.Decimal(2000.0),
      costPrice: new Prisma.Decimal(800.0),
      description: 'Core enterprise business resource planning application',
      isActive: true,
      variants: {
        create: [
          { name: 'Odoo Connector', priceAdjustment: new Prisma.Decimal(560.0), isActive: true },
          { name: 'Salesforce Sync', priceAdjustment: new Prisma.Decimal(750.0), isActive: true },
        ],
      },
    },
    include: { variants: true },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Enterprise Cloud Suite',
      type: ProductType.SOFTWARE,
      salesPrice: new Prisma.Decimal(5000.0),
      costPrice: new Prisma.Decimal(1800.0),
      description: 'Advanced multi-tenant financial reporting and audit module',
      isActive: true,
      variants: {
        create: [
          { name: 'Dedicated VPC Isolation', priceAdjustment: new Prisma.Decimal(2500.0), isActive: true },
          { name: 'High-Availability Cluster', priceAdjustment: new Prisma.Decimal(1500.0), isActive: true },
        ],
      },
    },
    include: { variants: true },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: 'API Rate Boost Tier',
      type: ProductType.SERVICE,
      salesPrice: new Prisma.Decimal(1200.0),
      costPrice: new Prisma.Decimal(300.0),
      description: 'Higher throughput API quotas and dedicated webhooks',
      isActive: true,
    },
    include: { variants: true },
  });

  console.log('Created products and configurable variants.');

  // 6. Create Tax Rules & link to products
  const taxGST18 = await prisma.taxRule.create({
    data: {
      name: 'GST 18%',
      rate: new Prisma.Decimal(18.0),
      description: 'Standard Goods & Services Tax for domestic software',
      applicableProductType: ProductType.SOFTWARE,
      isActive: true,
      applicableProducts: {
        create: [{ productId: prod1.id }, { productId: prod2.id }],
      },
    },
  });

  const taxVAT5 = await prisma.taxRule.create({
    data: {
      name: 'Standard VAT 5%',
      rate: new Prisma.Decimal(5.0),
      description: 'Export / international cross-border digital service tax',
      applicableProductType: ProductType.SERVICE,
      isActive: true,
      applicableProducts: {
        create: [{ productId: prod3.id }],
      },
    },
  });

  console.log('Created tax rules.');

  // 7. Create Discount Rules
  const discWelcome = await prisma.discountRule.create({
    data: {
      code: 'WELCOME15',
      name: 'Welcome 15% Promotion',
      type: DiscountType.PERCENTAGE,
      value: new Prisma.Decimal(15.0),
      minPurchase: new Prisma.Decimal(1000.0),
      maxUses: 100,
      currentUses: 3,
      isWholeSubscription: true,
      isActive: true,
    },
  });

  const discExhausted = await prisma.discountRule.create({
    data: {
      code: 'FLASH500',
      name: 'Flash Launch ₹500',
      type: DiscountType.FIXED,
      value: new Prisma.Decimal(500.0),
      minPurchase: new Prisma.Decimal(2000.0),
      maxUses: 5,
      currentUses: 5, // Exhausted
      isWholeSubscription: true,
      isActive: true,
    },
  });

  const discExpired = await prisma.discountRule.create({
    data: {
      code: 'HOLIDAY2025',
      name: 'Holiday 2025 Special',
      type: DiscountType.PERCENTAGE,
      value: new Prisma.Decimal(20.0),
      startDate: subMonths(new Date(), 12),
      endDate: subMonths(new Date(), 8), // Expired
      isWholeSubscription: true,
      isActive: true,
    },
  });

  console.log('Created active, exhausted, and expired discount rules.');

  // 8. Create Subscription Plans (Daily, Weekly, Monthly, Yearly)
  const planDaily = await prisma.plan.create({
    data: {
      productId: prod3.id,
      name: 'Daily Elastic Burst',
      description: 'On-demand daily cloud processing license',
      price: new Prisma.Decimal(150.0),
      billingFrequency: BillingFrequency.DAILY,
      minQuantity: 1,
      autoClose: true,
      canEarlyClose: true,
      canPause: true,
      canRenew: true,
      isActive: true,
    },
  });

  const planWeekly = await prisma.plan.create({
    data: {
      productId: prod1.id,
      name: 'Weekly Sprint Pass',
      description: 'Short term project evaluation sprint license',
      price: new Prisma.Decimal(850.0),
      billingFrequency: BillingFrequency.WEEKLY,
      minQuantity: 1,
      canEarlyClose: true,
      canPause: true,
      canRenew: true,
      isActive: true,
    },
  });

  const planMonthly = await prisma.plan.create({
    data: {
      productId: prod1.id,
      name: 'Business Standard Monthly',
      description: 'Full featured monthly business software plan',
      price: new Prisma.Decimal(2560.0),
      billingFrequency: BillingFrequency.MONTHLY,
      minQuantity: 1,
      autoClose: false,
      canEarlyClose: true,
      canPause: true,
      canRenew: true,
      isActive: true,
    },
  });

  const planYearly = await prisma.plan.create({
    data: {
      productId: prod2.id,
      name: 'Enterprise Prime Annual',
      description: 'Complete cloud enterprise suite billed annually',
      price: new Prisma.Decimal(65000.0),
      billingFrequency: BillingFrequency.YEARLY,
      minQuantity: 1,
      autoClose: false,
      canEarlyClose: false,
      canPause: false,
      canRenew: true,
      isActive: true,
    },
  });

  console.log('Created daily, weekly, monthly, and yearly subscription plans.');

  // 9. Create Quotations
  const quote1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-00001',
      customerId: customers[0].id,
      status: QuotationStatus.ACCEPTED,
      validUntil: addDays(new Date(), 20),
      subtotal: new Prisma.Decimal(2560.0),
      taxTotal: new Prisma.Decimal(460.8),
      discountTotal: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(3020.8),
      items: {
        create: [
          {
            productId: prod1.id,
            variantId: prod1.variants[0].id, // Odoo variant (+560) -> 2560
            quantity: 1,
            unitPrice: new Prisma.Decimal(2560.0),
            taxRate: new Prisma.Decimal(18.0),
            taxAmount: new Prisma.Decimal(460.8),
            discountAmount: new Prisma.Decimal(0),
            total: new Prisma.Decimal(3020.8),
          },
        ],
      },
    },
  });

  const quote2 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-00002',
      customerId: customers[1].id,
      status: QuotationStatus.SENT,
      validUntil: addDays(new Date(), 15),
      subtotal: new Prisma.Decimal(5000.0),
      taxTotal: new Prisma.Decimal(900.0),
      discountTotal: new Prisma.Decimal(500.0),
      grandTotal: new Prisma.Decimal(5400.0),
      items: {
        create: [
          {
            productId: prod2.id,
            quantity: 1,
            unitPrice: new Prisma.Decimal(5000.0),
            taxRate: new Prisma.Decimal(18.0),
            taxAmount: new Prisma.Decimal(900.0),
            discountAmount: new Prisma.Decimal(500.0),
            total: new Prisma.Decimal(5400.0),
          },
        ],
      },
    },
  });

  // 10. Create Subscriptions in various required states:
  // Sub 1: ACTIVE (Alex Morgan at Acme Corp)
  const sub1StartDate = subMonths(new Date(), 2);
  const sub1NextDate = addMonths(new Date(), 1);

  const sub1 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-00001',
      customerId: customers[0].id,
      planId: planMonthly.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: sub1StartDate,
      billingFrequency: BillingFrequency.MONTHLY,
      nextBillingDate: sub1NextDate,
      currency: 'INR',
      subtotal: new Prisma.Decimal(2560.0),
      taxTotal: new Prisma.Decimal(460.8),
      discountTotal: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(3020.8),
      autoClose: false,
      items: {
        create: [
          {
            productId: prod1.id,
            variantId: prod1.variants[0].id,
            quantity: 1,
            unitPrice: new Prisma.Decimal(2560.0),
            subtotal: new Prisma.Decimal(2560.0),
          },
        ],
      },
      statusHistory: {
        create: [
          { fromStatus: null, toStatus: SubscriptionStatus.CONFIRMED, reason: 'Converted from quotation QT-2026-00001', changedByUserId: staffUser1.id },
          { fromStatus: SubscriptionStatus.CONFIRMED, toStatus: SubscriptionStatus.ACTIVE, reason: 'Initial contract activation', changedByUserId: staffUser1.id },
        ],
      },
    },
  });

  // Link converted quotation
  await prisma.quotation.update({
    where: { id: quote1.id },
    data: { convertedSubscriptionId: sub1.id },
  });

  // Sub 2: ACTIVE (Due for billing today! Priya Sharma at TechVision)
  const sub2 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-00002',
      customerId: customers[1].id,
      planId: planMonthly.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: subMonths(new Date(), 1),
      billingFrequency: BillingFrequency.MONTHLY,
      nextBillingDate: subDays(new Date(), 1), // DUE! <= now
      currency: 'INR',
      subtotal: new Prisma.Decimal(2560.0),
      taxTotal: new Prisma.Decimal(460.8),
      discountTotal: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(3020.8),
      items: {
        create: [
          {
            productId: prod1.id,
            variantId: prod1.variants[0].id,
            quantity: 1,
            unitPrice: new Prisma.Decimal(2560.0),
            subtotal: new Prisma.Decimal(2560.0),
          },
        ],
      },
      statusHistory: {
        create: [
          { fromStatus: null, toStatus: SubscriptionStatus.ACTIVE, reason: 'Direct onboarding subscription', changedByUserId: staffUser1.id },
        ],
      },
    },
  });

  // Sub 3: CONFIRMED (Marco Rossi)
  const sub3 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-00003',
      customerId: customers[2].id,
      planId: planYearly.id,
      status: SubscriptionStatus.CONFIRMED,
      startDate: new Date(),
      billingFrequency: BillingFrequency.YEARLY,
      nextBillingDate: addDays(new Date(), 7),
      currency: 'INR',
      subtotal: new Prisma.Decimal(65000.0),
      taxTotal: new Prisma.Decimal(11700.0),
      discountTotal: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(76700.0),
      items: {
        create: [
          {
            productId: prod2.id,
            quantity: 1,
            unitPrice: new Prisma.Decimal(65000.0),
            subtotal: new Prisma.Decimal(65000.0),
          },
        ],
      },
    },
  });

  // Sub 4: PAUSED (Elena Rostova)
  const sub4 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-00004',
      customerId: customers[3].id,
      planId: planWeekly.id,
      status: SubscriptionStatus.PAUSED,
      startDate: subMonths(new Date(), 1),
      billingFrequency: BillingFrequency.WEEKLY,
      nextBillingDate: addDays(new Date(), 3),
      currency: 'INR',
      subtotal: new Prisma.Decimal(850.0),
      taxTotal: new Prisma.Decimal(153.0),
      discountTotal: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(1003.0),
      items: {
        create: [
          {
            productId: prod1.id,
            quantity: 1,
            unitPrice: new Prisma.Decimal(850.0),
            subtotal: new Prisma.Decimal(850.0),
          },
        ],
      },
      statusHistory: {
        create: [
          { fromStatus: SubscriptionStatus.ACTIVE, toStatus: SubscriptionStatus.PAUSED, reason: 'Customer requested pause during infra maintenance', changedByUserId: staffUser1.id },
        ],
      },
    },
  });

  // Sub 5: CLOSED (David Kim)
  const sub5 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-00005',
      customerId: customers[4].id,
      planId: planDaily.id,
      status: SubscriptionStatus.CLOSED,
      startDate: subMonths(new Date(), 2),
      expiryDate: subDays(new Date(), 10),
      autoClose: true,
      billingFrequency: BillingFrequency.DAILY,
      nextBillingDate: subDays(new Date(), 10),
      currency: 'INR',
      subtotal: new Prisma.Decimal(150.0),
      taxTotal: new Prisma.Decimal(7.5),
      discountTotal: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(157.5),
      items: {
        create: [
          {
            productId: prod3.id,
            quantity: 1,
            unitPrice: new Prisma.Decimal(150.0),
            subtotal: new Prisma.Decimal(150.0),
          },
        ],
      },
      statusHistory: {
        create: [
          { fromStatus: SubscriptionStatus.ACTIVE, toStatus: SubscriptionStatus.CLOSED, reason: 'Auto-closed upon reaching expiration date', changedByUserId: null },
        ],
      },
    },
  });

  console.log('Created subscriptions across Active, Due, Confirmed, Paused, and Closed statuses.');

  // 11. Create Invoices (PAID, PARTIALLY PAID, OVERDUE, DRAFT)
  // Invoice 1: PAID (against Sub 1, Period 1)
  const inv1Start = subMonths(new Date(), 2);
  const inv1End = subMonths(new Date(), 1);
  const inv1Due = addDays(inv1Start, 15);

  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-00001',
      subscriptionId: sub1.id,
      customerId: customers[0].id,
      status: InvoiceStatus.PAID,
      invoiceDate: inv1Start,
      periodStart: inv1Start,
      periodEnd: inv1End,
      dueDate: inv1Due,
      subtotal: new Prisma.Decimal(2560.0),
      totalTax: new Prisma.Decimal(460.8),
      totalDiscount: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(3020.8),
      amountPaid: new Prisma.Decimal(3020.8),
      outstandingBalance: new Prisma.Decimal(0.0),
      notes: 'Initial billing cycle for Business Standard Monthly',
      items: {
        create: [
          {
            productId: prod1.id,
            variantId: prod1.variants[0].id,
            description: 'Business Software (Odoo Connector)',
            quantity: 1,
            unitPrice: new Prisma.Decimal(2560.0),
            taxRate: new Prisma.Decimal(18.0),
            taxAmount: new Prisma.Decimal(460.8),
            discountAmount: new Prisma.Decimal(0),
            lineTotal: new Prisma.Decimal(3020.8),
          },
        ],
      },
    },
  });

  // Record Payment for Invoice 1
  const pmt1 = await prisma.payment.create({
    data: {
      paymentReference: 'PAY-2026-00001',
      invoiceId: inv1.id,
      customerId: customers[0].id,
      amount: new Prisma.Decimal(3020.8),
      paymentDate: addDays(inv1Start, 3),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      transactionRef: 'NEFT-HDFC-9918273645',
      notes: 'Paid via HDFC bank transfer',
      recordedByUserId: staffUser1.id,
    },
  });

  // Invoice 2: CONFIRMED with PARTIAL PAYMENT (Priya Sharma at TechVision)
  const inv2Start = subDays(new Date(), 10);
  const inv2End = addDays(new Date(), 20);
  const inv2Due = addDays(inv2Start, 15);

  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-00002',
      subscriptionId: sub2.id,
      customerId: customers[1].id,
      status: InvoiceStatus.CONFIRMED,
      invoiceDate: inv2Start,
      periodStart: inv2Start,
      periodEnd: inv2End,
      dueDate: inv2Due,
      subtotal: new Prisma.Decimal(5000.0),
      totalTax: new Prisma.Decimal(900.0),
      totalDiscount: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(5900.0),
      amountPaid: new Prisma.Decimal(2000.0),
      outstandingBalance: new Prisma.Decimal(3900.0),
      notes: 'Monthly billing cycle - Partial installment received',
      items: {
        create: [
          {
            productId: prod2.id,
            description: 'Enterprise Cloud Suite Base',
            quantity: 1,
            unitPrice: new Prisma.Decimal(5000.0),
            taxRate: new Prisma.Decimal(18.0),
            taxAmount: new Prisma.Decimal(900.0),
            discountAmount: new Prisma.Decimal(0),
            lineTotal: new Prisma.Decimal(5900.0),
          },
        ],
      },
    },
  });

  // Partial Payment for Invoice 2
  const pmt2 = await prisma.payment.create({
    data: {
      paymentReference: 'PAY-2026-00002',
      invoiceId: inv2.id,
      customerId: customers[1].id,
      amount: new Prisma.Decimal(2000.0),
      paymentDate: addDays(inv2Start, 2),
      paymentMethod: PaymentMethod.UPI,
      transactionRef: 'UPI-RAZORPAY-8723615243',
      notes: 'Advance installment recorded',
      recordedByUserId: staffUser2.id,
    },
  });

  // Invoice 3: OVERDUE! (Marco Rossi at GlobalLogistics)
  // dueDate was 12 days ago, balance is outstanding!
  const inv3Start = subDays(new Date(), 30);
  const inv3End = new Date();
  const inv3Due = subDays(new Date(), 15); // Past due!

  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-00003',
      subscriptionId: sub3.id,
      customerId: customers[2].id,
      status: InvoiceStatus.CONFIRMED,
      invoiceDate: inv3Start,
      periodStart: inv3Start,
      periodEnd: inv3End,
      dueDate: inv3Due,
      subtotal: new Prisma.Decimal(2560.0),
      totalTax: new Prisma.Decimal(460.8),
      totalDiscount: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(3020.8),
      amountPaid: new Prisma.Decimal(0.0),
      outstandingBalance: new Prisma.Decimal(3020.8),
      notes: 'Payment reminder dispatched. Overdue by 15 days.',
      items: {
        create: [
          {
            productId: prod1.id,
            variantId: prod1.variants[0].id,
            description: 'Business Software (Odoo Connector)',
            quantity: 1,
            unitPrice: new Prisma.Decimal(2560.0),
            taxRate: new Prisma.Decimal(18.0),
            taxAmount: new Prisma.Decimal(460.8),
            discountAmount: new Prisma.Decimal(0),
            lineTotal: new Prisma.Decimal(3020.8),
          },
        ],
      },
    },
  });

  // Invoice 4: DRAFT (Elena Rostova at CloudScale)
  const inv4 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-00004',
      subscriptionId: sub4.id,
      customerId: customers[3].id,
      status: InvoiceStatus.DRAFT,
      invoiceDate: new Date(),
      periodStart: new Date(),
      periodEnd: addDays(new Date(), 7),
      dueDate: addDays(new Date(), 15),
      subtotal: new Prisma.Decimal(850.0),
      totalTax: new Prisma.Decimal(153.0),
      totalDiscount: new Prisma.Decimal(0),
      grandTotal: new Prisma.Decimal(1003.0),
      amountPaid: new Prisma.Decimal(0.0),
      outstandingBalance: new Prisma.Decimal(1003.0),
      notes: 'Draft cycle preview',
      items: {
        create: [
          {
            productId: prod1.id,
            description: 'Weekly Sprint Pass',
            quantity: 1,
            unitPrice: new Prisma.Decimal(850.0),
            taxRate: new Prisma.Decimal(18.0),
            taxAmount: new Prisma.Decimal(153.0),
            discountAmount: new Prisma.Decimal(0),
            lineTotal: new Prisma.Decimal(1003.0),
          },
        ],
      },
    },
  });

  console.log('Created invoices (PAID, PARTIAL, OVERDUE, DRAFT) with payments.');

  // 12. Create Billing Records for Idempotent audit
  await prisma.billingRecord.create({
    data: {
      subscriptionId: sub1.id,
      periodStart: inv1Start,
      periodEnd: inv1End,
      status: BillingRecordStatus.SUCCESS,
      invoiceId: inv1.id,
    },
  });

  // 13. Audit Log entries
  await prisma.auditLog.createMany({
    data: [
      { userId: adminUser.id, action: 'SYSTEM_INITIALIZATION', entity: 'System', details: 'Initialized Brightloop Software platform' },
      { userId: staffUser1.id, action: 'CREATE_SUBSCRIPTION', entity: 'Subscription', entityId: sub1.id, details: 'Created SUB-2026-00001' },
      { userId: staffUser1.id, action: 'RECORD_PAYMENT', entity: 'Payment', entityId: pmt1.id, details: 'Reconciled payment PAY-2026-00001' },
    ],
  });

  console.log('\nSeeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Admin Login:   admin@brightloop.com / AdminPass@2026');
  console.log('Staff Login:   sarah.staff@brightloop.com / StaffPass@2026');
  console.log('Customer Login: alex@acmecorp.com / CustPass@2026!');
  console.log('----------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
