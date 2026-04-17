import { render } from 'svelte/server';

import { getPublicAppUrl } from '$lib/server/stripe/public-url';

import { sendTransactionalEmail } from './auth-emails';
import PaymentFailedEmail from './templates/PaymentFailedEmail.svelte';
import PurchaseReceiptEmail from './templates/PurchaseReceiptEmail.svelte';
import RenewalReceiptEmail from './templates/RenewalReceiptEmail.svelte';
import SubscriptionCancelledEmail from './templates/SubscriptionCancelledEmail.svelte';
import SubscriptionStartedEmail from './templates/SubscriptionStartedEmail.svelte';
import TrialEndingEmail from './templates/TrialEndingEmail.svelte';
import WelcomeEmail from './templates/WelcomeEmail.svelte';

export async function sendWelcomeEmail(params: {
	to: string;
	name: string;
}): Promise<void> {
	const appUrl = getPublicAppUrl();
	const { body } = render(WelcomeEmail, {
		props: { name: params.name, appUrl },
	});
	await sendTransactionalEmail({
		to: params.to,
		subject: `Welcome to MarketForge`,
		html: body,
	});
}

export async function sendPurchaseReceiptEmail(params: {
	to: string;
	name: string;
	title: string;
	amountLabel: string;
}): Promise<void> {
	const { body } = render(PurchaseReceiptEmail, {
		props: {
			name: params.name,
			title: params.title,
			amountLabel: params.amountLabel,
		},
	});
	await sendTransactionalEmail({
		to: params.to,
		subject: `Receipt — ${params.title}`,
		html: body,
	});
}

export async function sendSubscriptionStartedEmail(params: {
	to: string;
	name: string;
	planName: string;
	amountLabel: string;
}): Promise<void> {
	const { body } = render(SubscriptionStartedEmail, {
		props: {
			name: params.name,
			planName: params.planName,
			amountLabel: params.amountLabel,
		},
	});
	await sendTransactionalEmail({
		to: params.to,
		subject: `Subscription confirmed — ${params.planName}`,
		html: body,
	});
}

export async function sendRenewalReceiptEmail(params: {
	to: string;
	name: string;
	planName: string;
	amountLabel: string;
}): Promise<void> {
	const { body } = render(RenewalReceiptEmail, {
		props: {
			name: params.name,
			planName: params.planName,
			amountLabel: params.amountLabel,
		},
	});
	await sendTransactionalEmail({
		to: params.to,
		subject: `Renewal receipt — ${params.planName}`,
		html: body,
	});
}

export async function sendPaymentFailedEmail(params: {
	to: string;
	name: string;
}): Promise<void> {
	const { body } = render(PaymentFailedEmail, { props: { name: params.name } });
	await sendTransactionalEmail({
		to: params.to,
		subject: `Action needed — payment failed`,
		html: body,
	});
}

export async function sendTrialEndingEmail(params: {
	to: string;
	name: string;
	trialEndLabel: string;
}): Promise<void> {
	const { body } = render(TrialEndingEmail, {
		props: { name: params.name, trialEndLabel: params.trialEndLabel },
	});
	await sendTransactionalEmail({
		to: params.to,
		subject: `Your MarketForge trial ends soon`,
		html: body,
	});
}

export async function sendSubscriptionCancelledEmail(params: {
	to: string;
	name: string;
}): Promise<void> {
	const { body } = render(SubscriptionCancelledEmail, {
		props: { name: params.name },
	});
	await sendTransactionalEmail({
		to: params.to,
		subject: `Subscription cancelled`,
		html: body,
	});
}
