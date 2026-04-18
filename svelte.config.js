import adapter from '@sveltejs/adapter-vercel';

/**
 * Vercel adapter configuration.
 *
 * - `runtime: 'nodejs22.x'` — our stack (`postgres`, Stripe SDK, `better-auth`,
 *   `pino`, Drizzle) needs Node APIs. Edge runtime is NOT compatible. Keep this
 *   in sync with the Node version selected in the Vercel dashboard.
 * - `regions: ['iad1']` — single-region deployment (US East, Washington DC)
 *   matches our Postgres and Stripe API defaults. Multi-region requires an
 *   Enterprise plan AND a replicated DB, so we stay explicit here.
 * - `memory: 1024` — Vercel default; covers SSR + Drizzle pooled connections.
 * - `maxDuration: 15` — Pro plan ceiling; sufficient for every interactive
 *   route. The Stripe webhook and the cron endpoint override this.
 *
 * Per-route overrides live next to each handler via `export const config`
 * (see `src/routes/api/webhooks/stripe/+server.ts`,
 * `src/routes/api/cron/outbox/+server.ts`).
 *
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) =>
			filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
	},
	kit: {
		adapter: adapter({
			runtime: 'nodejs22.x',
			regions: ['iad1'],
			memory: 1024,
			maxDuration: 15,
		}),
	},
};

export default config;
