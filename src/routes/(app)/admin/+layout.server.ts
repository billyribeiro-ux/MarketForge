import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}
	if (!locals.entitlementKeys.includes(`admin`)) {
		redirect(303, `/app`);
	}
	return {};
};
