import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, Prisma } from '@prisma/client';

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  companyName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const session = await requireAuth([Role.ADMIN, Role.STAFF]);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const showArchived = searchParams.get('archived') === 'true';

    const where: Prisma.CustomerWhereInput = {
      isArchived: showArchived ? undefined : false,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              subscriptions: true,
              invoices: true,
              payments: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: customers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
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
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, companyName, phone, billingAddress, taxId } = parsed.data;

    const existing = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A customer with this email already exists.' },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email.toLowerCase(),
        companyName,
        phone,
        billingAddress,
        taxId,
      },
    });

    return NextResponse.json({ success: true, data: customer, message: 'Customer created successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
