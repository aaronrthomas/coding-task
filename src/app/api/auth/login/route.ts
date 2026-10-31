import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { comparePassword, signSessionToken, COOKIE_NAME } from '@/lib/auth';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { customerProfile: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Sync Supabase Auth session if Supabase is configured
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (sbError && sbError.message.includes('Invalid login credentials')) {
          const { createAdminClient } = await import('@/lib/supabase/admin');
          const adminClient = createAdminClient();
          const { data: createdSbUser } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: user.name, role: user.role },
          });
          if (createdSbUser?.user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { supabaseUid: createdSbUser.user.id },
            });
            await supabase.auth.signInWithPassword({ email, password });
          }
        } else if (sbData?.user && !user.supabaseUid) {
          await prisma.user.update({
            where: { id: user.id },
            data: { supabaseUid: sbData.user.id },
          });
        }
      }
    } catch {
      // Non-blocking fallback to local session
    }

    // Generate session token
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customerProfile?.id || null,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const redirectTo = user.role === 'CUSTOMER' ? '/portal' : '/dashboard';

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerProfile?.id || null,
        redirectTo,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
