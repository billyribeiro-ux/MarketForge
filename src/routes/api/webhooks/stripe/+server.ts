import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { db } from '$lib/server/db';
import { webhookEvents } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';
import { requestOutboxDrain } from '$lib/server/outbox-dispatcher';
import { getStripe } from '$lib/server/stripe/client';
import { enqueueStripeWebhookNotifications } from '$lib/server/stripe/webhook-notifications';
import { dispatchStripeEvent } from '$lib/server/stripe/webhook-processor';
import type { RequestHandler } from './$types';

/**
 * Stripe retries a webhook if it doesn't receive a 2xx within its own timeout
 * (~30s today, see https://stripe.com/docs/webhooks#retries). We raise the
 * function ceiling above the adapter default so a slow Postgres write doesn't
 * force Stripe to redeliver — our idempotency guard below handles retries, but
 * avoiding them keeps the dashboard clean and the dispatcher honest.
 *
 * @type {import('@sveltejs/adapter-vercel').Config}
 */
export const config = {
	runtime: `nodejs22.x`,
	maxDuration: 30,
};

export const POST: RequestHandler = async ({ request }) => {
	const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
	if (!secret) {
		logger.error(`STRIPE_WEBHOOK_SECRET is not set`);
		error(500, `Webhook not configured`);
	}

	const sig = request.headers.get(`stripe-signature`);
	if (!sig) {
		error(400, `Missing stripe-signature`);
	}

	const rawBody = await request.text();
	let event: Stripe.Event;
	try {
		const stripe = getStripe();
		event = stripe.webhooks.constructEvent(rawBody, sig, secret);
	} catch (err) {
		const e = err instanceof Error ? err : new Error(String(err));
		logger.warn({ err: e }, `stripe webhook signature verification failed`);
		error(400, `Invalid signature`);
	}

	let committed = false;

	try {
		await db.transaction(async (tx) => {
			// Single round-trip idempotency guard: insert the event row; if it already
			// exists, upsert is a no-op and the returned row reflects the stored state.
			// Only proceed when `processedAt IS NULL` — prevents concurrent handlers
			// from double-dispatching if Stripe retries mid-processing.
			const now = new Date();
			const [row] = await tx
				.insert(webhookEvents)
				.values({
					stripeEventId: event.id,
					type: event.type,
					payload: event as unknown as Record<string, unknown>,
					receivedAt: now,
				})
				.onConflictDoUpdate({
					target: webhookEvents.stripeEventId,
					set: { stripeEventId: event.id },
				})
				.returning({ processedAt: webhookEvents.processedAt });

			if (row?.processedAt) return;

			await dispatchStripeEvent(tx, event);
			// Durable outbox: notification rows are written inside this same
			// transaction. If we roll back below, emails don't go out — and if
			// we commit, they become visible to the dispatcher atomically.
			await enqueueStripeWebhookNotifications(tx, event);
			await tx
				.update(webhookEvents)
				.set({ processedAt: new Date() })
				.where(eq(webhookEvents.stripeEventId, event.id));
			committed = true;
		});
	} catch (err) {
		const e = err instanceof Error ? err : new Error(String(err));
		logger.error(
			{ err: e, eventId: event.id, eventType: event.type },
			`stripe webhook handler failed`,
		);
		error(500, `Webhook handler error`);
	}

	if (committed) {
		// Nudge the dispatcher so delivery starts immediately in long-running
		// node envs; serverless targets rely on /api/cron/outbox instead.
		requestOutboxDrain();
	}

	return new Response(null, { status: 200 });
};
