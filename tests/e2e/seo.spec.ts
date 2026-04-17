import { expect, test } from '@playwright/test';

test(`sitemap.xml is served as XML`, async ({ request }) => {
	const res = await request.get(`/sitemap.xml`);
	expect(res.ok()).toBeTruthy();
	expect(res.headers()[`content-type`] ?? ``).toMatch(/xml/i);
	const text = await res.text();
	expect(text).toContain(`<urlset`);
});

test(`robots.txt is served`, async ({ request }) => {
	const res = await request.get(`/robots.txt`);
	expect(res.ok()).toBeTruthy();
	const text = await res.text();
	expect(text.toLowerCase()).toContain(`user-agent`);
});
