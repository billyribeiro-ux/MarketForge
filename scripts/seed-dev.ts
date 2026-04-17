import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from 'better-auth/crypto';
import { config } from 'dotenv';

import type { AuthPersonaSlug } from '../src/lib/server/dev-personas.ts';
import { DEV_PERSONA_EMAIL } from '../src/lib/server/dev-personas.ts';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), `..`);
config({ path: resolve(repoRoot, `.env.local`) });
config({ path: resolve(repoRoot, `.env`) });

function assertSeedEnvironment(): void {
	if (process.env.NODE_ENV === `production`) {
		throw new Error(`seed-dev: refusing to run when NODE_ENV is production`);
	}
	const url = process.env.DATABASE_URL?.trim();
	if (!url) {
		throw new Error(
			`seed-dev: DATABASE_URL is required (copy .env.example to .env.local)`,
		);
	}
	const pw = process.env.DEV_TEST_PASSWORD?.trim();
	if (!pw) {
		throw new Error(
			`seed-dev: DEV_TEST_PASSWORD is required for auth personas`,
		);
	}
}

type EntRow = {
	key: `pro_access` | `indicator_vault` | `live_room` | `admin`;
	validUntil?: Date | null;
};

type PersonaSeed = {
	slug: AuthPersonaSlug;
	banned?: boolean;
	entitlements: EntRow[];
};

const PERSONAS: PersonaSeed[] = [
	{ slug: `free`, entitlements: [] },
	{ slug: `pro`, entitlements: [{ key: `pro_access` }] },
	{
		slug: `pro-expired`,
		entitlements: [
			{ key: `pro_access`, validUntil: new Date(Date.now() - 86400000) },
		],
	},
	{
		slug: `trial`,
		entitlements: [
			{ key: `pro_access`, validUntil: new Date(Date.now() + 7 * 86400000) },
		],
	},
	{
		slug: `admin`,
		entitlements: [{ key: `pro_access` }, { key: `admin` }],
	},
	{ slug: `banned`, banned: true, entitlements: [] },
];

