import { describe, expect, it } from 'vitest';

import { safeRedirectPath } from './safe-redirect';

describe(`safeRedirectPath`, () => {
	it(`returns the fallback when value is missing or non-string`, () => {
		expect(safeRedirectPath(null)).toBe(`/app`);
		expect(safeRedirectPath(undefined)).toBe(`/app`);
		expect(safeRedirectPath(123)).toBe(`/app`);
		expect(safeRedirectPath(``)).toBe(`/app`);
	});

	it(`returns the path when it is a local absolute path`, () => {
		expect(safeRedirectPath(`/courses`)).toBe(`/courses`);
		expect(safeRedirectPath(`/app/dashboard?tab=overview`)).toBe(
			`/app/dashboard?tab=overview`,
		);
	});

	it(`rejects external absolute URLs`, () => {
		expect(safeRedirectPath(`https://evil.com`)).toBe(`/app`);
		expect(safeRedirectPath(`http://evil.com/login`)).toBe(`/app`);
	});

	it(`rejects protocol-relative URLs (open-redirect classic)`, () => {
		expect(safeRedirectPath(`//evil.com`)).toBe(`/app`);
		expect(safeRedirectPath(`//evil.com/app`)).toBe(`/app`);
	});

	it(`rejects backslash-prefixed paths that some browsers normalize`, () => {
		expect(safeRedirectPath(`/\\evil.com`)).toBe(`/app`);
	});

	it(`honors a custom fallback`, () => {
		expect(safeRedirectPath(null, `/`)).toBe(`/`);
		expect(safeRedirectPath(`//evil.com`, `/home`)).toBe(`/home`);
	});
});
