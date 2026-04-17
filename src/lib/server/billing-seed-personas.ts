import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import {
	accounts,
	entitlements,
	prices,
	products,
	purchases,
	subscriptions,
	users,
} from '$lib/server/db/schema';
import type { DbTransaction } from '$lib/server/db/tx';
import type { BillingPersonaSlug } from '$lib/server/dev-personas';
import { entitlementKeysForProductSlug } from '$lib/server/stripe/product-entitlements';

type PlanKey = `monthly` | `quarterly` | `yearly` | `lifetime`;

type Catalog = Record<
	PlanKey,
	{ productId: string; priceId: string; slug: string }
>;

function daysFromNow(days: number): Date {
	return new Date(Date.now() + days * 86400000);
}

async function loadCatalog(tx: DbTransaction): Promise<Catalog> {
	const rows = await tx
		.select({
			slug: products.slug,
			productId: products.id,
			priceId: prices.id,
		})
		.from(prices)
		.innerJoin(products, eq(prices.productId, products.id));

	const bySlug = (s: string) => {
		const r = rows.find((x) => x.slug === s);
		if (!r) throw new Error(`billing-seed: missing catalog row for ${s}`);
		return { productId: r.productId, priceId: r.priceId, slug: r.slug };
	};

	return {
		monthly: bySlug(`pro-monthly`),
		quarterly: bySlug(`pro-quarterly`),
		yearly: bySlug(`pro-yearly`),
		lifetime: bySlug(`pro-lifetime`),
	};
}

type SubSeed = {
	stripeSubscriptionId: string;
	status: `active` | `canceled` | `past_due` | `trialing`;
	cancelAtPeriodEnd: boolean;
	plan: PlanKey;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	trialStart: Date | null;
	trialEnd: Date | null;
};

type PurchaseSeed = {
	stripeCheckoutSessionId: string;
	stripePaymentIntentId: string;
	plan: `lifetime`;
	amount: number;
	status: `paid` | `refunded`;
};

type BillingDef = {
	slug: BillingPersonaSlug;
	stripeCustomerId: string;
	subscription?: SubSeed;
	purchase?: PurchaseSeed;
};

const BILLING_DEFS: BillingDef[] = [
	{
		slug: `sub-monthly-active`,
		stripeCustomerId: `cus_seed_sub_monthly_active`,
		subscription: {
			stripeSubscriptionId: `sub_seed_monthly_active`,
			status: `active`,
			cancelAtPeriodEnd: false,
			plan: `monthly`,
			currentPeriodStart: daysFromNow(-5),
			currentPeriodEnd: daysFromNow(25),
			trialStart: null,
			trialEnd: null,
		},
	},
	{
		slug: `sub-monthly-cancelled-still-active`,
		stripeCustomerId: `cus_seed_sub_monthly_cancelled`,
		subscription: {
			stripeSubscriptionId: `sub_seed_monthly_cancelled`,
			status: `active`,
			cancelAtPeriodEnd: true,
			plan: `monthly`,
			currentPeriodStart: daysFromNow(-10),
			currentPeriodEnd: daysFromNow(14),
			trialStart: null,
			trialEnd: null,
		},
	},
	{
		slug: `sub-monthly-past-due`,
		stripeCustomerId: `cus_seed_sub_monthly_past_due`,
		subscription: {
			stripeSubscriptionId: `sub_seed_monthly_past_due`,
			status: `past_due`,
			cancelAtPeriodEnd: false,
			plan: `monthly`,
			currentPeriodStart: daysFromNow(-20),
			currentPeriodEnd: daysFromNow(10),
			trialStart: null,
			trialEnd: null,
		},
	},
	{
		slug: `sub-quarterly-active`,
		stripeCustomerId: `cus_seed_sub_quarterly_active`,
		subscription: {
			stripeSubscriptionId: `sub_seed_quarterly_active`,
			status: `active`,
			cancelAtPeriodEnd: false,
			plan: `quarterly`,
			currentPeriodStart: daysFromNow(-30),
			currentPeriodEnd: daysFromNow(60),
			trialStart: null,
			trialEnd: null,
		},
	},
	{
		slug: `sub-yearly-active`,
		stripeCustomerId: `cus_seed_sub_yearly_active`,
		subscription: {
			stripeSubscriptionId: `sub_seed_yearly_active`,
			status: `active`,
			cancelAtPeriodEnd: false,
			plan: `yearly`,
			currentPeriodStart: daysFromNow(-40),
			currentPeriodEnd: daysFromNow(325),
			trialStart: null,
			trialEnd: null,
		},
	},
	{
		slug: `sub-yearly-trial`,
		stripeCustomerId: `cus_seed_sub_yearly_trial`,
		subscription: {
			stripeSubscriptionId: `sub_seed_yearly_trial`,
			status: `trialing`,
			cancelAtPeriodEnd: false,
			plan: `yearly`,
			currentPeriodStart: daysFromNow(-3),
			currentPeriodEnd: daysFromNow(27),
			trialStart: daysFromNow(-3),
			trialEnd: daysFromNow(11),
		},
	},
	{
		slug: `sub-yearly-trial-expiring-tomorrow`,
		stripeCustomerId: `cus_seed_sub_yearly_trial_exp`,
		subscription: {
			stripeSubscriptionId: `sub_seed_yearly_trial_exp`,
			status: `trialing`,
			cancelAtPeriodEnd: false,
			plan: `yearly`,
			currentPeriodStart: daysFromNow(-6),
			currentPeriodEnd: daysFromNow(20),
			trialStart: daysFromNow(-6),
			trialEnd: daysFromNow(1),
		},
	},
	{
		slug: `sub-yearly-trial-no-card`,
		stripeCustomerId: `cus_seed_sub_yearly_trial_nocard`,
		subscription: {
			stripeSubscriptionId: `sub_seed_yearly_trial_nocard`,
			status: `trialing`,
			cancelAtPeriodEnd: false,
			plan: `yearly`,
			currentPeriodStart: daysFromNow(-2),
			currentPeriodEnd: daysFromNow(28),
			trialStart: daysFromNow(-2),
			trialEnd: daysFromNow(12),
		},
	},
	{
		slug: `purchase-lifetime`,
		stripeCustomerId: `cus_seed_purchase_lifetime`,
		purchase: {
			stripeCheckoutSessionId: `cs_seed_lifetime`,
			stripePaymentIntentId: `pi_seed_lifetime`,
			plan: `lifetime`,
			amount: 149900,
			status: `paid`,
		},
	},
	{
		slug: `purchase-lifetime-refunded`,
		stripeCustomerId: `cus_seed_purchase_lifetime_ref`,
		purchase: {
			stripeCheckoutSessionId: `cs_seed_lifetime_refunded`,
			stripePaymentIntentId: `pi_seed_lifetime_refunded`,
			plan: `lifetime`,
			amount: 149900,
			status: `refunded`,
		},
	},
	{
		slug: `purchase-lifetime-disputed`,
		stripeCustomerId: `cus_seed_purchase_lifetime_disp`,
		purchase: {
			stripeCheckoutSessionId: `cs_seed_lifetime_disputed`,
			stripePaymentIntentId: `pi_seed_lifetime_disputed`,
			plan: `lifetime`,
			amount: 149900,
			status: `refunded`,
		},
	},
	{
		slug: `upgrade-monthly-to-yearly`,
		stripeCustomerId: `cus_seed_upgrade_yearly`,
		subscription: {
			stripeSubscriptionId: `sub_seed_upgrade_yearly`,
			status: `active`,
			cancelAtPeriodEnd: false,
			plan: `yearly`,
			currentPeriodStart: daysFromNow(-15),
			currentPeriodEnd: daysFromNow(350),
			trialStart: null,
			trialEnd: null,
		},
	},
];

