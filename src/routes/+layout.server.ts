import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { PUBLIC_APP_URL } from '$env/static/public';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const siteUrl = PUBLIC_APP_URL.replace(/\/$/, ``);
	return {
		...(dev ? { workspaceRoot: process.cwd() } : {}),
		user: locals.user,
		authTier: locals.authTier,
		siteUrl,
		plausibleDomain: env.PUBLIC_PLAUSIBLE_DOMAIN?.trim() || null,
		plausibleScriptSrc:
			env.PUBLIC_PLAUSIBLE_SCRIPT_SRC?.trim() ||
			`https://plausible.io/js/script.js`,
	};
};
