import { fail } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';

import { sendTransactionalEmail } from '$lib/server/email/auth-emails';
import { logger } from '$lib/server/logger';
import { checkRateLimit, clientIpOf } from '$lib/server/rate-limit';
import {
	CONTACT_MIN_DWELL_MS,
	contactFormSchema,
} from '$lib/validation/contact-form';

import type { Actions, PageServerLoad } from './$types';

const BENIGN_OK = `Thanks — your message was received. We’ll reply by email.`;

function escapeHtml(s: string): string {
	return s
		.replaceAll(`&`, `&amp;`)
		.replaceAll(`<`, `&lt;`)
		.replaceAll(`>`, `&gt;`)
		.replaceAll(`"`, `&quot;`)
		.replaceAll(`'`, `&#39;`);
}

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(contactFormSchema), {
		defaults: {
			name: ``,
			email: ``,
			topic: `general`,
			message: ``,
			website: ``,
			formLoadedAt: 0,
		},
	});
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const ip = clientIpOf(event);
		const limit = checkRateLimit(`contact:${ip}`, {
			max: 5,
			windowMs: 60 * 60 * 1000,
		});
		if (!limit.ok) {
			logger.warn(
				{ ip, retryAfterMs: limit.retryAfterMs },
				`contact form rate-limited`,
			);
			return fail(429, {
				message: `Too many messages. Try again later.`,
			});
		}

		const form = await superValidate(event.request, zod4(contactFormSchema));
		if (!form.valid) return fail(400, { form });

		// Anti-spam: honeypot filled OR submitted too fast after load.
		const now = Date.now();
		const dwellMs =
			typeof form.data.formLoadedAt === `number` && form.data.formLoadedAt > 0
				? now - form.data.formLoadedAt
				: Number.POSITIVE_INFINITY;
		const isBot = form.data.website !== `` || dwellMs < CONTACT_MIN_DWELL_MS;
		if (isBot) {
			logger.warn(
				{
					ip,
					honeypot: form.data.website !== ``,
					dwellMs: Number.isFinite(dwellMs) ? dwellMs : null,
					email: form.data.email,
				},
				`contact form — bot heuristic rejected submission`,
			);
			// Return success-shaped response so bots don't learn what tripped us.
			return message(form, BENIGN_OK);
		}

		const inbox = process.env.MARKETFORGE_CONTACT_INBOX?.trim() ?? ``;
		const topicLabel: Record<string, string> = {
			general: `General inquiry`,
			billing: `Billing & subscriptions`,
			technical: `Technical / platform`,
			partnership: `Partnership or media`,
		};
		const t = topicLabel[form.data.topic] ?? form.data.topic;

		const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5">
<h2>MarketForge contact form</h2>
<p><strong>Topic:</strong> ${escapeHtml(t)}</p>
<p><strong>From:</strong> ${escapeHtml(form.data.name)} &lt;${escapeHtml(form.data.email)}&gt;</p>
<hr />
<pre style="white-space:pre-wrap;font:inherit">${escapeHtml(form.data.message)}</pre>
</body></html>`;

		if (!inbox) {
			logger.info(
				{
					topic: form.data.topic,
					email: form.data.email,
					name: form.data.name,
					messagePreview: form.data.message.slice(0, 500),
				},
				`contact form — set MARKETFORGE_CONTACT_INBOX to deliver via Resend`,
			);
			return message(
				form,
				`Thanks — your message was recorded. In production, set MARKETFORGE_CONTACT_INBOX and RESEND_API_KEY so we can email you back.`,
			);
		}

		await sendTransactionalEmail({
			to: inbox,
			replyTo: form.data.email,
			subject: `[MarketForge] ${t} — ${form.data.name}`,
			html,
		});

		return message(form, BENIGN_OK);
	},
};
