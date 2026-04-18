import { fail, redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';

import { safeRedirectPath } from '$lib/safe-redirect';
import { loginFormSchema } from '$lib/validation/auth-forms';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const redirectTo = safeRedirectPath(url.searchParams.get(`redirect`));
	const form = await superValidate(zod4(loginFormSchema), {
		defaults: { email: ``, password: ``, redirectTo },
	});
	return { form };
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await superValidate(request, zod4(loginFormSchema));
		if (!form.valid) return fail(400, { form });

		const res = await fetch(`/api/auth/sign-in/email`, {
			method: `POST`,
			headers: { 'Content-Type': `application/json` },
			body: JSON.stringify({
				email: form.data.email,
				password: form.data.password,
				rememberMe: true,
			}),
		});

		if (!res.ok) {
			return message(form, `Invalid email or password`, { status: 401 });
		}

		redirect(303, safeRedirectPath(form.data.redirectTo));
	},
};
