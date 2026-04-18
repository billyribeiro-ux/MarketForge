import { error, json } from '@sveltejs/kit';

import { logger } from '$lib/server/logger';
import { drainOutboxOnce } from '$lib/server/outbox-dispatcher';

import type { RequestHandler } from './$types';

/**
 * Longer ceiling than the default — a cold outbox (first drain after a quiet
 * period) can deliver a backlog of emails; we'd rather finish the run than
 * retry a partially-drained batch on the next cron tick.
 *
 * @type {import('@sveltejs/adapter-vercel').Config}
 */
export const config = {
	runtime: `nodejs22.x`,
	maxDuration: 60,
};

/**
 * Serverless cron target. Configure the hosting platform to hit this path on
 * a schedule (Vercel `vercel.json` crons, Cloudflare `wrangler.toml`, etc.).
 *
 * Protected by a shared secret in `CRON_SECRET`: in prod, add
 * `Authorization: Bearer $CRON_SECRET` on the cron job configuration. On
 * Vercel, the Crons scheduler automatically attaches that header when
 * `CRON_SECRET` is set as a project env var. Missing env var = endpoint is
 * disabled (fail closed).
 */
export const POST: RequestHandler = async ({ request }) => {
	const expected = process.env.CRON_SECRET?.trim();
	if (!expected) {
		logger.warn(`/api/cron/outbox called without CRON_SECRET configured`);
		error(503, `Cron endpoint not configured`);
	}

	const auth = request.headers.get(`authorization`) ?? ``;
	if (auth !== `Bearer ${expected}`) {
		error(401, `Unauthorized`);
	}

	const result = await drainOutboxOnce();
	logger.info(result, `cron outbox drain`);
	return json(result);
};

// Also expose GET so platforms that only support GET triggers can still call it.
export const GET = POST;
