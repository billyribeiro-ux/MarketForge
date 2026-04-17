import { logger } from '$lib/server/logger';

const PLAUSIBLE_EVENT_URL = `https://plausible.io/api/event`;

/**
 * Server-side Plausible custom event (no cookie; useful after webhooks).
 * Requires PUBLIC_PLAUSIBLE_DOMAIN; optional PLAUSIBLE_API_KEY for private dashboards.
 */
export async function trackPlausibleServer(
	name: string,
	props?: Record<string, string | number | boolean>,
): Promise<void> {
	const domain = process.env.PUBLIC_PLAUSIBLE_DOMAIN?.trim();
	if (!domain) return;

	const body = {
		name,
		domain,
		url: `https://${domain}/`,
		...(props && Object.keys(props).length > 0 ? { props: { ...props } } : {}),
	};

	try {
		const headers: Record<string, string> = {
			'Content-Type': `application/json`,
		};
		const key = process.env.PLAUSIBLE_API_KEY?.trim();
		if (key) headers.Authorization = `Bearer ${key}`;

		const res = await fetch(PLAUSIBLE_EVENT_URL, {
			method: `POST`,
			headers,
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			logger.warn(
				{ status: res.status, name },
				`Plausible server event failed`,
			);
		}
	} catch (err) {
		const e = err instanceof Error ? err : new Error(String(err));
		logger.warn({ err: e, name }, `Plausible server event error`);
	}
}
