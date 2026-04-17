import { redirect } from '@sveltejs/kit';

import type { Actions } from './$types';

export const actions = {
	default: async ({ fetch, request }) => {
		await fetch(`/api/auth/sign-out`, {
			method: `POST`,
			headers: { cookie: request.headers.get(`cookie`) ?? `` },
		});
		redirect(303, `/`);
	},
} satisfies Actions;