export async function seedBillingPersonas(
	tx: DbTransaction,
	passwordHash: string,
): Promise<void> {
	const catalog = await loadCatalog(tx);

	for (const def of BILLING_DEFS) {
		const id = randomUUID();
		const label = def.slug.replaceAll(`-`, ` `);
		const name = `${label[0]?.toUpperCase() ?? ``}${label.slice(1)} (dev)`;
		const email = `${def.slug}@test.dev`;

		await tx.insert(users).values({
			id,
			email,
			name,
			emailVerified: true,
			banned: false,
			image: null,
			twoFactorEnabled: false,
			stripeCustomerId: def.stripeCustomerId,
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

		if (def.subscription) {
			const plan = catalog[def.subscription.plan];
			await tx.insert(subscriptions).values({
				userId: id,
				priceId: plan.priceId,
				stripeCustomerId: def.stripeCustomerId,
				stripeSubscriptionId: def.subscription.stripeSubscriptionId,
				status: def.subscription.status,
				cancelAtPeriodEnd: def.subscription.cancelAtPeriodEnd,
				currentPeriodStart: def.subscription.currentPeriodStart,
				currentPeriodEnd: def.subscription.currentPeriodEnd,
				trialStart: def.subscription.trialStart,
				trialEnd: def.subscription.trialEnd,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const grantable =
				def.subscription.status === `active` ||
				def.subscription.status === `trialing` ||
				def.subscription.status === `past_due`;
			if (grantable) {
				const keys = entitlementKeysForProductSlug(plan.slug);
				for (const key of keys) {
					await tx.insert(entitlements).values({
						userId: id,
						key,
						source: `subscription`,
						sourceRef: def.subscription.stripeSubscriptionId,
						validFrom: new Date(),
						validUntil: def.subscription.currentPeriodEnd,
						revokedAt: null,
						metadata: null,
					});
				}
			}
		}

		if (def.purchase) {
			const plan = catalog[def.purchase.plan];
			await tx.insert(purchases).values({
				userId: id,
				productId: plan.productId,
				stripeCheckoutSessionId: def.purchase.stripeCheckoutSessionId,
				stripePaymentIntentId: def.purchase.stripePaymentIntentId,
				amount: def.purchase.amount,
				currency: `usd`,
				status: def.purchase.status,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			if (def.purchase.status === `paid`) {
				const keys = entitlementKeysForProductSlug(plan.slug);
				for (const key of keys) {
					await tx.insert(entitlements).values({
						userId: id,
						key,
						source: `purchase`,
						sourceRef: def.purchase.stripeCheckoutSessionId,
						validFrom: new Date(),
						validUntil: null,
						revokedAt: null,
						metadata: null,
					});
				}
			} else {
				const keys = entitlementKeysForProductSlug(plan.slug);
				const revokedAt = new Date();
				for (const key of keys) {
					await tx.insert(entitlements).values({
						userId: id,
						key,
						source: `purchase`,
						sourceRef: def.purchase.stripeCheckoutSessionId,
						validFrom: new Date(),
						validUntil: null,
						revokedAt,
						metadata: { seed: `revoked-refund-or-dispute` },
					});
				}
			}
		}
	}
}
