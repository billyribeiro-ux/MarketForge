/**
 * Idempotent Stripe catalog sync for local/staging seed. Safe to re-run.
 * Called from `scripts/seed-dev.ts` when `STRIPE_SECRET_KEY` is set.
 */
import { and, eq, isNull } from 'drizzle-orm';
import type Stripe from 'stripe';

import { db } from '$lib/server/db';
import { coupons, prices, products } from '$lib/server/db/schema';
import { getStripe } from '$lib/server/stripe/client';

type CatalogRow = {
	slug: string;
	name: string;
	kind: `subscription` | `one_time`;
	unitAmount: number;
	currency: string;
	recurringInterval: string | null;
	recurringIntervalCount: number;
};

const CATALOG: CatalogRow[] = [
	{
		slug: `pro-monthly`,
		name: `Pro Monthly`,
		kind: `subscription`,
		unitAmount: 4900,
		currency: `usd`,
		recurringInterval: `month`,
		recurringIntervalCount: 1,
	},
	{
		slug: `pro-quarterly`,
		name: `Pro Quarterly`,
		kind: `subscription`,
		unitAmount: 12900,
		currency: `usd`,
		recurringInterval: `month`,
		recurringIntervalCount: 3,
	},
	{
		slug: `pro-yearly`,
		name: `Pro Yearly`,
		kind: `subscription`,
		unitAmount: 44900,
		currency: `usd`,
		recurringInterval: `year`,
		recurringIntervalCount: 1,
	},
	{
		slug: `pro-lifetime`,
		name: `Pro Lifetime`,
		kind: `one_time`,
		unitAmount: 149900,
		currency: `usd`,
		recurringInterval: null,
		recurringIntervalCount: 1,
	},
];

type CouponSeed = {
	code: string;
	name: string;
	percentOff?: number;
	amountOff?: number;
	currency?: string;
	maxRedemptions?: number;
	redeemBy?: number;
	duration: `once` | `repeating` | `forever`;
};

const COUPON_SPECS: CouponSeed[] = [
	{
		code: `DEV_PERCENT_OFF`,
		name: `Dev 100% off`,
		percentOff: 100,
		duration: `once`,
	},
	{
		code: `DEV_FIXED_OFF`,
		name: `Dev $20 off`,
		amountOff: 2000,
		currency: `usd`,
		duration: `once`,
	},
	{
		code: `DEV_SUB_ONLY`,
		name: `Dev subscriptions only`,
		percentOff: 10,
		duration: `once`,
	},
	{
		code: `DEV_LIFETIME_ONLY`,
		name: `Dev lifetime only`,
		percentOff: 10,
		duration: `once`,
	},
	{
		code: `DEV_FIRST_MONTH_ONLY`,
		name: `Dev first month`,
		percentOff: 50,
		duration: `once`,
	},
	{
		code: `DEV_FOREVER`,
		name: `Dev forever discount`,
		percentOff: 5,
		duration: `forever`,
	},
	{
		code: `DEV_EXPIRED`,
		name: `Dev expired`,
		percentOff: 15,
		duration: `once`,
		redeemBy: Math.floor(Date.now() / 1000) - 86400,
	},
	{
		code: `DEV_USED_UP`,
		name: `Dev exhausted`,
		percentOff: 10,
		duration: `once`,
		maxRedemptions: 1,
	},
	{
		code: `DEV_DISABLED`,
		name: `Dev disabled`,
		percentOff: 20,
		duration: `once`,
	},
	{
		code: `DEV_WRONG_CURRENCY`,
		name: `Dev EUR only`,
		amountOff: 500,
		currency: `eur`,
		duration: `once`,
	},
	{
		code: `DEV_MIN_AMOUNT`,
		name: `Dev min $100`,
		amountOff: 1000,
		currency: `usd`,
		duration: `once`,
	},
	{
		code: `DEV_STACKED`,
		name: `Dev stacking test`,
		percentOff: 7,
		duration: `once`,
	},
];

async function findStripeProductBySlug(
	stripe: Stripe,
	slug: string,
): Promise<Stripe.Product | undefined> {
	const list = await stripe.products.list({ limit: 100, active: true });
	return list.data.find((p) => p.metadata?.marketforge_slug === slug);
}

async function ensureStripeProduct(
	stripe: Stripe,
	row: CatalogRow,
): Promise<Stripe.Product> {
	const found = await findStripeProductBySlug(stripe, row.slug);
	if (found) return found;
	return stripe.products.create({
		name: row.name,
		metadata: { marketforge_slug: row.slug },
	});
}

