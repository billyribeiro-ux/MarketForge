import { expect, test } from '@playwright/test';

test.describe(`entitlement gates`, () => {
	test(`yearly subscriber sees live room upgrade prompt`, async ({ page }) => {
		await page.goto(`/dev/login-as/sub-yearly-active`, { waitUntil: `load` });
		await expect(page).toHaveURL(/\/app/);
		await page.goto(`/live`, { waitUntil: `load` });
		await expect(
			page.getByRole(`heading`, { name: `Live Room`, level: 2 }),
		).toBeVisible();
		await expect(page.getByRole(`link`, { name: /Upgrade/i })).toBeVisible();
	});

	test(`lifetime user sees live room content`, async ({ page }) => {
		await page.goto(`/dev/login-as/purchase-lifetime`, { waitUntil: `load` });
		await expect(page).toHaveURL(/\/app/);
		await page.goto(`/live`, { waitUntil: `load` });
		await expect(
			page.getByRole(`heading`, { name: `Live Room`, level: 1 }),
		).toBeVisible();
		await expect(
			page.getByText(
				/When a session is live, the broadcast appears in the player below/i,
			),
		).toBeVisible();
	});
});
