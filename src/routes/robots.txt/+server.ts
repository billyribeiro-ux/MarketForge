import { getPublicAppUrl } from '$lib/server/stripe/public-url';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const base = getPublicAppUrl();
	const body = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dev/\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`;

	return new Response(body, {
		headers: {
			'Content-Type': `text/plain; charset=utf-8`,
			'Cache-Control': `public, max-age=3600`,
		},
	});
};
