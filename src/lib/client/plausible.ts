import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

declare global {
	interface Window {
		plausible?: (
			event: string,
			options?: { props?: Record<string, string | number | boolean> },
		) => void;
	}
}

/** Fire a Plausible custom event when the script is loaded and domain is configured. */
export function trackPlausible(
	event: string,
	props?: Record<string, string | number | boolean>,
): void {
	if (!browser) return;
	const domain = env.PUBLIC_PLAUSIBLE_DOMAIN?.trim();
	if (!domain) return;
	window.plausible?.(event, props ? { props } : undefined);
}
