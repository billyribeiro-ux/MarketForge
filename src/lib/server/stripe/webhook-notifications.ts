import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { formatMoney } from '$lib/money';
import { trackPlausibleServer } from '$lib/server/analytics/plausible-server';
import { db } from '$lib/server/db';
import { prices, products, users } from '$lib/server/db/schema';
import type { DbOrTx } from '$lib/server/db/tx';
import PaymentFailedEmail from '$lib/server/email/templates/PaymentFailedEmail.svelte';
import PurchaseReceiptEmail from '$lib/server/email/templates/PurchaseReceiptEmail.svelte';
import RenewalReceiptEmail from '$lib/server/email/templates/RenewalReceiptEmail.svelte';
import SubscriptionCancelledEmail from '$lib/server/email/templates/SubscriptionCancelledEmail.svelte';
import SubscriptionStartedEmail from '$lib/server/email/templates/SubscriptionStartedEmail.svelte';
import TrialEndingEmail from '$lib/server/email/templates/TrialEndingEmail.svelte';
import { logger } from '$lib/server/logger';
import { enqueueRenderedEmail } from '$lib/server/outbox';

import { getStripe } from './client';

async function resolveUserIdForStripeSubscription(
	executor: DbOrTx,
	stripeSub: Stripe.Subscription,
): Promise<string | null> {
	const metaUid = stripeSub.metadata?.userId;
	if (metaUid) return metaUid;
	const customerId =
		typeof stripeSub.customer === `string`
			? stripeSub.customer
			: stripeSub.customer?.id;
	if (!customerId) return null;
	const [row] = await executor
		.select({ id: users.id })
		.from(users)
		.where(eq(users.stripeCustomerId, customerId))
		.limit(1);
	return row?.id ?? null;
}

async function lookupUserContact(
	executor: DbOrTx,
	userId: string,
): Promise<{ email: string; name: string } | null> {
	const [row] = await executor
		.select({ email: users.email, name: users.name })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return row ?? null;
}

