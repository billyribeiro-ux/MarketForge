import { expect, test } from '@playwright/test';

test.describe(`dev personas (vite dev only)`, () => {
	test(`free user sees indicator vault upgrade prompt`, async ({ page }) => {
		await page.goto(`/dev/login-as/free`, { waitUntil: `load` });
		await expect(page).toHaveURL(/\/app/);
		await page.goto(`/indicators`, { waitUntil: `load` });
		await expect(
			page.getByRole(`heading`, { name: /Indicator Vault/i }),
		).toBeVisible();
	});

	test(`yearly subscriber sees indicator list`, async ({ page }) => {
		await page.goto(`/dev/login-as/sub-yearly-active`, { waitUntil: `load` });
		await expect(page).toHaveURL(/\/app/);
		await page.goto(`/indicators`, { waitUntil: `load` });
		await expect(
			page.getByRole(`heading`, { name: `Indicator Vault`, level: 1 }),
		).toBeVisible();
	});

	test(`non-admin is redirected away from admin`, async ({ page }) => {
		await page.goto(`/dev/login-as/pro`, { waitUntil: `load` });
		await expect(page).toHaveURL(/\/app/);
		await page.goto(`/admin/users`, { waitUntil: `load` });
		await expect(page).toHaveURL(/\/app\/?$/, { timeout: 15_000 });
	});
});
