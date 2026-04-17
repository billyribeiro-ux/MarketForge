import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { render } from 'svelte/server';
import { getRequestEvent } from '$app/server';

import { db } from '$lib/server/db';
import { betterAuthAdapterSchema } from '$lib/server/db/schema';
import { sendTransactionalEmail } from '$lib/server/email/auth-emails';
import { sendWelcomeEmail } from '$lib/server/email/billing-emails';
import ResetPasswordEmail from '$lib/server/email/templates/ResetPasswordEmail.svelte';
import VerifyEmail from '$lib/server/email/templates/VerifyEmail.svelte';

const publicOrigin = (
	process.env.PUBLIC_APP_URL ?? `http://localhost:5173`
).replace(/\/$/, ``);
const authBaseUrl = (process.env.BETTER_AUTH_URL ?? publicOrigin).replace(
	/\/$/,
	``,
);

function rpIdFromOrigin(origin: string): string {
	try {
		return new URL(origin).hostname;
	} catch {
		return `localhost`;
	}
}

export const auth = betterAuth({
	baseURL: authBaseUrl,
	secret: process.env.BETTER_AUTH_SECRET ?? ``,
	// Brute-force mitigation on /api/auth/*. Memory storage is correct for a
	// single-process deployment (our current adapter-auto target); for
	// horizontally scaled / serverless deploys, swap to `secondaryStorage`
	// backed by Redis or add a `rate_limit` table to the Drizzle schema and
	// use `storage: 'database'`. Per-path overrides tighten the hot paths
	// that attackers actually target.
	rateLimit: {
		enabled: true,
		storage: `memory`,
		window: 60,
		max: 60,
		customRules: {
			'/sign-in/email': { window: 60, max: 5 },
			'/sign-up/email': { window: 60, max: 3 },
			'/forget-password': { window: 60 * 10, max: 3 },
			'/reset-password': { window: 60 * 10, max: 5 },
			'/two-factor/enable': { window: 60, max: 5 },
			'/two-factor/verify': { window: 60, max: 10 },
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					if (!user.email) return;
					void sendWelcomeEmail({ to: user.email, name: user.name });
				},
			},
		},
	},
	database: drizzleAdapter(db, {
		provider: `pg`,
		schema: betterAuthAdapterSchema,
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			const { body } = render(ResetPasswordEmail, {
				props: { name: user.name, url },
			});
			await sendTransactionalEmail({
				to: user.email,
				subject: `Reset your MarketForge password`,
				html: body,
			});
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			const { body } = render(VerifyEmail, { props: { name: user.name, url } });
			await sendTransactionalEmail({
				to: user.email,
				subject: `Verify your MarketForge email`,
				html: body,
			});
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24,
		cookieCache: { enabled: true, maxAge: 5 * 60 },
	},
	user: {
		additionalFields: {
			banned: {
				type: `boolean`,
				defaultValue: false,
				required: false,
				input: false,
			},
			stripeCustomerId: {
				type: `string`,
				required: false,
			},
		},
		deleteUser: {
			enabled: true,
		},
		changeEmail: {
			enabled: true,
		},
	},
	plugins: [
		twoFactor(),
		passkey({
			rpID: rpIdFromOrigin(publicOrigin),
			rpName: `MarketForge`,
			origin: [publicOrigin],
		}),
		sveltekitCookies(getRequestEvent),
	],
	trustedOrigins: [publicOrigin],
});