async function main(): Promise<void> {
	assertSeedEnvironment();
	const passwordHash = await hashPassword(
		process.env.DEV_TEST_PASSWORD!.trim(),
	);

	const { db } = await import(`../src/lib/server/db/index.ts`);
	const {
		accounts,
		auditLog,
		coupons,
		courseProgress,
		courses,
		entitlements,
		indicators,
		passkeys,
		prices,
		products,
		purchases,
		subscriptions,
		twoFactors,
		users,
		verificationTokens,
		webhookEvents,
	} = await import(`../src/lib/server/db/schema.ts`);

	await db.transaction(async (tx) => {
		await tx.delete(webhookEvents);
		await tx.delete(auditLog);
		await tx.delete(entitlements);
		await tx.delete(purchases);
		await tx.delete(subscriptions);
		await tx.delete(courseProgress);
		await tx.delete(verificationTokens);
		await tx.delete(passkeys);
		await tx.delete(twoFactors);
		await tx.delete(accounts);
		await tx.delete(users);
		await tx.delete(courses);
		await tx.delete(indicators);
		await tx.delete(prices);
		await tx.delete(coupons);
		await tx.delete(products);

		const [monthly, quarterly, yearly, lifetime] = await tx
			.insert(products)
			.values([
				{
					slug: `pro-monthly`,
					name: `Pro Monthly`,
					kind: `subscription`,
					active: true,
				},
				{
					slug: `pro-quarterly`,
					name: `Pro Quarterly`,
					kind: `subscription`,
					active: true,
				},
				{
					slug: `pro-yearly`,
					name: `Pro Yearly`,
					kind: `subscription`,
					active: true,
				},
				{
					slug: `pro-lifetime`,
					name: `Pro Lifetime`,
					kind: `one_time`,
					active: true,
				},
			])
			.returning();

		if (!monthly || !quarterly || !yearly || !lifetime) {
			throw new Error(`seed-dev: failed to insert products`);
		}

		await tx.insert(prices).values([
			{
				productId: monthly.id,
				currency: `usd`,
				unitAmount: 4900,
				recurringInterval: `month`,
				recurringIntervalCount: 1,
				active: true,
			},
			{
				productId: quarterly.id,
				currency: `usd`,
				unitAmount: 12900,
				recurringInterval: `month`,
				recurringIntervalCount: 3,
				active: true,
			},
			{
				productId: yearly.id,
				currency: `usd`,
				unitAmount: 44900,
				recurringInterval: `year`,
				recurringIntervalCount: 1,
				active: true,
			},
			{
				productId: lifetime.id,
				currency: `usd`,
				unitAmount: 149900,
				recurringInterval: null,
				recurringIntervalCount: 1,
				active: true,
			},
		]);

		await tx.insert(coupons).values([
			{
				code: `DEV_PERCENT_OFF`,
				name: `Dev 100% off`,
				percentOff: 100,
				amountOff: null,
				currency: null,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_FIXED_OFF`,
				name: `Dev $20 off`,
				percentOff: null,
				amountOff: 2000,
				currency: `usd`,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_SUB_ONLY`,
				name: `Dev subscriptions only`,
				percentOff: 10,
				amountOff: null,
				currency: null,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_LIFETIME_ONLY`,
				name: `Dev lifetime only`,
				percentOff: 10,
				amountOff: null,
				currency: null,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_FIRST_MONTH_ONLY`,
				name: `Dev first month`,
				percentOff: 50,
				amountOff: null,
				currency: null,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_FOREVER`,
				name: `Dev forever discount`,
				percentOff: 5,
				amountOff: null,
				currency: null,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_EXPIRED`,
				name: `Dev expired`,
				percentOff: 15,
				amountOff: null,
				currency: null,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_USED_UP`,
				name: `Dev exhausted`,
				percentOff: 10,
				amountOff: null,
				currency: null,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_DISABLED`,
				name: `Dev disabled`,
				percentOff: 20,
				amountOff: null,
				currency: null,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_WRONG_CURRENCY`,
				name: `Dev EUR only`,
				percentOff: null,
				amountOff: 500,
				currency: `eur`,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_MIN_AMOUNT`,
				name: `Dev min $100`,
				percentOff: null,
				amountOff: 1000,
				currency: `usd`,
				active: true,
				metadata: null,
			},
			{
				code: `DEV_STACKED`,
				name: `Dev stacking test`,
				percentOff: 7,
				amountOff: null,
				currency: null,
				active: true,
				metadata: null,
			},
		]);

		await tx.insert(courses).values({
			slug: `risk-management-essentials`,
			title: `Risk Management Essentials`,
			description: `Position sizing, drawdown control, and daily process — the foundation before any setup.`,
			sortOrder: 0,
			published: true,
		});

		await tx.insert(indicators).values({
			slug: `institutional-trend`,
			title: `Institutional Trend Framework`,
			description: `Multi-timeframe trend filter with regime hints — Pine & ThinkScript sources in the vault.`,
			sortOrder: 0,
			published: true,
		});

		for (const p of PERSONAS) {
			const email = DEV_PERSONA_EMAIL[p.slug];
			const id = randomUUID();
			const label = p.slug.replaceAll(`-`, ` `);
			const name = `${label[0]?.toUpperCase() ?? ``}${label.slice(1)} (dev)`;

			await tx.insert(users).values({
				id,
				email,
				name,
				emailVerified: true,
				banned: p.banned ?? false,
				image: null,
				twoFactorEnabled: false,
				stripeCustomerId: null,
			});

			await tx.insert(accounts).values({
				id: randomUUID(),
				userId: id,
				accountId: id,
				providerId: `credential`,
				password: passwordHash,
				accessToken: null,
				refreshToken: null,
				idToken: null,
				accessTokenExpiresAt: null,
				refreshTokenExpiresAt: null,
				scope: null,
			});

			for (const e of p.entitlements) {
				await tx.insert(entitlements).values({
					userId: id,
					key: e.key,
					source: `manual`,
					sourceRef: `dev-seed:${p.slug}`,
					validFrom: new Date(),
					validUntil: e.validUntil ?? null,
					revokedAt: null,
					metadata: null,
				});
			}
		}

		const { seedBillingPersonas } = await import(
			`../src/lib/server/billing-seed-personas.ts`
		);
		await seedBillingPersonas(tx, passwordHash);
	});

	if (process.env.STRIPE_SECRET_KEY?.trim()) {
		try {
			const { ensureStripeCatalogInDb } = await import(
				`../src/lib/server/stripe/ensure-catalog.ts`
			);
			await ensureStripeCatalogInDb();
			console.info(`seed-dev: Stripe catalog + coupons synced`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.warn(
				`seed-dev: Stripe catalog sync skipped (DB personas still seeded): ${msg}`,
			);
		}
	}

	console.info(
		`seed-dev: ok (catalog + ${PERSONAS.length} auth + 12 billing personas @test.dev — password = DEV_TEST_PASSWORD)`,
	);
}

main().catch((err: unknown) => {
	console.error(err);
	process.exitCode = 1;
});
