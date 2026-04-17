import { expect, test } from '@playwright/test';

test.describe(`auth`, () => {
	test(`login with wrong password shows generic error`, async ({ page }) => {
		await page.goto(`/login`);
		await page.getByLabel(`Email`, { exact: true }).fill(`free@test.dev`);
		await page
			.getByLabel(`Password`, { exact: true })
			.fill(`definitely-not-the-seed-password`);
		await page.getByRole(`button`, { name: /Continue/i }).click();
		await expect(page.getByRole(`alert`)).toContainText(
			/Invalid email or password/i,
		);
		await expect(page).toHaveURL(/\/login/);
	});

	test(`banned persona is redirected to /banned`, async ({ page }) => {
		await page.goto(`/dev/login-as/banned`);
		await expect(page).toHaveURL(/\/banned/);
		await expect(
			page.getByRole(`heading`, { name: /Account suspended/i, level: 1 }),
		).toBeVisible();
	});
});