async function lookupProductByStripePriceId(
	executor: DbOrTx,
	stripePriceId: string,
): Promise<{ name: string; slug: string } | null> {
	const rows = await executor
		.select({ name: products.name, slug: products.slug })
		.from(prices)
		.innerJoin(products, eq(prices.productId, products.id))
		.where(eq(prices.stripePriceId, stripePriceId))
		.limit(1);
	return rows[0] ?? null;
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

/**
 * Enqueue all notifications for a Stripe event inside the given executor
 * (the webhook's transaction). Rows become visible to the dispatcher only
 * after the webhook commits, so a transaction rollback cleanly discards
 * all would-be emails.
 */
export async function enqueueStripeWebhookNotifications(
	executor: DbOrTx,
	event: Stripe.Event,
): Promise<void> {
	try {
		switch (event.type) {
			case `checkout.session.completed`:
				await onCheckoutSessionCompleted(
					executor,
					event.data.object as Stripe.Checkout.Session,
				);
				break;
			case `invoice.paid`:
				await onInvoicePaid(executor, event.data.object as Stripe.Invoice);
				break;
			case `invoice.payment_failed`:
				await onInvoicePaymentFailed(
					executor,
					event.data.object as Stripe.Invoice,
				);
				break;
			case `customer.subscription.trial_will_end`:
				await onTrialWillEnd(
					executor,
					event.data.object as Stripe.Subscription,
				);
				break;
			case `customer.subscription.deleted`:
				await onSubscriptionDeleted(
					executor,
					event.data.object as Stripe.Subscription,
				);
				break;
			default:
				break;
		}
	} catch (err) {
		const e = err instanceof Error ? err : new Error(String(err));
		// Enqueue failures should roll back the webhook transaction so Stripe
		// retries — losing the email is worse than a duplicate webhook.
		logger.error(
			{ err: e, type: event.type, id: event.id },
			`enqueue stripe webhook notifications failed`,
		);
		throw e;
	}
}

/** Back-compat name kept so callers don't need to change shape. */
export const queueStripeWebhookNotifications =
	enqueueStripeWebhookNotifications;

async function onCheckoutSessionCompleted(
	executor: DbOrTx,
	session: Stripe.Checkout.Session,
): Promise<void> {
	const userId =
		session.metadata?.userId ?? session.client_reference_id ?? null;
	if (!userId) return;

	const contact = await lookupUserContact(executor, userId);
	if (!contact) return;

	const currency = session.currency ?? `usd`;
	const amount = session.amount_total ?? 0;
	const amountLabel = formatMoney(amount, currency);

	const stripe = getStripe();

	if (session.mode === `subscription`) {
		const full = await stripe.checkout.sessions.retrieve(session.id, {
			expand: [`line_items.data.price`],
		});
		const line = full.line_items?.data?.[0];
		const priceId =
			typeof line?.price === `string` ? line.price : (line?.price?.id ?? null);
		const productMeta = priceId
			? await lookupProductByStripePriceId(executor, priceId)
			: null;
		const planName = productMeta?.name ?? `MarketForge Pro`;
		await enqueueRenderedEmail(
			executor,
			SubscriptionStartedEmail,
			{ name: contact.name, planName, amountLabel },
			{
				to: contact.email,
				subject: `Subscription confirmed — ${planName}`,
			},
		);
		return;
	}

	if (session.mode === `payment` && session.payment_status === `paid`) {
		const full = await stripe.checkout.sessions.retrieve(session.id, {
			expand: [`line_items.data.price`],
		});
		const li = full.line_items?.data?.[0];
		const priceObj = li?.price;
		const stripePriceId =
			typeof priceObj === `string` ? priceObj : (priceObj?.id ?? null);
		const productMeta = stripePriceId
			? await lookupProductByStripePriceId(executor, stripePriceId)
			: null;
		const title = productMeta?.name ?? `Purchase`;
		await enqueueRenderedEmail(
			executor,
			PurchaseReceiptEmail,
			{ name: contact.name, title, amountLabel },
			{
				to: contact.email,
				subject: `Receipt — ${title}`,
			},
		);
		if (productMeta?.slug === `pro-lifetime`) {
			// Analytics are fire-and-forget and not retried.
			void trackPlausibleServer(`lifetime_purchased`, {
				product: productMeta.slug,
			});
		}
	}
}

async function onInvoicePaid(
	executor: DbOrTx,
	invoice: Stripe.Invoice,
): Promise<void> {
	if (invoice.billing_reason !== `subscription_cycle`) return;

	const subId = subscriptionIdFromInvoice(invoice);
	if (!subId) return;

	const stripe = getStripe();
	const stripeSub = await stripe.subscriptions.retrieve(subId, {
		expand: [`items.data.price`],
	});
	const userId = await resolveUserIdForStripeSubscription(executor, stripeSub);
	if (!userId) return;

	const contact = await lookupUserContact(executor, userId);
	if (!contact) return;

	const item = stripeSub.items.data[0];
	const priceId =
		typeof item?.price === `string` ? item.price : (item?.price?.id ?? null);
	const productMeta = priceId
		? await lookupProductByStripePriceId(executor, priceId)
		: null;
	const planName = productMeta?.name ?? `MarketForge Pro`;
	const amount = invoice.amount_paid ?? 0;
	const currency = invoice.currency ?? `usd`;
	const amountLabel = formatMoney(amount, currency);

	await enqueueRenderedEmail(
		executor,
		RenewalReceiptEmail,
		{ name: contact.name, planName, amountLabel },
		{
			to: contact.email,
			subject: `Renewal receipt — ${planName}`,
		},
	);
}

async function onInvoicePaymentFailed(
	executor: DbOrTx,
	invoice: Stripe.Invoice,
): Promise<void> {
	const subId = subscriptionIdFromInvoice(invoice);
	if (!subId) return;

	const stripe = getStripe();
	const stripeSub = await stripe.subscriptions.retrieve(subId);
	const userId = await resolveUserIdForStripeSubscription(executor, stripeSub);
	if (!userId) return;

	const contact = await lookupUserContact(executor, userId);
	if (!contact) return;

	await enqueueRenderedEmail(
		executor,
		PaymentFailedEmail,
		{ name: contact.name },
		{
			to: contact.email,
			subject: `Action needed — payment failed`,
		},
	);
}

async function onTrialWillEnd(
	executor: DbOrTx,
	stripeSub: Stripe.Subscription,
): Promise<void> {
	const userId = await resolveUserIdForStripeSubscription(executor, stripeSub);
	if (!userId) return;

	const contact = await lookupUserContact(executor, userId);
	if (!contact) return;

	const end = stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null;
	const trialEndLabel = end ? end.toUTCString() : `soon`;

	await enqueueRenderedEmail(
		executor,
		TrialEndingEmail,
		{ name: contact.name, trialEndLabel },
		{
			to: contact.email,
			subject: `Your MarketForge trial ends soon`,
		},
	);
}

async function onSubscriptionDeleted(
	executor: DbOrTx,
	stripeSub: Stripe.Subscription,
): Promise<void> {
	const userId = await resolveUserIdForStripeSubscription(executor, stripeSub);
	if (!userId) return;

	const contact = await lookupUserContact(executor, userId);
	if (!contact) return;

	await enqueueRenderedEmail(
		executor,
		SubscriptionCancelledEmail,
		{ name: contact.name },
		{
			to: contact.email,
			subject: `Subscription cancelled`,
		},
	);
	void trackPlausibleServer(`subscription_cancelled`);
}

// Compatibility shim: satisfied callers that don't use `db`.
void db;
