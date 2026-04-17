import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
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

	const [userRow] = await db
		.select({ stripeCustomerId: users.stripeCustomerId })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	const customerId = userRow?.stripeCustomerId;
	if (!customerId) {
		redirect(303, `/app`);
	}

	const stripe = getStripe();
	const base = getPublicAppUrl();
	const portal = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${base}/app`,
	});

	if (!portal.url) {
		error(500, `Billing portal unavailable`);
	}

	redirect(303, portal.url);
};
