import { fail, redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { PUBLIC_APP_URL } from '$env/static/public';

import { signupFormSchema } from '$lib/validation/auth-forms';

import type { Actions, PageServerLoad } from './$types';

const origin = PUBLIC_APP_URL.replace(/\/$/, ``);

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(signupFormSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await superValidate(request, zod4(signupFormSchema));
		if (!form.valid) return fail(400, { form });

		const res = await fetch(`/api/auth/sign-up/email`, {
			method: `POST`,
			headers: { 'Content-Type': `application/json` },
			body: JSON.stringify({
				name: form.data.name,
				email: form.data.email,
				password: form.data.password,
				callbackURL: `${origin}/`,
				rememberMe: true,
			}),
		});

		if (!res.ok) {
			const body = (await res.json().catch(() => null)) as {
				message?: string;
			} | null;
			return message(form, body?.message ?? `Could not create account`, {
				status: 400,
			});
		}

		redirect(303, `/verify-email?created=1`);
	},
};
