import { asc, ilike, or } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get(`q`)?.trim() ?? ``;
	const pattern = `%${q}%`;

	const rows = q
		? await db
				.select({
					id: users.id,
					email: users.email,
					name: users.name,
					banned: users.banned,
				})
				.from(users)
				.where(or(ilike(users.email, pattern), ilike(users.name, pattern)))
				.orderBy(asc(users.email))
				.limit(80)
		: await db
				.select({
					id: users.id,
					email: users.email,
					name: users.name,
					banned: users.banned,
				})
				.from(users)
				.orderBy(asc(users.email))
				.limit(80);

	return { users: rows, q };
};
