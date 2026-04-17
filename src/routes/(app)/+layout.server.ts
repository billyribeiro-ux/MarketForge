import { redirect } from '@sveltejs/kit';
import { isStripeConfigured } from '$lib/server/stripe/client';
import { loadSubscriptionAlertState } from '$lib/server/subscription-alerts';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}
	if (locals.user.banned) {
		redirect(303, `/banned`);
	}

	const subscription = await loadSubscriptionAlertState(locals.user.id);

	return {
		user: locals.user,
		session: locals.session,
		authTier: locals.authTier,
		entitlementKeys: locals.entitlementKeys,
		checkoutEnabled: isStripeConfigured(),
		subscription,
	};
};
