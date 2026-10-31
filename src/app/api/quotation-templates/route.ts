import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

const templateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().nullable(),
  defaultPlanId: z.string().optional().nullable(),
  validityDays: z.number().int().min(1).default(30),
  templateLinesJson: z.string().optional().nullable(),
});

export async function GET() {
  try {
    await requireAuth([Role.ADMIN, Role.STAFF]);

    const templates = await prisma.quotationTemplate.findMany({
      include: { defaultPlan: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: templates });
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
    const parsed = templateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const template = await prisma.quotationTemplate.create({
      data: parsed.data,
      include: { defaultPlan: true },
    });

    return NextResponse.json({ success: true, data: template, message: 'Template created successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
