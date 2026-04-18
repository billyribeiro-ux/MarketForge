import { getPublicAppUrl } from '$lib/server/stripe/public-url';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const base = getPublicAppUrl();
	const body = [
		`User-agent: *`,
		`Allow: /`,
		`Disallow: /api/`,
		`Disallow: /dev/`,
		`Disallow: /admin`,
		`Disallow: /account`,
		`Disallow: /app`,
		`Disallow: /courses`,
		`Disallow: /indicators`,
		`Disallow: /live`,
		`Disallow: /checkout`,
		`Disallow: /logout`,
		`Sitemap: ${base}/sitemap.xml`,
		``,
	].join(`\n`);

	return new Response(body, {
		headers: {
			'Content-Type': `text/plain; charset=utf-8`,
			'Cache-Control': `public, max-age=3600`,
		},
	});
};
