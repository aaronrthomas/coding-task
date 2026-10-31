import { NextResponse } from 'next/server';
import { runRecurringBillingEngine } from '@/lib/billing';
import { getSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    // Check if triggered via Cron secret or via User session
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.BILLING_CRON_SECRET || 'brightloop-billing-engine-secret-key-999';

    let triggeredBy = 'CRON_SCHEDULER';
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7) === cronSecret) {
      triggeredBy = 'CRON_SECRET';
    } else {
      // Must be authenticated Admin or Staff
      const session = await getSession();
      if (!session || (session.role !== Role.ADMIN && session.role !== Role.STAFF)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin or Staff privileges or valid Cron Bearer token required.' },
          { status: 401 }
        );
      }
      triggeredBy = `${session.name} (${session.role})`;
      userId = session.id;
    }

    // Optional target subscription ID in request body
    let targetSubscriptionId: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body && body.subscriptionId) {
        targetSubscriptionId = body.subscriptionId;
      }
    } catch {
      // Empty body is acceptable for running all due subscriptions
    }

    const result = await runRecurringBillingEngine(targetSubscriptionId);

    await logAudit({
      userId,
      action: 'RUN_RECURRING_BILLING_ENGINE',
      entity: 'BillingEngine',
      details: {
        triggeredBy,
        targetSubscriptionId,
        invoicesCreated: result.invoicesCreated,
        skippedCount: result.skippedCount,
        errorsCount: result.errorsCount,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Recurring billing run finished: ${result.invoicesCreated} invoices created, ${result.skippedCount} skipped.`,
    });
  } catch (err: unknown) {
    console.error('Recurring billing run error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
