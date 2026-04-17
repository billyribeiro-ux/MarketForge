import { describe, expect, it } from 'vitest';

describe(`MSW test server`, () => {
	it(`responds to a registered handler`, async () => {
		const res = await fetch(`https://example.com/__msw_health`);
		expect(res.ok).toBe(true);
		await expect(res.json()).resolves.toEqual({ ok: true });
	});
});