async function ensureStripePrice(
	stripe: Stripe,
	productId: string,
	row: CatalogRow,
): Promise<Stripe.Price> {
	const list = await stripe.prices.list({
		product: productId,
		limit: 100,
		active: true,
	});
	const match = list.data.find((p) => {
		if (
			p.unit_amount !== row.unitAmount ||
			(p.currency ?? ``).toLowerCase() !== row.currency
		) {
			return false;
		}
		const rec = p.recurring;
		if (row.kind === `one_time`) return !rec;
		return (
			rec?.interval === row.recurringInterval &&
			(rec?.interval_count ?? 1) === row.recurringIntervalCount
		);
	});
	if (match) return match;

	if (row.kind === `one_time`) {
		return stripe.prices.create({
			product: productId,
			unit_amount: row.unitAmount,
			currency: row.currency,
			metadata: { marketforge_slug: row.slug },
		});
	}

	return stripe.prices.create({
		product: productId,
		unit_amount: row.unitAmount,
		currency: row.currency,
		recurring: {
			interval: row.recurringInterval as Stripe.Price.Recurring.Interval,
			interval_count: row.recurringIntervalCount,
		},
		metadata: { marketforge_slug: row.slug },
	});
}

function priceRowMatcher(productId: string, row: CatalogRow) {
	if (row.recurringInterval === null) {
		return and(
			eq(prices.productId, productId),
			isNull(prices.recurringInterval),
			eq(prices.unitAmount, row.unitAmount),
		);
	}
	return and(
		eq(prices.productId, productId),
		eq(prices.recurringInterval, row.recurringInterval),
		eq(prices.recurringIntervalCount, row.recurringIntervalCount),
		eq(prices.unitAmount, row.unitAmount),
	);
}

export async function ensureStripeCatalogInDb(): Promise<void> {
	const stripe = getStripe();
	const slugToStripeProductId: Record<string, string> = {};

	for (const row of CATALOG) {
		const sp = await ensureStripeProduct(stripe, row);
		slugToStripeProductId[row.slug] = sp.id;
		const stripePrice = await ensureStripePrice(stripe, sp.id, row);

		const [productRow] = await db
			.select()
			.from(products)
			.where(eq(products.slug, row.slug))
			.limit(1);
		if (!productRow) continue;

		await db
			.update(products)
			.set({ stripeProductId: sp.id, updatedAt: new Date() })
			.where(eq(products.id, productRow.id));

		await db
			.update(prices)
			.set({ stripePriceId: stripePrice.id, updatedAt: new Date() })
			.where(priceRowMatcher(productRow.id, row));
	}

	const subStripeIds = [
		slugToStripeProductId[`pro-monthly`],
		slugToStripeProductId[`pro-quarterly`],
		slugToStripeProductId[`pro-yearly`],
	].filter(Boolean) as string[];

	const lifetimeStripeId = slugToStripeProductId[`pro-lifetime`];

	for (const spec of COUPON_SPECS) {
		let applies: { products: string[] } | undefined;
		if (spec.code === `DEV_SUB_ONLY` && subStripeIds.length) {
			applies = { products: subStripeIds };
		} else if (spec.code === `DEV_LIFETIME_ONLY` && lifetimeStripeId) {
			applies = { products: [lifetimeStripeId] };
		}

		const params: Stripe.CouponCreateParams = {
			name: spec.name,
			duration: spec.duration,
			metadata: { marketforge_code: spec.code },
		};
		if (spec.percentOff != null) params.percent_off = spec.percentOff;
		if (spec.amountOff != null) params.amount_off = spec.amountOff;
		if (spec.currency) params.currency = spec.currency;
		if (applies) params.applies_to = applies;
		if (spec.maxRedemptions != null)
			params.max_redemptions = spec.maxRedemptions;
		if (spec.redeemBy != null) params.redeem_by = spec.redeemBy;

		const existing = await stripe.coupons.list({ limit: 100 });
		let coupon = existing.data.find(
			(c) => c.metadata?.marketforge_code === spec.code,
		);
		if (!coupon) {
			coupon = await stripe.coupons.create(params);
		}

		if (spec.code === `DEV_DISABLED`) {
			await stripe.coupons.update(coupon.id, {
				metadata: { marketforge_code: spec.code, disabled: `true` },
			});
		}

		await db
			.update(coupons)
			.set({
				stripeCouponId: coupon.id,
				percentOff: spec.percentOff ?? null,
				amountOff: spec.amountOff ?? null,
				currency: spec.currency ?? `usd`,
				updatedAt: new Date(),
			})
			.where(eq(coupons.code, spec.code));
	}
}
