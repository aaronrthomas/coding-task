import prisma from '@/lib/db';

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string | null;
}) {
  try {
    const detailsStr = details
      ? typeof details === 'string'
        ? details
        : JSON.stringify(details)
      : null;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: detailsStr,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
