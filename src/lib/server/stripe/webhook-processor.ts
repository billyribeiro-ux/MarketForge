import { and, eq, isNull } from 'drizzle-orm';
import type Stripe from 'stripe';
import {
	entitlements,
	prices,
	products,
	purchases,
	subscriptions,
	users,
} from '$lib/server/db/schema';
import type { DbTransaction } from '$lib/server/db/tx';
import { logger } from '$lib/server/logger';
import { entitlementKeysForProductSlug } from '$lib/server/stripe/product-entitlements';
import type { EntitlementKey } from '$lib/types/auth';

import { getStripe } from './client';

type SubStatus =
	| 'active'
	| 'canceled'
	| 'incomplete'
	| 'incomplete_expired'
	| 'past_due'
	| 'trialing'
	| 'unpaid'
	| 'paused';

const SUB_STATUSES = new Set<SubStatus>([
	`active`,
	`canceled`,
	`incomplete`,
	`incomplete_expired`,
	`past_due`,
	`trialing`,
	`unpaid`,
	`paused`,
]);

function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubStatus {
	if (SUB_STATUSES.has(status as SubStatus)) return status as SubStatus;
	return `canceled`;
}

async function resolveUserIdForSubscription(
	tx: DbTransaction,
	stripeSub: Stripe.Subscription,
): Promise<string | null> {
	const metaUid = stripeSub.metadata?.userId;
	if (metaUid) return metaUid;
	const customerId =
		typeof stripeSub.customer === `string`
			? stripeSub.customer
			: stripeSub.customer?.id;
	if (!customerId) return null;
	const [row] = await tx
		.select({ id: users.id })
		.from(users)
		.where(eq(users.stripeCustomerId, customerId));
	return row?.id ?? null;
}

async function revokeEntitlementsByRef(
	tx: DbTransaction,
	userId: string,
	source: `subscription` | `purchase`,
	sourceRef: string,
): Promise<void> {
	await tx
		.update(entitlements)
		.set({ revokedAt: new Date(), updatedAt: new Date() })
		.where(
			and(
				eq(entitlements.userId, userId),
				eq(entitlements.source, source),
				eq(entitlements.sourceRef, sourceRef),
				isNull(entitlements.revokedAt),
			),
		);
}

async function grantEntitlements(
	tx: DbTransaction,
	userId: string,
	keys: readonly EntitlementKey[],
	source: `subscription` | `purchase`,
	sourceRef: string,
	validUntil: Date | null,
): Promise<void> {
	const now = new Date();
	for (const key of keys) {
		await tx.insert(entitlements).values({
			userId,
			key,
			source,
			sourceRef,
			validFrom: now,
			validUntil,
			revokedAt: null,
			metadata: null,
		});
	}
}

async function lookupPriceAndProduct(
	tx: DbTransaction,
	stripePriceId: string,
): Promise<{ priceId: string; productId: string; slug: string } | null> {
	const rows = await tx
		.select({
			priceId: prices.id,
			productId: products.id,
			slug: products.slug,
		})
		.from(prices)
		.innerJoin(products, eq(prices.productId, products.id))
		.where(eq(prices.stripePriceId, stripePriceId))
		.limit(1);
	return rows[0] ?? null;
}

