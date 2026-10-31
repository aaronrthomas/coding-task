import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, ProductType, Prisma } from '@prisma/client';

const createTaxSchema = z.object({
  name: z.string().min(2, 'Tax name is required'),
  rate: z.number().min(0, 'Tax rate must be positive'),
  description: z.string().optional().nullable(),
  applicableProductType: z.nativeEnum(ProductType).optional().nullable(),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    await requireAuth([Role.ADMIN, Role.STAFF]);

    const taxes = await prisma.taxRule.findMany({
      include: {
        applicableProducts: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: taxes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth([Role.ADMIN]);

    const body = await req.json();
    const parsed = createTaxSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, rate, description, applicableProductType, isActive, productIds } = parsed.data;

    const tax = await prisma.$transaction(async (tx) => {
      const created = await tx.taxRule.create({
        data: {
          name,
          rate: new Prisma.Decimal(rate),
          description,
          applicableProductType,
          isActive,
        },
      });

      if (productIds && productIds.length > 0) {
        await tx.taxRuleProduct.createMany({
          data: productIds.map((pid) => ({
            taxRuleId: created.id,
            productId: pid,
          })),
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, data: tax, message: 'Tax rule created successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
