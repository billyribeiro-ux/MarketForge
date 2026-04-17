import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { LIB_CONTENT_ROOT } from '$lib/server/content-paths';
import { logger } from '$lib/server/logger';

export type CourseManifest = {
	slug: string;
	lessons: Array<{ slug: string; title: string; file: string }>;
};

const SLUG_SHAPE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const LESSON_FILE_SHAPE = /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i;

const COURSES_ROOT = resolve(LIB_CONTENT_ROOT, `courses`);

function resolveWithin(base: string, ...segments: string[]): string | null {
	const target = resolve(base, ...segments);
	return target === base || target.startsWith(`${base}/`) ? target : null;
}

function isNotFound(err: unknown): boolean {
	return (
		typeof err === `object` &&
		err !== null &&
		`code` in err &&
		(err as { code?: string }).code === `ENOENT`
	);
}

export async function loadCourseManifest(
	courseSlug: string,
): Promise<CourseManifest | null> {
	if (!SLUG_SHAPE.test(courseSlug)) return null;

	const target = resolveWithin(COURSES_ROOT, courseSlug, `manifest.json`);
	if (!target) return null;

	let raw: string;
	try {
		raw = await readFile(target, `utf8`);
	} catch (err) {
		if (!isNotFound(err)) {
			logger.warn(
				{
					err: err instanceof Error ? err : new Error(String(err)),
					courseSlug,
				},
				`course manifest read failed`,
			);
		}
		return null;
	}

	try {
		return JSON.parse(raw) as CourseManifest;
	} catch (err) {
		logger.error(
			{ err: err instanceof Error ? err : new Error(String(err)), courseSlug },
			`course manifest parse failed`,
		);
		return null;
	}
}

export async function loadLessonMarkdown(
	courseSlug: string,
	lessonFile: string,
): Promise<string | null> {
	if (!SLUG_SHAPE.test(courseSlug)) return null;
	if (!LESSON_FILE_SHAPE.test(lessonFile)) return null;

	const target = resolveWithin(COURSES_ROOT, courseSlug, lessonFile);
	if (!target) return null;

	try {
		return await readFile(target, `utf8`);
	} catch (err) {
		if (!isNotFound(err)) {
			logger.warn(
				{
					err: err instanceof Error ? err : new Error(String(err)),
					courseSlug,
					lessonFile,
				},
				`lesson markdown read failed`,
			);
		}
		return null;
	}
}
