import { and, asc, eq } from 'drizzle-orm';

import { formatMoney } from '$lib/money';
import { db } from '$lib/server/db';
import { prices, products } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

function billingLabel(
	kind: string,
	interval: string | null,
	intervalCount: number,
): string {
	if (kind === `one_time`) return `One-time`;
	if (!interval) return `Subscription`;
	if (interval === `month` && intervalCount === 3) return `Every 3 months`;
	if (interval === `month`) return `Monthly`;
	if (interval === `year`) return `Yearly`;
	return `Subscription`;
}

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			slug: products.slug,
			name: products.name,
			kind: products.kind,
			unitAmount: prices.unitAmount,
			currency: prices.currency,
			recurringInterval: prices.recurringInterval,
			recurringIntervalCount: prices.recurringIntervalCount,
			checkoutPath: products.slug,
		})
		.from(products)
		.innerJoin(prices, eq(prices.productId, products.id))
		.where(and(eq(products.active, true), eq(prices.active, true)))
		.orderBy(asc(products.name));

	const items = rows.map((r) => ({
		...r,
		displayPrice: formatMoney(r.unitAmount, r.currency),
		billing: billingLabel(
			r.kind,
			r.recurringInterval,
			r.recurringIntervalCount,
		),
	}));

	return { items };
};
