import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';
import { UserSession } from '@/types';
import prisma from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'brightloop-super-secure-production-jwt-key-2026-xyz-subscription-mgmt';
const key = new TextEncoder().encode(JWT_SECRET);

export const COOKIE_NAME = 'brightloop_session';

/**
 * Validate password requirements:
 * Longer than 8 characters, at least 1 uppercase, 1 lowercase, 1 special character.
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length <= 8) {
    return { valid: false, message: 'Password must be longer than 8 characters.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: UserSession): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to retrieve the authenticated session from cookies (Supabase Auth & JWT)
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) return session;
  }

  // Check Supabase Auth session via @supabase/ssr
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.email) {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { supabaseUid: user.id },
              { email: user.email.toLowerCase() },
            ],
          },
          include: { customerProfile: true },
        });

        if (dbUser && dbUser.isActive) {
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            customerId: dbUser.customerProfile?.id || null,
          };
        }
      }
    }
  } catch {
    // Graceful fallback if Supabase Auth is unreachable
  }

  return null;
}

/**
 * Server-side authorization check. Throws or returns user session if allowed.
 */
export async function requireAuth(allowedRoles?: Role[]): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED: Authentication required');
  }

  // Verify that the user still exists and is active in DB
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { customerProfile: true },
  });

  if (!user || !user.isActive) {
    throw new Error('UNAUTHORIZED: Account disabled or not found');
  }

  // Update session customerId if applicable
  const updatedSession: UserSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: user.customerProfile?.id || null,
  };

  if (allowedRoles && !allowedRoles.includes(updatedSession.role)) {
    throw new Error(`FORBIDDEN: Access denied for role ${updatedSession.role}`);
  }

  return updatedSession;
}
