import { building } from '$app/environment';
import { logger } from '$lib/server/logger';
import { drainOutbox } from '$lib/server/outbox';

/**
 * Portable outbox dispatcher.
 *
 * Two drive surfaces are supported:
 *
 *  1. **Long-running Node** (docker, VM, adapter-node): `startOutboxTicker()`
 *     is called from `hooks.server.ts` at boot and kicks a periodic drain.
 *     `requestOutboxDrain()` wakes it immediately for latency-sensitive
 *     cases like a just-committed Stripe webhook.
 *
 *  2. **Serverless** (Vercel, Cloudflare, Netlify): platforms invoke
 *     `/api/cron/outbox` on a schedule — that endpoint calls
 *     `drainOutboxOnce()` directly.
 *
 * Both paths call the same `drainOutbox` and share the same retry semantics.
 */

const DRAIN_INTERVAL_MS = 15_000;
const STARTED_SYMBOL = Symbol.for(`marketforge.outbox.dispatcher`);
// biome-ignore lint/suspicious/noExplicitAny: module-scope singleton latch
const globalState = globalThis as any;

interface TickerState {
	timer: ReturnType<typeof setTimeout> | null;
	inFlight: boolean;
	pendingKick: boolean;
}

let lastDbUnreachableLogMs = 0;
const DB_UNREACHABLE_LOG_INTERVAL_MS = 60_000;

function isDbUnreachable(err: unknown): boolean {
	let e: unknown = err;
	const seen = new Set<unknown>();
	while (e instanceof Error && !seen.has(e)) {
		seen.add(e);
		if (e instanceof AggregateError) {
			for (const sub of e.errors) {
				if ((sub as NodeJS.ErrnoException).code === `ECONNREFUSED`) return true;
			}
		}
		const code = (e as NodeJS.ErrnoException).code;
		if (code === `ECONNREFUSED` || code === `ENOTFOUND`) return true;
		const cause = (e as Error & { cause?: unknown }).cause;
		if (cause instanceof AggregateError) {
			for (const sub of cause.errors) {
				if ((sub as NodeJS.ErrnoException).code === `ECONNREFUSED`) return true;
			}
		}
		e = cause;
	}
	return false;
}

function getState(): TickerState {
	if (!globalState[STARTED_SYMBOL]) {
		globalState[STARTED_SYMBOL] = {
			timer: null,
			inFlight: false,
			pendingKick: false,
		} satisfies TickerState;
	}
	return globalState[STARTED_SYMBOL] as TickerState;
}

async function runOnce(): Promise<void> {
	const state = getState();
	if (state.inFlight) {
		state.pendingKick = true;
		return;
	}
	state.inFlight = true;
	try {
		const result = await drainOutbox();
		if (result.claimed > 0) {
			logger.debug(result, `outbox drain tick`);
		}
	} catch (err) {
		const e = err instanceof Error ? err : new Error(String(err));
		if (isDbUnreachable(err)) {
			const now = Date.now();
			if (now - lastDbUnreachableLogMs >= DB_UNREACHABLE_LOG_INTERVAL_MS) {
				lastDbUnreachableLogMs = now;
				logger.warn(
					{ err: e },
					`outbox dispatcher tick skipped: database unreachable (e.g. run docker compose up -d)`,
				);
			}
		} else {
			logger.error({ err: e }, `outbox dispatcher tick failed`);
		}
	} finally {
		state.inFlight = false;
		if (state.pendingKick) {
			state.pendingKick = false;
			// Re-enter on next microtask to avoid unbounded recursion.
			queueMicrotask(() => void runOnce());
		}
	}
}

/** Start the periodic drain. Idempotent across HMR and Sentry re-imports. */
export function startOutboxTicker(): void {
	if (building) return;
	const state = getState();
	if (state.timer) return;
	state.timer = setInterval(() => void runOnce(), DRAIN_INTERVAL_MS);
	// Don't keep the process alive solely for the dispatcher during test tear-downs.
	if (typeof state.timer === `object` && `unref` in state.timer) {
		(state.timer as { unref?: () => void }).unref?.();
	}
	logger.info({ intervalMs: DRAIN_INTERVAL_MS }, `outbox dispatcher started`);
}

/**
 * Nudge the dispatcher to drain immediately. No-op if a drain is already in
 * flight — the current run re-enters automatically when it finishes.
 */
export function requestOutboxDrain(): void {
	void runOnce();
}

/** One-shot drain used by the cron endpoint. Returns the drain result. */
export async function drainOutboxOnce(): Promise<
	ReturnType<typeof drainOutbox>
> {
	return drainOutbox();
}
