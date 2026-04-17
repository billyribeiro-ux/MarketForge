import { describe, expect, it } from 'vitest';
import { checkRateLimit } from './rate-limit';

describe(`checkRateLimit`, () => {
	it(`allows up to max hits, then denies`, () => {
		const key = `test:${Math.random()}`;
		const opts = { max: 3, windowMs: 10_000 };
		expect(checkRateLimit(key, opts).ok).toBe(true);
		expect(checkRateLimit(key, opts).ok).toBe(true);
		expect(checkRateLimit(key, opts).ok).toBe(true);
		const denied = checkRateLimit(key, opts);
		expect(denied.ok).toBe(false);
		if (!denied.ok) expect(denied.retryAfterMs).toBeGreaterThan(0);
	});

	it(`reports remaining budget accurately`, () => {
		const key = `test-remaining:${Math.random()}`;
		const opts = { max: 2, windowMs: 10_000 };
		const first = checkRateLimit(key, opts);
		const second = checkRateLimit(key, opts);
		if (first.ok) expect(first.remaining).toBe(1);
		if (second.ok) expect(second.remaining).toBe(0);
	});

	it(`isolates keys`, () => {
		const a = `iso-a:${Math.random()}`;
		const b = `iso-b:${Math.random()}`;
		const opts = { max: 1, windowMs: 10_000 };
		expect(checkRateLimit(a, opts).ok).toBe(true);
		expect(checkRateLimit(a, opts).ok).toBe(false);
		expect(checkRateLimit(b, opts).ok).toBe(true);
	});
});
