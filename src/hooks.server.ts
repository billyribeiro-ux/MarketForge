import * as Sentry from '@sentry/sveltekit';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

import { auth } from '$lib/server/auth';
import { loadAuthLocals } from '$lib/server/auth/load-locals';
import { logger } from '$lib/server/logger';
import { startOutboxTicker } from '$lib/server/outbox-dispatcher';

const serverSentryDsn =
	process.env.SENTRY_DSN?.trim() ||
	process.env.PUBLIC_SENTRY_DSN?.trim() ||
	undefined;

Sentry.init({
	dsn: serverSentryDsn,
	tracesSampleRate: 0,
	environment: process.env.NODE_ENV ?? `development`,
});

// Long-running Node deployments benefit from an in-process ticker that
// drains the outbox between cron runs. Safe to call during build — it no-ops.
if (!building) startOutboxTicker();

const handleAuth: Handle = async ({ event, resolve }) => {
	event.locals.session = null;
	event.locals.user = null;
	event.locals.entitlementKeys = [];
	event.locals.authTier = `anonymous`;

	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user as App.Locals['user'];
	}

	await loadAuthLocals(event);

	return svelteKitHandler({ auth, event, resolve, building });
};

export const handle = sequence(Sentry.sentryHandle(), handleAuth);

const logServerError: HandleServerError = ({
	error,
	event,
	status,
	message,
}) => {
	const err = error instanceof Error ? error : new Error(String(error));
	logger.error(
		{
			err,
			path: event.url.pathname,
			status,
			method: event.request.method,
		},
		message ?? err.message,
	);
};

export const handleError = Sentry.handleErrorWithSentry(logServerError);
