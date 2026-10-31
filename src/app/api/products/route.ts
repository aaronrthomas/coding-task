import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, ProductType, Prisma } from '@prisma/client';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  priceAdjustment: z.number().default(0),
  isActive: z.boolean().default(true),
});

const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  type: z.nativeEnum(ProductType).default(ProductType.SOFTWARE),
  salesPrice: z.number().min(0, 'Sales price must be positive'),
  costPrice: z.number().min(0, 'Cost price must be positive').default(0),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  variants: z.array(variantSchema).optional(),
});

export async function GET(req: Request) {
  try {
    // Both Admin and Staff can view products
    await requireAuth([Role.ADMIN, Role.STAFF]);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') as ProductType | null;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: Prisma.ProductWhereInput = {
      isActive: activeOnly ? true : undefined,
      type: type || undefined,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        plans: true,
        taxRules: {
          include: { taxRule: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: Request) {
  try {
    // Only Admin can create products and configure prices
    await requireAuth([Role.ADMIN]);

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, type, salesPrice, costPrice, description, isActive, variants } = parsed.data;

    const product = await prisma.product.create({
      data: {
        name,
        type,
        salesPrice: new Prisma.Decimal(salesPrice),
        costPrice: new Prisma.Decimal(costPrice),
        description,
        isActive,
        variants: variants && variants.length > 0
          ? {
              create: variants.map((v) => ({
                name: v.name,
                priceAdjustment: new Prisma.Decimal(v.priceAdjustment),
                isActive: v.isActive,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });

    return NextResponse.json({ success: true, data: product, message: 'Product created successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
