/**
 * Stripe ↔ DB reconciliation: subscriptions with `updated_at` since `--since` are verified via Stripe retrieve.
 * Usage: `pnpm tsx scripts/reconcile-stripe.ts --since=2026-04-15T00:00:00Z`
 * Requires STRIPE_SECRET_KEY, DATABASE_URL (loads `.env.local` / `.env` when present).
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';
import { gte } from 'drizzle-orm';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), `..`);
config({ path: resolve(repoRoot, `.env.local`) });
config({ path: resolve(repoRoot, `.env`) });

const args = process.argv.slice(2);
const sinceIdx = args.findIndex(
	(a) => a === `--since` || a.startsWith(`--since=`),
);
let sinceRaw: string | null = null;
if (sinceIdx !== -1) {
	if (args[sinceIdx].startsWith(`--since=`)) {
		sinceRaw = args[sinceIdx].slice(`--since=`.length);
	} else {
		sinceRaw = args[sinceIdx + 1] ?? null;
	}
}

if (args.includes(`--help`) || args.includes(`-h`)) {
	console.log(`Usage: pnpm tsx scripts/reconcile-stripe.ts --since=<ISO-8601>`);
	console.log(`Requires STRIPE_SECRET_KEY and DATABASE_URL.`);
	console.log(
		`For each DB subscription row with updated_at >= since, calls Stripe subscriptions.retrieve and compares status.`,
	);
	process.exit(0);
}

if (!sinceRaw) {
	console.error(`Error: pass --since="2026-04-15T00:00:00Z"`);
	process.exit(1);
}

const sinceMs = Date.parse(sinceRaw);
if (Number.isNaN(sinceMs)) {
	console.error(`Error: invalid ISO date: ${sinceRaw}`);
	process.exit(1);
}
const sinceDate = new Date(sinceMs);

if (
	!process.env.STRIPE_SECRET_KEY?.trim() ||
	!process.env.DATABASE_URL?.trim()
) {
	console.error(`Error: STRIPE_SECRET_KEY and DATABASE_URL must be set`);
	process.exit(1);
}

async function main(): Promise<void> {
	const { db } = await import(`../src/lib/server/db/index.ts`);
	const { subscriptions } = await import(`../src/lib/server/db/schema.ts`);
	const { getStripe } = await import(`../src/lib/server/stripe/client.ts`);
	const stripe = getStripe();

	const rows = await db
		.select({
			stripeSubscriptionId: subscriptions.stripeSubscriptionId,
			status: subscriptions.status,
			updatedAt: subscriptions.updatedAt,
		})
		.from(subscriptions)
		.where(gte(subscriptions.updatedAt, sinceDate));

	console.log(
		`Reconcile since ${sinceDate.toISOString()}: ${rows.length} subscription row(s) in DB (updated_at in range).`,
	);

	let missingInStripe = 0;
	let statusMismatch = 0;

	for (const row of rows) {
		try {
			const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
			if (sub.status !== row.status) {
				statusMismatch++;
				console.warn(
					`Status drift: ${row.stripeSubscriptionId} Stripe=${sub.status} DB=${row.status}`,
				);
			}
		} catch {
			missingInStripe++;
			console.warn(
				`Missing or inaccessible in Stripe: ${row.stripeSubscriptionId}`,
			);
		}
	}

	console.log(
		JSON.stringify({
			since: sinceDate.toISOString(),
			dbRowsInWindow: rows.length,
			missingInStripe,
			statusMismatch,
		}),
	);

	if (missingInStripe > 0) {
		process.exitCode = 2;
	}
}

main().catch((err: unknown) => {
	console.error(err);
	process.exit(1);
});
