import { error } from '@sveltejs/kit';

import { DEV_PERSONA_EMAIL, isDevPersonaSlug } from '$lib/server/dev-personas';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!import.meta.env.DEV) error(404);
	const slug = event.params.persona;
	if (!isDevPersonaSlug(slug)) error(404);

	const password = process.env.DEV_TEST_PASSWORD?.trim();
	if (!password) error(500, `DEV_TEST_PASSWORD is not set`);

	const email = DEV_PERSONA_EMAIL[slug];
	const res = await event.fetch(`/api/auth/sign-in/email`, {
		method: `POST`,
		headers: { 'Content-Type': `application/json` },
		body: JSON.stringify({
			email,
			password,
			rememberMe: true,
		}),
	});

	if (!res.ok) {
		error(400, await res.text());
	}

	const headers = new Headers({ Location: `/app` });
	const withGetSet = res.headers as Headers & { getSetCookie?: () => string[] };
	const cookies =
		typeof withGetSet.getSetCookie === `function`
			? withGetSet.getSetCookie()
			: [];
	if (cookies.length > 0) {
		for (const c of cookies) headers.append(`Set-Cookie`, c);
	} else {
		const single = res.headers.get(`set-cookie`);
		if (single) headers.append(`Set-Cookie`, single);
	}

	return new Response(null, { status: 303, headers });
};
