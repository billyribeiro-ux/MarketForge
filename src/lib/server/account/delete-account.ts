import { eq } from 'drizzle-orm';
import { auditLog, subscriptions } from '$lib/server/db/schema';
import type { DbOrTx } from '$lib/server/db/tx';
import { logger } from '$lib/server/logger';
import { getStripe, isStripeConfigured } from '$lib/server/stripe/client';

/**
 * Pre-deletion cleanup. Runs synchronously before Better Auth drops the user
 * row so:
 *   1. Stripe subscriptions are cancelled at the source of truth.
 *   2. The Stripe customer is deleted (refunds aren't reversed, but future
 *      charges are impossible).
 *   3. An audit log entry captures a snapshot of the account state — the
 *      user row is about to disappear, so this is our only chance to keep
 *      a compliance trail.
 *
 * Failures in Stripe are logged but do not block the deletion — we prefer
 * GDPR compliance over perfect Stripe hygiene and can reconcile orphaned
 * Stripe customers manually if needed.
 */
export async function prepareAccountDeletion(
	executor: DbOrTx,
	params: {
		userId: string;
		email: string;
		name: string;
		stripeCustomerId: string | null;
		actorUserId: string;
	},
): Promise<void> {
	const [subRows] = await Promise.all([
		executor
			.select({
				id: subscriptions.id,
				stripeSubscriptionId: subscriptions.stripeSubscriptionId,
				status: subscriptions.status,
			})
			.from(subscriptions)
			.where(eq(subscriptions.userId, params.userId)),
	]);

	// Audit BEFORE we delete — the user row (and FK-cascaded audit entries)
	// survive deletion because auditLog.actorUserId is `SET NULL` on cascade.
	await executor.insert(auditLog).values({
		actorUserId: params.actorUserId,
		action: `account.delete`,
		entityType: `user`,
		entityId: params.userId,
		metadata: {
			email: params.email,
			name: params.name,
			stripeCustomerId: params.stripeCustomerId,
			subscriptionSnapshot: subRows.map((s) => ({
				stripeSubscriptionId: s.stripeSubscriptionId,
				statusAtDeletion: s.status,
			})),
		},
	});

	// Stripe cleanup runs outside the transaction — external calls must never
	// hold DB locks. If Stripe is down, the local deletion still succeeds.
	if (isStripeConfigured() && params.stripeCustomerId) {
		await cancelStripeCustomer(params.stripeCustomerId, subRows).catch(
			(err) => {
				const e = err instanceof Error ? err : new Error(String(err));
				logger.error(
					{
						err: e,
						userId: params.userId,
						stripeCustomerId: params.stripeCustomerId,
					},
					`stripe cleanup failed during account deletion`,
				);
			},
		);
	}
}

async function cancelStripeCustomer(
	stripeCustomerId: string,
	subs: Array<{ stripeSubscriptionId: string; status: string }>,
): Promise<void> {
	const stripe = getStripe();

	// Cancel non-terminal subs explicitly so the user stops being billed —
	// deleting the customer cancels them automatically, but doing it first
	// surfaces errors we'd otherwise swallow.
	for (const sub of subs) {
		if (sub.status === `canceled` || sub.status === `incomplete_expired`)
			continue;
		try {
			await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			logger.warn(
				{ err: e, stripeSubscriptionId: sub.stripeSubscriptionId },
				`stripe subscription cancel failed during account deletion`,
			);
		}
	}

	await stripe.customers.del(stripeCustomerId);
}
