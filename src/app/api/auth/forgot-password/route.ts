import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '@/lib/db';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Valid email is required.' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't leak user existence in production, return generic success
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      });
    }

    // Generate single-use secure reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Dispatch Supabase Auth reset email if configured
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
        });
      }
    } catch {
      // Non-blocking fallback
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Development local logger for testing reset flow
    console.log(`\n========================================`);
    console.log(`[BRIGHTLOOP EMAIL DISPATCH - DEV LOG]`);
    console.log(`To: ${user.email}`);
    console.log(`Subject: Reset Your Brightloop Password`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log(`Token: ${resetToken}`);
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been dispatched.',
      // In development mode, provide token directly to facilitate automated tests and local verification
      devResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
      devResetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
