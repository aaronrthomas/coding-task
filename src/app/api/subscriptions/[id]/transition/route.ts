import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Role, SubscriptionStatus } from '@prisma/client';
import { calculateNextBillingDate } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

const transitionSchema = z.object({
  action: z.enum(['CONFIRM', 'ACTIVATE', 'PAUSE', 'RESUME', 'CLOSE', 'RENEW']),
  reason: z.string().optional().nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.ADMIN, Role.STAFF]);
    const { id } = await params;

    const body = await req.json();
    const parsed = transitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { action, reason } = parsed.data;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
    }

    const currentStatus = subscription.status;
    let targetStatus: SubscriptionStatus;
    const plan = subscription.plan;
    let nextBillingDate = subscription.nextBillingDate;
    let expiryDate = subscription.expiryDate;

    switch (action) {
      case 'CONFIRM':
        if (currentStatus !== SubscriptionStatus.DRAFT && currentStatus !== SubscriptionStatus.QUOTATION) {
          return NextResponse.json(
            { success: false, error: `Cannot confirm a subscription currently in ${currentStatus} status.` },
            { status: 400 }
          );
        }
        targetStatus = SubscriptionStatus.CONFIRMED;
        break;

      case 'ACTIVATE':
        if (currentStatus !== SubscriptionStatus.CONFIRMED && currentStatus !== SubscriptionStatus.DRAFT) {
          return NextResponse.json(
            { success: false, error: `Cannot activate a subscription that is currently ${currentStatus}.` },
            { status: 400 }
          );
        }
        targetStatus = SubscriptionStatus.ACTIVE;
        break;

      case 'PAUSE':
        if (currentStatus !== SubscriptionStatus.ACTIVE) {
          return NextResponse.json(
            { success: false, error: 'Only ACTIVE subscriptions can be paused.' },
            { status: 400 }
          );
        }
        if (!plan.canPause) {
          return NextResponse.json(
            { success: false, error: 'The selected plan does not permit pausing.' },
            { status: 400 }
          );
        }
        targetStatus = SubscriptionStatus.PAUSED;
        break;

      case 'RESUME':
        if (currentStatus !== SubscriptionStatus.PAUSED) {
          return NextResponse.json(
            { success: false, error: 'Only PAUSED subscriptions can be resumed.' },
            { status: 400 }
          );
        }
        targetStatus = SubscriptionStatus.ACTIVE;
        break;

      case 'CLOSE':
        if (currentStatus === SubscriptionStatus.CLOSED) {
          return NextResponse.json(
            { success: false, error: 'Subscription is already closed.' },
            { status: 400 }
          );
        }
        if (!plan.canEarlyClose && currentStatus === SubscriptionStatus.ACTIVE) {
          return NextResponse.json(
            { success: false, error: 'The selected plan does not permit early closure.' },
            { status: 400 }
          );
        }
        targetStatus = SubscriptionStatus.CLOSED;
        break;

      case 'RENEW':
        if (currentStatus !== SubscriptionStatus.CLOSED && currentStatus !== SubscriptionStatus.ACTIVE) {
          return NextResponse.json(
            { success: false, error: 'Only ACTIVE or CLOSED subscriptions can be renewed.' },
            { status: 400 }
          );
        }
        if (!plan.canRenew) {
          return NextResponse.json(
            { success: false, error: 'The selected plan does not permit renewal.' },
            { status: 400 }
          );
        }
        targetStatus = SubscriptionStatus.ACTIVE;
        // Extend expiry date and next billing date
        const baseDate = new Date();
        nextBillingDate = calculateNextBillingDate(baseDate, subscription.billingFrequency);
        if (expiryDate) {
          expiryDate = calculateNextBillingDate(expiryDate, subscription.billingFrequency);
        }
        break;

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Execute state transition inside transaction with status history recording
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id },
        data: {
          status: targetStatus,
          nextBillingDate,
          expiryDate,
        },
        include: { plan: true, customer: true },
      });

      await tx.subscriptionStatusHistory.create({
        data: {
          subscriptionId: id,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          reason: reason || `Manual action: ${action}`,
          changedByUserId: session.id,
        },
      });

      return sub;
    });

    await logAudit({
      userId: session.id,
      action: `SUBSCRIPTION_${action}`,
      entity: 'Subscription',
      entityId: id,
      details: { fromStatus: currentStatus, toStatus: targetStatus, reason },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Subscription transitioned to ${targetStatus}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('UNAUTHORIZED') ? 401 : msg.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
