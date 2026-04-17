import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { prepareAccountDeletion } from '$lib/server/account/delete-account';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';
import { deleteAccountFormSchema } from '$lib/validation/account-forms';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(deleteAccountFormSchema), {
		defaults: { password: ``, confirm: `DELETE` as const },
	});
	// Blank the prefilled confirm so users must type it explicitly.
	form.data.confirm = `` as never;
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: `Unauthorized` });
		const userId = locals.user.id;

		const form = await superValidate(request, zod4(deleteAccountFormSchema));
		if (!form.valid) return fail(400, { form });

		const [row] = await db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				stripeCustomerId: users.stripeCustomerId,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		if (!row) return fail(404, { message: `User not found` });

		// Snapshot the compliance trail BEFORE Better Auth drops the row.
		// audit_log.actor_user_id is `ON DELETE SET NULL`, so the row survives
		// the cascading delete as an anonymised but dated audit record.
		// Stripe cleanup happens here too (outside the tx).
		try {
			await db.transaction(async (tx) => {
				await prepareAccountDeletion(tx, {
					userId: row.id,
					email: row.email,
					name: row.name,
					stripeCustomerId: row.stripeCustomerId ?? null,
					actorUserId: row.id,
				});
			});
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			logger.error({ err: e, userId }, `account deletion pre-step failed`);
			return fail(500, {
				message: `Account deletion failed — contact support.`,
			});
		}

		// Better Auth verifies the password, performs the row delete + session
		// teardown + cookies; our schema's FK cascades clean up sessions,
		// accounts, 2FA, passkeys, entitlements, subscriptions, purchases,
		// and course progress.
		const res = await auth.api.deleteUser({
			body: { password: form.data.password },
			headers: request.headers,
			asResponse: true,
		});
		if (!res.ok) {
			logger.error(
				{ userId: row.id, status: res.status },
				`better-auth deleteUser returned non-ok after audit snapshot`,
			);
			const body = await res
				.clone()
				.json()
				.catch(() => null);
			const msg =
				body && typeof body === `object` && `message` in body
					? String((body as { message: unknown }).message)
					: `Account deletion failed — contact support.`;
			const narrowStatus: 400 | 401 | 500 =
				res.status === 401 ? 401 : res.status === 400 ? 400 : 500;
			return message(form, msg, { status: narrowStatus });
		}

		redirect(303, `/`);
	},
};
