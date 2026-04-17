import { Resend } from 'resend';

import { logger } from '$lib/server/logger';

export async function sendTransactionalEmail(params: {
	to: string;
	subject: string;
	html: string;
	replyTo?: string;
}): Promise<void> {
	const key = process.env.RESEND_API_KEY?.trim();
	const from =
		process.env.RESEND_FROM_EMAIL?.trim() ??
		`MarketForge <onboarding@resend.dev>`;

	if (key) {
		const resend = new Resend(key);
		const { error } = await resend.emails.send({
			from,
			to: params.to,
			subject: params.subject,
			html: params.html,
			...(params.replyTo ? { replyTo: params.replyTo } : {}),
		});
		if (error) {
			logger.error({ error }, `Resend request failed`);
		}
		return;
	}

	logger.info(
		{ to: params.to, subject: params.subject, html: params.html },
		`Transactional email (dev — RESEND_API_KEY not set)`,
	);
}
