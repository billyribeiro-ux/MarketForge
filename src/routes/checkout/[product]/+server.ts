import { error, redirect } from '@sveltejs/kit';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { prices, products, users } from '$lib/server/db/schema';
import { getStripe, isStripeConfigured } from '$lib/server/stripe/client';
import { getPublicAppUrl } from '$lib/server/stripe/public-url';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!isStripeConfigured()) {
		error(503, `Billing is not configured`);
	}

	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user) {
		redirect(303, `/login?redirect=${encodeURIComponent(event.url.pathname)}`);
	}

	const slug = event.params.product;
	const [productRow] = await db
		.select()
		.from(products)
		.where(eq(products.slug, slug))
		.limit(1);
	if (!productRow?.active) {
		error(404, `Product not found`);
	}

	const priceWhere =
		productRow.kind === `one_time`
			? and(
					eq(prices.productId, productRow.id),
					eq(prices.active, true),
					isNull(prices.recurringInterval),
				)
			: and(
					eq(prices.productId, productRow.id),
					eq(prices.active, true),
					isNotNull(prices.recurringInterval),
				);

	const [priceRow] = await db.select().from(prices).where(priceWhere).limit(1);
	if (!priceRow?.stripePriceId) {
		error(503, `Price not available — run seed with Stripe configured`);
	}

	const userId = session.user.id;
	const [userRow] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	if (!userRow) {
		error(401, `User not found`);
	}

	const stripe = getStripe();
	let customerId = userRow.stripeCustomerId ?? undefined;
	if (!customerId) {
		// Deterministic idempotency key: two concurrent /checkout hits for the
		// same user collapse into a single Stripe customer instead of creating
		// orphans that we'd have to reconcile later.
		const customer = await stripe.customers.create(
			{
				email: userRow.email,
				metadata: { userId },
			},
			{ idempotencyKey: `customer.create.v1.${userId}` },
		);
		customerId = customer.id;
		await db
			.update(users)
			.set({ stripeCustomerId: customerId, updatedAt: new Date() })
			.where(eq(users.id, userId));
	}

	const base = getPublicAppUrl();
	const successUrl = `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
	const cancelUrl = `${base}/app`;

	const checkout = await stripe.checkout.sessions.create({
		mode: productRow.kind === `one_time` ? `payment` : `subscription`,
		customer: customerId,
		line_items: [{ price: priceRow.stripePriceId, quantity: 1 }],
		success_url: successUrl,
		cancel_url: cancelUrl,
		client_reference_id: userId,
		metadata: { userId },
		allow_promotion_codes: true,
		...(productRow.kind === `subscription`
			? { subscription_data: { metadata: { userId } } }
			: {}),
	});

	if (!checkout.url) {
		error(500, `Checkout session missing redirect URL`);
	}

	redirect(303, checkout.url);
};
