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
 * Server-side helper to retrieve the authenticated session from cookies
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
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
