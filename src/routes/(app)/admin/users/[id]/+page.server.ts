import { error, fail } from '@sveltejs/kit';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { auditLog, entitlements, users } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

const KEYS = [`pro_access`, `indicator_vault`, `live_room`, `admin`] as const;

export const load: PageServerLoad = async ({ params }) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, params.id))
		.limit(1);
	if (!user) error(404, `User not found`);

	const rows = await db
		.select()
		.from(entitlements)
		.where(eq(entitlements.userId, params.id))
		.orderBy(desc(entitlements.createdAt));

	return { subject: user, entitlements: rows, keys: KEYS };
};

export const actions: Actions = {
	grant: async ({ request, locals, params }) => {
		if (!locals.user || !locals.entitlementKeys.includes(`admin`)) {
			return fail(403, { message: `Forbidden` });
		}

		const fd = await request.formData();
		const key = fd.get(`key`);
		const validUntilRaw = fd.get(`validUntil`);

		if (
			typeof key !== `string` ||
			!KEYS.includes(key as (typeof KEYS)[number])
		) {
			return fail(400, { message: `Invalid key` });
		}

		let validUntil: Date | null = null;
		if (typeof validUntilRaw === `string` && validUntilRaw.trim()) {
			const d = new Date(validUntilRaw);
			if (Number.isNaN(d.getTime()))
				return fail(400, { message: `Invalid date` });
			validUntil = d;
		}

		const now = new Date();
		await db.insert(entitlements).values({
			userId: params.id,
			key: key as (typeof KEYS)[number],
			source: `manual`,
			sourceRef: `admin:${locals.user.id}`,
			validFrom: now,
			validUntil,
			revokedAt: null,
			metadata: null,
		});

		await db.insert(auditLog).values({
			actorUserId: locals.user.id,
			action: `entitlement.grant`,
			entityType: `user`,
			entityId: params.id,
			metadata: { key, validUntil: validUntil?.toISOString() ?? null },
		});

		return { ok: true };
	},

	revoke: async ({ request, locals, params }) => {
		if (!locals.user || !locals.entitlementKeys.includes(`admin`)) {
			return fail(403, { message: `Forbidden` });
		}

		const fd = await request.formData();
		const entitlementId = fd.get(`entitlementId`);
		if (typeof entitlementId !== `string` || !entitlementId) {
			return fail(400, { message: `Missing entitlement` });
		}

		const now = new Date();
		const updated = await db
			.update(entitlements)
			.set({ revokedAt: now, updatedAt: now })
			.where(
				and(
					eq(entitlements.id, entitlementId),
					eq(entitlements.userId, params.id),
					isNull(entitlements.revokedAt),
				),
			)
			.returning({ id: entitlements.id });

		if (!updated.length) return fail(404, { message: `Not found` });

		await db.insert(auditLog).values({
			actorUserId: locals.user.id,
			action: `entitlement.revoke`,
			entityType: `entitlement`,
			entityId: entitlementId,
			metadata: { targetUserId: params.id },
		});

		return { ok: true };
	},
};
