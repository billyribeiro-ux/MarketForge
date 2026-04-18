import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: import.meta.env.PUBLIC_SENTRY_DSN?.trim() || undefined,
	tracesSampleRate: 0,
	environment: import.meta.env.MODE,
});

/**
 * Svelte Agentation (dev inspector): waits for `data-workspace-root`, then mounts.
 * Production builds resolve the import to a no-op stub (see `vite.config.ts`),
 * but we also guard with `import.meta.env.DEV` so the polling loop itself is
 * dead-code-eliminated from the production bundle — otherwise every page load
 * spins rAF for ~2s before giving up.
 */
export function init(): void {
	if (import.meta.env.DEV) {
		void startAgentationWhenReady();
	}
}

export const handleError = Sentry.handleErrorWithSentry();

async function startAgentationWhenReady(): Promise<void> {
	const el = document.documentElement;
	for (let i = 0; i < 120; i++) {
		const root = el.getAttribute('data-workspace-root');
		if (typeof root === 'string' && root.length > 0) {
			const { mountAgentationInspector } = await import(
				'$lib/dev/agentation-client'
			);
			mountAgentationInspector(root);
			return;
		}
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => resolve());
		});
	}
}
