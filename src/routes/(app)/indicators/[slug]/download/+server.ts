import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { LIB_CONTENT_ROOT } from '$lib/server/content-paths';
import { db } from '$lib/server/db';
import { indicators } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';

import type { RequestHandler } from './$types';

/** Slug shape mirrored from content pipeline; blocks path separators and traversal. */
const SLUG_SHAPE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

const CONTENT_ROOT = resolve(LIB_CONTENT_ROOT, `indicators`);

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) error(401, `Unauthorized`);
	if (!event.locals.entitlementKeys.includes(`indicator_vault`))
		error(403, `Forbidden`);

	const format = event.url.searchParams.get(`format`);
	if (format !== `pine` && format !== `thinkscript`) {
		error(400, `Invalid format`);
	}

	if (!SLUG_SHAPE.test(event.params.slug)) error(404, `Not found`);

	const [row] = await db
		.select({ slug: indicators.slug })
		.from(indicators)
		.where(
			and(
				eq(indicators.slug, event.params.slug),
				eq(indicators.published, true),
			),
		)
		.limit(1);

	if (!row) error(404, `Not found`);
	// Defence in depth: a row can only ship to us what the DB holds, but re-check shape.
	if (!SLUG_SHAPE.test(row.slug)) error(404, `Not found`);

	const filename = `${row.slug}.${format}`;
	const path = resolve(CONTENT_ROOT, filename);
	// Reject any resolved path outside the content root (belt & braces).
	if (!path.startsWith(`${CONTENT_ROOT}/`)) error(404, `Not found`);

	let body: string;
	try {
		body = await readFile(path, `utf8`);
	} catch (err) {
		const e = err instanceof Error ? err : new Error(String(err));
		logger.warn(
			{ err: e, slug: row.slug, format },
			`indicator source file unavailable`,
		);
		error(404, `Source file missing`);
	}

	// RFC 5987: safe UTF-8 filename + ASCII fallback. Slug shape already excludes
	// quotes, backslashes, CR, LF — but encoding is still the correct approach.
	const asciiName = filename.replace(/[^A-Za-z0-9._-]/g, `_`);
	const disposition = `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`;

	return new Response(body, {
		headers: {
			'Content-Type': `text/plain; charset=utf-8`,
			'Content-Disposition': disposition,
			'X-Content-Type-Options': `nosniff`,
			'Cache-Control': `private, no-store`,
		},
	});
};
