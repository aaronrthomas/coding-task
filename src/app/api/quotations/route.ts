import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, QuotationStatus, Prisma } from '@prisma/client';
import { roundMoney } from '@/lib/utils';

const quotationItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).default(1),
  taxRate: z.number().default(0),
  discountAmount: z.number().default(0),
});

const createQuotationSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  validityDays: z.number().int().min(1).default(30),
  notes: z.string().optional().nullable(),
  items: z.array(quotationItemSchema).min(1, 'At least one line item is required'),
});

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status') as QuotationStatus | null;
    const customerId = searchParams.get('customerId') || undefined;

    const where: Prisma.QuotationWhereInput = {
      // If Customer, restrict only to their own quotations!
      customerId: session.role === Role.CUSTOMER ? session.customerId! : customerId,
      status: status || undefined,
    };

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: quotations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth([Role.ADMIN, Role.STAFF]);

    const body = await req.json();
    const parsed = createQuotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { customerId, validityDays, notes, items } = parsed.data;

    // Generate unique sequential quotation number
    const count = await prisma.quotation.count();
    const year = new Date().getFullYear();
    const quotationNumber = `QT-${year}-${String(count + 1).padStart(5, '0')}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Calculate line items on the server
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    interface CalculatedItem {
      productId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      taxAmount: number;
      discountAmount: number;
      total: number;
    }

    const calculatedItems: CalculatedItem[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product) {
        return NextResponse.json({ success: false, error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      let unitPrice = Number(product.salesPrice);
      let variantId: string | null = null;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          unitPrice += Number(variant.priceAdjustment);
          variantId = variant.id;
        }
      }

      const lineSubtotal = unitPrice * item.quantity;
      const lineTax = roundMoney((lineSubtotal * item.taxRate) / 100);
      const lineDiscount = item.discountAmount || 0;
      const lineTotal = roundMoney(lineSubtotal + lineTax - lineDiscount);

      subtotal += lineSubtotal;
      taxTotal += lineTax;
      discountTotal += lineDiscount;

      calculatedItems.push({
        productId: product.id,
        variantId,
        quantity: item.quantity,
        unitPrice,
        taxRate: item.taxRate,
        taxAmount: lineTax,
        discountAmount: lineDiscount,
        total: lineTotal,
      });
    }

    const grandTotal = roundMoney(subtotal + taxTotal - discountTotal);

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        status: QuotationStatus.DRAFT,
        validUntil,
        notes,
        subtotal: new Prisma.Decimal(subtotal),
        taxTotal: new Prisma.Decimal(taxTotal),
        discountTotal: new Prisma.Decimal(discountTotal),
        grandTotal: new Prisma.Decimal(grandTotal),
        items: {
          create: calculatedItems.map((ci) => ({
            productId: ci.productId,
            variantId: ci.variantId,
            quantity: ci.quantity,
            unitPrice: new Prisma.Decimal(ci.unitPrice),
            taxRate: new Prisma.Decimal(ci.taxRate),
            taxAmount: new Prisma.Decimal(ci.taxAmount),
            discountAmount: new Prisma.Decimal(ci.discountAmount),
            total: new Prisma.Decimal(ci.total),
          })),
        },
      },
      include: {
        customer: true,
        items: { include: { product: true, variant: true } },
      },
    });

    return NextResponse.json({ success: true, data: quotation, message: 'Quotation created successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
