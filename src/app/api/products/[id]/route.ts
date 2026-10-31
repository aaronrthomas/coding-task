import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, ProductType, Prisma } from '@prisma/client';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  priceAdjustment: z.number().default(0),
  isActive: z.boolean().default(true),
});

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.nativeEnum(ProductType).optional(),
  salesPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth([Role.ADMIN, Role.STAFF]);
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        plans: true,
        taxRules: { include: { taxRule: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only Admin can modify products and pricing
    await requireAuth([Role.ADMIN]);
    const { id } = await params;

    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, type, salesPrice, costPrice, description, isActive, variants } = parsed.data;

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name,
          type,
          salesPrice: salesPrice !== undefined ? new Prisma.Decimal(salesPrice) : undefined,
          costPrice: costPrice !== undefined ? new Prisma.Decimal(costPrice) : undefined,
          description,
          isActive,
        },
      });

      // Update / Upsert variants if provided
      if (variants) {
        for (const v of variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                priceAdjustment: new Prisma.Decimal(v.priceAdjustment),
                isActive: v.isActive,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                name: v.name,
                priceAdjustment: new Prisma.Decimal(v.priceAdjustment),
                isActive: v.isActive,
              },
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json({ success: true, data: product, message: 'Product updated successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth([Role.ADMIN]);
    const { id } = await params;

    // Safe deactivation
    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Product deactivated successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
