import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { loadCourseManifest } from '$lib/server/courses/load-manifest';
import { db } from '$lib/server/db';
import { courses } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [course] = await db
		.select()
		.from(courses)
		.where(eq(courses.slug, params.slug))
		.limit(1);

	if (!course?.published) error(404, `Course not found`);

	const manifest = await loadCourseManifest(params.slug);
	const first = manifest?.lessons[0];
	if (!first) error(500, `Course content not configured`);

	redirect(303, `/courses/${params.slug}/${first.slug}`);
};
