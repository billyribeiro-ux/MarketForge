import { defineConfig, devices } from '@playwright/test';

/**
 * CI uses 5173 (free on GitHub runners). Local default 4173 avoids colliding with `vite dev`.
 * Override with PLAYWRIGHT_TEST_PORT.
 */
const port = Number(
	process.env.PLAYWRIGHT_TEST_PORT ?? (process.env.CI ? 5173 : 4173),
);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
	testDir: `tests/e2e`,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : 2,
	reporter: `list`,
	use: {
		baseURL,
		trace: `on-first-retry`,
	},
	projects: [{ name: `chromium`, use: { ...devices[`Desktop Chrome`] } }],
	webServer: {
		command: `pnpm exec vite dev --port ${port}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
		env: {
			...process.env,
			PUBLIC_APP_URL: baseURL,
			BETTER_AUTH_URL: baseURL,
			MARKETFORGE_E2E: `1`,
		},
	},
});
