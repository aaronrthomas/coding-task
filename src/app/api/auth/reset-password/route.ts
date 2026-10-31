import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth';

const schema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { token, newPassword } = parsed.data;

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired password reset token.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    // Consume the token (single use) and update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Sync updated password with Supabase Auth
    try {
      if (user.supabaseUid) {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminClient = createAdminClient();
        await adminClient.auth.admin.updateUserById(user.supabaseUid, { password: newPassword });
      }
    } catch {
      // Non-blocking fallback
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
