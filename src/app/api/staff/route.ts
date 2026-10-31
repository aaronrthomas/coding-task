import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth, hashPassword, validatePassword } from '@/lib/auth';
import { Role } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const createStaffSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string(),
  role: z.enum([Role.STAFF, Role.ADMIN]).default(Role.STAFF),
});

export async function GET() {
  try {
    const session = await requireAuth([Role.ADMIN]);

    const users = await prisma.user.findMany({
      where: {
        role: { in: [Role.ADMIN, Role.STAFF] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth([Role.ADMIN]);

    const body = await req.json();
    const parsed = createStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    const validation = validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: session.id,
      action: 'CREATE_STAFF_USER',
      entity: 'User',
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role },
    });

    return NextResponse.json({
      success: true,
      data: newUser,
      message: `${role} account created successfully.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
