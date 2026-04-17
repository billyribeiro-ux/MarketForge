import type { RequestEvent } from '@sveltejs/kit';

/**
 * In-process token bucket suitable for single-instance deployments (node
 * adapters). For multi-instance / serverless-with-concurrency you want a
 * shared store — swap `store` for a Redis/Postgres-backed implementation
 * without touching call sites.
 *
 * Keys are free-form (e.g. `contact:${ip}`, `login:${email}`).
 */

type Bucket = { count: number; resetAt: number };

export type RateLimitResult =
	| { ok: true; remaining: number; resetAt: number }
	| { ok: false; retryAfterMs: number; resetAt: number };

export interface RateLimitOptions {
	/** Max hits allowed per window. */
	max: number;
	/** Rolling window size in ms. */
	windowMs: number;
}

interface RateLimitStore {
	check(key: string, opts: RateLimitOptions): RateLimitResult;
}

class MemoryStore implements RateLimitStore {
	private readonly buckets = new Map<string, Bucket>();
	private lastSweepAt = 0;

	check(key: string, opts: RateLimitOptions): RateLimitResult {
		const now = Date.now();
		this.sweepIfStale(now);

		const existing = this.buckets.get(key);
		if (!existing || existing.resetAt <= now) {
			const resetAt = now + opts.windowMs;
			this.buckets.set(key, { count: 1, resetAt });
			return { ok: true, remaining: opts.max - 1, resetAt };
		}

		if (existing.count >= opts.max) {
			return {
				ok: false,
				retryAfterMs: existing.resetAt - now,
				resetAt: existing.resetAt,
			};
		}

		existing.count += 1;
		return {
			ok: true,
			remaining: opts.max - existing.count,
			resetAt: existing.resetAt,
		};
	}

	private sweepIfStale(now: number): void {
		// Cheap periodic cleanup so expired buckets don't accumulate forever.
		if (now - this.lastSweepAt < 60_000) return;
		this.lastSweepAt = now;
		for (const [k, bucket] of this.buckets) {
			if (bucket.resetAt <= now) this.buckets.delete(k);
		}
	}
}

const store: RateLimitStore = new MemoryStore();

/** Check (and consume) one hit against `key`. */
export function checkRateLimit(
	key: string,
	opts: RateLimitOptions,
): RateLimitResult {
	return store.check(key, opts);
}

/**
 * Resolve a client IP from the request event. Trusts standard reverse-proxy
 * headers; callers should be behind a proxy that sets `x-forwarded-for`
 * correctly. Falls back to `getClientAddress()` which respects
 * `trustedProxies` from svelte.config.js.
 */
export function clientIpOf(event: RequestEvent): string {
	try {
		return event.getClientAddress();
	} catch {
		const fwd = event.request.headers.get(`x-forwarded-for`);
		if (fwd) return fwd.split(`,`)[0]?.trim() ?? `unknown`;
		return `unknown`;
	}
}
