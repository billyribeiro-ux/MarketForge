import { fail, redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';
import { PUBLIC_APP_URL } from '$env/static/public';

import {
	requestResetFormSchema,
	resetPasswordFormSchema,
} from '$lib/validation/auth-forms';

import type { Actions, PageServerLoad } from './$types';

const origin = PUBLIC_APP_URL.replace(/\/$/, ``);

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get(`token`) ?? ``;
	const sent = url.searchParams.get(`sent`) === `1`;
	const requestForm = await superValidate(zod4(requestResetFormSchema), {
		id: `request-reset`,
	});
	const resetForm = await superValidate(zod4(resetPasswordFormSchema), {
		id: `reset-pwd`,
		defaults: { token, newPassword: `` },
	});
	return { requestForm, resetForm, hasToken: token.length > 0, sent };
};

export const actions: Actions = {
	request: async ({ request, fetch, url }) => {
		const token = url.searchParams.get(`token`) ?? ``;
		const resetForm = await superValidate(zod4(resetPasswordFormSchema), {
			id: `reset-pwd`,
			defaults: { token, newPassword: `` },
		});
		const form = await superValidate(request, zod4(requestResetFormSchema), {
			id: `request-reset`,
		});
		if (!form.valid) {
			return fail(400, {
				requestForm: form,
				resetForm,
				hasToken: token.length > 0,
				sent: false,
			});
		}

		const res = await fetch(`/api/auth/request-password-reset`, {
			method: `POST`,
			headers: { 'Content-Type': `application/json` },
			body: JSON.stringify({
				email: form.data.email,
				redirectTo: `${origin}/reset-password`,
			}),
		});

		if (!res.ok) {
			return fail(400, {
				requestForm: form,
				resetForm,
				hasToken: token.length > 0,
				sent: false,
			});
		}

		redirect(303, `/reset-password?sent=1`);
	},
	reset: async ({ request, fetch }) => {
		const requestForm = await superValidate(zod4(requestResetFormSchema), {
			id: `request-reset`,
		});
		const form = await superValidate(request, zod4(resetPasswordFormSchema), {
			id: `reset-pwd`,
		});
		if (!form.valid) {
			return fail(400, {
				requestForm,
				resetForm: form,
				hasToken: true,
				sent: false,
			});
		}

		const res = await fetch(`/api/auth/reset-password`, {
			method: `POST`,
			headers: { 'Content-Type': `application/json` },
			body: JSON.stringify({
				newPassword: form.data.newPassword,
				token: form.data.token,
			}),
		});

		if (!res.ok) {
			return fail(400, {
				requestForm,
				resetForm: form,
				hasToken: true,
				sent: false,
			});
		}

		redirect(303, `/login`);
	},
};
