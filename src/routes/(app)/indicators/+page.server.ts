import { asc, eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { indicators } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			slug: indicators.slug,
			title: indicators.title,
			description: indicators.description,
		})
		.from(indicators)
		.where(eq(indicators.published, true))
		.orderBy(asc(indicators.sortOrder), asc(indicators.title));

	return { indicators: rows };
};
