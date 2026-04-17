import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { Marked } from 'marked';

import {
	loadCourseManifest,
	loadLessonMarkdown,
} from '$lib/server/courses/load-manifest';
import { db } from '$lib/server/db';
import { courseProgress, courses } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

// Lesson markdown is authored by staff and checked into the repo, but raw HTML
// tokens are still dropped — defence-in-depth for the `{@html}` render downstream.
const lessonMarked = new Marked({ gfm: true, breaks: false, async: true });
lessonMarked.use({
	renderer: {
		html() {
			return ``;
		},
	},
});

export const load: PageServerLoad = async ({ params, locals }) => {
	const [course] = await db
		.select()
		.from(courses)
		.where(eq(courses.slug, params.slug))
		.limit(1);

	if (!course?.published) error(404, `Course not found`);

	const manifest = await loadCourseManifest(params.slug);
	const lesson = manifest?.lessons.find((l) => l.slug === params.lesson);
	if (!manifest || !lesson) error(404, `Lesson not found`);

	const md = await loadLessonMarkdown(params.slug, lesson.file);
	if (!md) error(500, `Lesson file missing`);

	const html = await lessonMarked.parse(md);

	let progress: { completedAt: Date | null; progressPercent: number } | null =
		null;
	if (locals.user) {
		const [row] = await db
			.select({
				completedAt: courseProgress.completedAt,
				progressPercent: courseProgress.progressPercent,
			})
			.from(courseProgress)
			.where(
				and(
					eq(courseProgress.userId, locals.user.id),
					eq(courseProgress.courseId, course.id),
					eq(courseProgress.lessonSlug, lesson.slug),
				),
			)
			.limit(1);
		progress = row ?? null;
	}

	return {
		course: { slug: course.slug, title: course.title },
		lesson: { slug: lesson.slug, title: lesson.title },
		manifest,
		html,
		progress,
	};
};

export const actions: Actions = {
	markComplete: async ({ locals, params }) => {
		if (!locals.user) return fail(401, { message: `Unauthorized` });
		if (!locals.entitlementKeys.includes(`pro_access`))
			return fail(403, { message: `Forbidden` });

		const [course] = await db
			.select()
			.from(courses)
			.where(eq(courses.slug, params.slug))
			.limit(1);
		if (!course?.published) return fail(404, { message: `Not found` });

		const manifest = await loadCourseManifest(params.slug);
		const lesson = manifest?.lessons.find((l) => l.slug === params.lesson);
		if (!lesson) return fail(404, { message: `Not found` });

		const now = new Date();
		await db
			.insert(courseProgress)
			.values({
				userId: locals.user.id,
				courseId: course.id,
				lessonSlug: lesson.slug,
				completedAt: now,
				progressPercent: 100,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [
					courseProgress.userId,
					courseProgress.courseId,
					courseProgress.lessonSlug,
				],
				set: {
					completedAt: now,
					progressPercent: 100,
					updatedAt: now,
				},
			});

		return { success: true };
	},
	nextLesson: async ({ params }) => {
		const manifest = await loadCourseManifest(params.slug);
		if (!manifest) return fail(404);
		const idx = manifest.lessons.findIndex((l) => l.slug === params.lesson);
		const next = manifest.lessons[idx + 1];
		if (next) {
			redirect(303, `/courses/${params.slug}/${next.slug}`);
		}
		redirect(303, `/courses`);
	},
};
