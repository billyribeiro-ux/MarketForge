import { asc, eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { courses } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			slug: courses.slug,
			title: courses.title,
			description: courses.description,
		})
		.from(courses)
		.where(eq(courses.published, true))
		.orderBy(asc(courses.sortOrder), asc(courses.title));

	return { courses: rows };
};
