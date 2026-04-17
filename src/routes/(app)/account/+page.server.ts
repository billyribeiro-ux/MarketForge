import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';

import { db } from '$lib/server/db';
import { auditLog, users } from '$lib/server/db/schema';
import { profileFormSchema } from '$lib/validation/account-forms';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	const form = await superValidate(zod4(profileFormSchema), {
		defaults: { name: user.name },
	});
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: `Unauthorized` });

		const form = await superValidate(request, zod4(profileFormSchema));
		if (!form.valid) return fail(400, { form });

		const name = form.data.name.trim();
		if (name === locals.user.name) {
			return message(form, `No changes to save.`);
		}

		const now = new Date();
		await db.transaction(async (tx) => {
			await tx
				.update(users)
				.set({ name, updatedAt: now })
				.where(eq(users.id, locals.user!.id));

			await tx.insert(auditLog).values({
				actorUserId: locals.user!.id,
				action: `account.profile.update`,
				entityType: `user`,
				entityId: locals.user!.id,
				metadata: { field: `name`, previous: locals.user!.name, next: name },
			});
		});

		return message(form, `Profile updated.`);
	},
};