export async function syncSubscriptionFromStripe(
	tx: DbTransaction,
	stripeSub: Stripe.Subscription,
): Promise<void> {
	const userId = await resolveUserIdForSubscription(tx, stripeSub);
	if (!userId) {
		logger.warn(
			{ subId: stripeSub.id },
			`stripe webhook: subscription without resolvable user`,
		);
		return;
	}

	const item = stripeSub.items.data[0];
	const stripePriceId =
		typeof item?.price === `string` ? item.price : item?.price?.id;
	if (!stripePriceId) {
		logger.warn(
			{ subId: stripeSub.id },
			`stripe webhook: subscription missing price`,
		);
		return;
	}

	const mapped = await lookupPriceAndProduct(tx, stripePriceId);
	if (!mapped) {
		logger.warn({ stripePriceId }, `stripe webhook: unknown price id`);
		return;
	}

	const customerId =
		typeof stripeSub.customer === `string`
			? stripeSub.customer
			: stripeSub.customer?.id;
	if (!customerId) return;

	const status = mapSubscriptionStatus(stripeSub.status);
	const item0 = stripeSub.items.data[0];
	const periodEnd = item0?.current_period_end
		? new Date(item0.current_period_end * 1000)
		: null;
	const periodStart = item0?.current_period_start
		? new Date(item0.current_period_start * 1000)
		: null;
	const trialStart = stripeSub.trial_start
		? new Date(stripeSub.trial_start * 1000)
		: null;
	const trialEnd = stripeSub.trial_end
		? new Date(stripeSub.trial_end * 1000)
		: null;

	const existing = await tx
		.select({ id: subscriptions.id })
		.from(subscriptions)
		.where(eq(subscriptions.stripeSubscriptionId, stripeSub.id))
		.limit(1);

	const subRow = {
		userId,
		priceId: mapped.priceId,
		stripeCustomerId: customerId,
		stripeSubscriptionId: stripeSub.id,
		status,
		cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
		currentPeriodStart: periodStart,
		currentPeriodEnd: periodEnd,
		trialStart,
		trialEnd,
		updatedAt: new Date(),
	};

	if (existing[0]) {
		await tx
			.update(subscriptions)
			.set(subRow)
			.where(eq(subscriptions.id, existing[0].id));
	} else {
		await tx.insert(subscriptions).values({
			...subRow,
			createdAt: new Date(),
		});
	}

	await revokeEntitlementsByRef(tx, userId, `subscription`, stripeSub.id);

	const grantable =
		status === `active` ||
		status === `trialing` ||
		status === `past_due` ||
		status === `paused`;
	if (!grantable) {
		return;
	}

	const keys = entitlementKeysForProductSlug(mapped.slug);
	await grantEntitlements(
		tx,
		userId,
		keys,
		`subscription`,
		stripeSub.id,
		periodEnd,
	);
}

async function handleCheckoutSessionCompleted(
	tx: DbTransaction,
	session: Stripe.Checkout.Session,
): Promise<void> {
	const userId =
		session.metadata?.userId ?? session.client_reference_id ?? null;
	if (!userId) {
		logger.warn(
			{ sessionId: session.id },
			`checkout.session.completed without user id`,
		);
		return;
	}

	const customerId =
		typeof session.customer === `string`
			? session.customer
			: (session.customer?.id ?? null);
	if (customerId) {
		await tx
			.update(users)
			.set({ stripeCustomerId: customerId, updatedAt: new Date() })
			.where(eq(users.id, userId));
	}

	if (session.mode === `subscription`) {
		const subId =
			typeof session.subscription === `string`
				? session.subscription
				: session.subscription?.id;
		if (!subId) return;
		const stripe = getStripe();
		const stripeSub = await stripe.subscriptions.retrieve(subId, {
			expand: [`items.data.price`],
		});
		await syncSubscriptionFromStripe(tx, stripeSub);
		return;
	}

	if (session.mode !== `payment` || session.payment_status !== `paid`) return;

	const [existingPurchase] = await tx
		.select({ id: purchases.id })
		.from(purchases)
		.where(eq(purchases.stripeCheckoutSessionId, session.id))
		.limit(1);
	if (existingPurchase) return;

	const stripe = getStripe();
	const full = await stripe.checkout.sessions.retrieve(session.id, {
		expand: [`line_items.data.price.product`],
	});
	const li = full.line_items?.data?.[0];
	const priceObj = li?.price;
	const stripePriceId = typeof priceObj === `string` ? priceObj : priceObj?.id;
	if (!stripePriceId) {
		logger.warn(
			{ sessionId: session.id },
			`checkout session missing line item price`,
		);
		return;
	}

	const mapped = await lookupPriceAndProduct(tx, stripePriceId);
	if (!mapped) return;

	const pi = session.payment_intent;
	const piId = typeof pi === `string` ? pi : (pi?.id ?? null);

	await tx.insert(purchases).values({
		userId,
		productId: mapped.productId,
		stripeCheckoutSessionId: session.id,
		stripePaymentIntentId: piId,
		amount: session.amount_total ?? 0,
		currency: session.currency ?? `usd`,
		status: `paid`,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const keys = entitlementKeysForProductSlug(mapped.slug);
	await grantEntitlements(tx, userId, keys, `purchase`, session.id, null);
}

async function handleSubscriptionDeleted(
	tx: DbTransaction,
	stripeSub: Stripe.Subscription,
): Promise<void> {
	const userId = await resolveUserIdForSubscription(tx, stripeSub);
	await tx
		.update(subscriptions)
		.set({ status: `canceled`, updatedAt: new Date() })
		.where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));
	if (userId) {
		await revokeEntitlementsByRef(tx, userId, `subscription`, stripeSub.id);
	}
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
	const nested = invoice.parent?.subscription_details?.subscription;
	if (typeof nested === `string`) return nested;
	if (nested && typeof nested === `object` && `id` in nested) return nested.id;

	const legacy = invoice as Stripe.Invoice & {
		subscription?: string | Stripe.Subscription | null;
	};
	const top = legacy.subscription;
	if (typeof top === `string`) return top;
	if (top && typeof top === `object` && `id` in top) return top.id;
	return null;
}

