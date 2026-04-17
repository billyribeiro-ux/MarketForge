import { desc, eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { subscriptions } from '$lib/server/db/schema';

type SubRow = typeof subscriptions.$inferSelect;

export type SubscriptionAlertState = Pick<
	SubRow,
	'status' | 'cancelAtPeriodEnd' | 'trialEnd' | 'currentPeriodEnd'
> | null;

/** Latest subscription row for billing banners (dev personas + Stripe). */
export async function loadSubscriptionAlertState(
	userId: string,
): Promise<SubscriptionAlertState> {
	const [row] = await db
		.select({
			status: subscriptions.status,
			cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
			trialEnd: subscriptions.trialEnd,
			currentPeriodEnd: subscriptions.currentPeriodEnd,
		})
		.from(subscriptions)
		.where(eq(subscriptions.userId, userId))
		.orderBy(desc(subscriptions.updatedAt))
		.limit(1);

	if (!row) return null;
	return row;
}
