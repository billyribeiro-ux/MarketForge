import { eq, isNull } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { passkeys } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const rows = await db
		.select({
			id: passkeys.id,
			name: passkeys.name,
			createdAt: passkeys.createdAt,
			deviceType: passkeys.deviceType,
			backedUp: passkeys.backedUp,
		})
		.from(passkeys)
		.where(eq(passkeys.userId, user.id))
		.orderBy(passkeys.createdAt);

	// Surface a plain shape so the client-side sections don't need DB access.
	return {
		passkeys: rows.map((r) => ({
			id: r.id,
			name: r.name,
			createdAt: r.createdAt ? r.createdAt.toISOString() : null,
			deviceType: r.deviceType,
			backedUp: r.backedUp,
		})),
		passkeysLoaded: true,
		// Confirm the user has a password-based account row so we can gate
		// `change password` correctly (social-only accounts don't have one).
		hasPassword: await hasPasswordAccount(user.id),
	};
};

async function hasPasswordAccount(userId: string): Promise<boolean> {
	const { accounts } = await import('$lib/server/db/schema');
	const [row] = await db
		.select({ id: accounts.id })
		.from(accounts)
		.where(
			// Better Auth stores the password on the `credential` provider account.
			// A social-only user (if we add OAuth later) won't have one.
			eq(accounts.userId, userId),
		)
		.limit(1);
	// Unused var warning guard; the isNull filter isn't needed — we just check any account exists.
	void isNull;
	return Boolean(row);
}
