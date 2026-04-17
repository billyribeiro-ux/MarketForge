import type { RequestEvent } from '@sveltejs/kit';
import { and, eq, gt, isNull, or } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { entitlements } from '$lib/server/db/schema';
import type { AuthTier, EntitlementKey } from '$lib/types/auth';

function deriveTier(keys: readonly string[]): AuthTier {
	if (keys.includes(`admin`)) return `admin`;
	if (keys.includes(`pro_access`)) return `entitled`;
	return `authed`;
}

/** Loads active entitlements and `authTier` after Better Auth session is resolved. */
export async function loadAuthLocals(event: RequestEvent): Promise<void> {
	const user = event.locals.user;
	if (!user) {
		event.locals.entitlementKeys = [];
		event.locals.authTier = `anonymous`;
		return;
	}

	const now = new Date();
	const rows = await db
		.select({ key: entitlements.key })
		.from(entitlements)
		.where(
			and(
				eq(entitlements.userId, user.id),
				isNull(entitlements.revokedAt),
				or(isNull(entitlements.validUntil), gt(entitlements.validUntil, now)),
			),
		);

	const keys = rows.map((r) => r.key) as EntitlementKey[];
	event.locals.entitlementKeys = keys;
	event.locals.authTier = deriveTier(keys);
}
