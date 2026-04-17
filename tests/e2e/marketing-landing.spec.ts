import { expect, test } from '@playwright/test';

test(`marketing home loads`, async ({ page }) => {
	await page.goto(`/`);
	await expect(page.getByRole(`heading`, { level: 1 })).toContainText(
		`Trade with a clearer playbook`,
	);
});

test(`pricing lists catalog`, async ({ page }) => {
	await page.goto(`/pricing`);
	await expect(page.getByRole(`heading`, { level: 1 })).toContainText(
		`Pricing`,
	);
});
