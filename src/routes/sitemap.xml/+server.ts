import { getPublicAppUrl } from '$lib/server/stripe/public-url';

import type { RequestHandler } from './$types';

const STATIC_PATHS = [
	``,
	`/pricing`,
	`/terms`,
	`/privacy`,
	`/refund-policy`,
	`/cookie-notice`,
	`/about`,
	`/contact`,
	`/support`,
	`/login`,
	`/signup`,
];

export const GET: RequestHandler = async () => {
	const base = getPublicAppUrl();
	const now = new Date().toISOString();
	const urls = STATIC_PATHS.map(
		(path) =>
			`  <url>\n    <loc>${base}${path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`,
	).join(`\n`);

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': `application/xml; charset=utf-8`,
			'Cache-Control': `public, max-age=3600`,
		},
	});
};
