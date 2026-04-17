import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { indicators } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [row] = await db
		.select()
		.from(indicators)
		.where(
			and(eq(indicators.slug, params.slug), eq(indicators.published, true)),
		)
		.limit(1);

	if (!row) error(404, `Indicator not found`);

	return { indicator: row };
};