async function handleInvoiceSubscriptionEvent(
	tx: DbTransaction,
	invoice: Stripe.Invoice,
	handler: (tx: DbTransaction, sub: Stripe.Subscription) => Promise<void>,
): Promise<void> {
	const subId = subscriptionIdFromInvoice(invoice);
	if (!subId) return;
	const stripe = getStripe();
	const stripeSub = await stripe.subscriptions.retrieve(subId, {
		expand: [`items.data.price`],
	});
	await handler(tx, stripeSub);
}

async function handleChargeRefunded(
	tx: DbTransaction,
	charge: Stripe.Charge,
): Promise<void> {
	const pi = charge.payment_intent;
	const piId = typeof pi === `string` ? pi : pi?.id;
	if (!piId) return;

	const rows = await tx
		.select()
		.from(purchases)
		.where(eq(purchases.stripePaymentIntentId, piId));
	for (const row of rows) {
		await tx
			.update(purchases)
			.set({ status: `refunded`, updatedAt: new Date() })
			.where(eq(purchases.id, row.id));
		if (row.stripeCheckoutSessionId) {
			await revokeEntitlementsByRef(
				tx,
				row.userId,
				`purchase`,
				row.stripeCheckoutSessionId,
			);
		}
	}
}

export async function dispatchStripeEvent(
	tx: DbTransaction,
	event: Stripe.Event,
): Promise<void> {
	switch (event.type) {
		case `checkout.session.completed`:
			await handleCheckoutSessionCompleted(
				tx,
				event.data.object as Stripe.Checkout.Session,
			);
			break;
		case `customer.subscription.created`:
		case `customer.subscription.updated`:
			await syncSubscriptionFromStripe(
				tx,
				event.data.object as Stripe.Subscription,
			);
			break;
		case `customer.subscription.deleted`:
			await handleSubscriptionDeleted(
				tx,
				event.data.object as Stripe.Subscription,
			);
			break;
		case `customer.subscription.trial_will_end`:
			break;
		case `invoice.paid`:
			await handleInvoiceSubscriptionEvent(
				tx,
				event.data.object as Stripe.Invoice,
				syncSubscriptionFromStripe,
			);
			break;
		case `invoice.payment_failed`:
			await handleInvoiceSubscriptionEvent(
				tx,
				event.data.object as Stripe.Invoice,
				async (t, sub) => {
					await t
						.update(subscriptions)
						.set({ status: `past_due`, updatedAt: new Date() })
						.where(eq(subscriptions.stripeSubscriptionId, sub.id));
				},
			);
			break;
		case `invoice.payment_action_required`:
			await handleInvoiceSubscriptionEvent(
				tx,
				event.data.object as Stripe.Invoice,
				async (t, sub) => {
					await t
						.update(subscriptions)
						.set({ status: `past_due`, updatedAt: new Date() })
						.where(eq(subscriptions.stripeSubscriptionId, sub.id));
				},
			);
			break;
		case `charge.refunded`:
			await handleChargeRefunded(tx, event.data.object as Stripe.Charge);
			break;
		case `charge.dispute.created`: {
			const dispute = event.data.object as Stripe.Dispute;
			const chId =
				typeof dispute.charge === `string`
					? dispute.charge
					: (dispute.charge?.id ?? null);
			if (chId) {
				const stripe = getStripe();
				const charge = await stripe.charges.retrieve(chId);
				await handleChargeRefunded(tx, charge);
			}
			break;
		}
		default:
			logger.debug({ type: event.type }, `stripe webhook: ignored event type`);
	}
}
