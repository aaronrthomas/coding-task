import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashPassword, validatePassword, signSessionToken, COOKIE_NAME } from '@/lib/auth';
import { Role } from '@prisma/client';
import { cookies } from 'next/headers';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string(),
  companyName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, companyName } = parsed.data;

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Sync with Supabase Auth if configured
    let supabaseUid: string | null = null;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: sbAuth } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
          options: {
            data: { name, role: 'CUSTOMER', companyName },
          },
        });
        if (sbAuth?.user) {
          supabaseUid = sbAuth.user.id;
        }
      }
    } catch {
      // Non-blocking fallback
    }

    // Create user and linked customer profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          role: Role.CUSTOMER,
          supabaseUid: supabaseUid || null,
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          name,
          email: email.toLowerCase(),
          companyName: companyName || null,
        },
      });

      return { user, customer };
    });

    // Sign session token
    const token = await signSessionToken({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      customerId: result.customer.id,
    });

    // Set HTTP-only secure session cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        customerId: result.customer.id,
      },
      message: 'Account registered successfully',
    });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
