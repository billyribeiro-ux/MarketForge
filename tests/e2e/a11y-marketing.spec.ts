import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe(`marketing accessibility`, () => {
	for (const path of [
		`/`,
		`/pricing`,
		`/about`,
		`/contact`,
		`/support`,
		`/terms`,
		`/privacy`,
		`/refund-policy`,
		`/cookie-notice`,
	]) {
		test(`${path} has no serious axe violations`, async ({ page }) => {
			await page.goto(path);
			const results = await new AxeBuilder({ page }).analyze();
			expect(
				results.violations,
				JSON.stringify(results.violations, null, 2),
			).toEqual([]);
		});
	}
});
