/** Dev-only persona slugs for `/dev/login-as/:persona` and `scripts/seed-dev.ts`. */
export const AUTH_PERSONA_SLUGS = [
	`free`,
	`pro`,
	`pro-expired`,
	`trial`,
	`admin`,
	`banned`,
] as const;

export const BILLING_PERSONA_SLUGS = [
	`sub-monthly-active`,
	`sub-monthly-cancelled-still-active`,
	`sub-monthly-past-due`,
	`sub-quarterly-active`,
	`sub-yearly-active`,
	`sub-yearly-trial`,
	`sub-yearly-trial-expiring-tomorrow`,
	`sub-yearly-trial-no-card`,
	`purchase-lifetime`,
	`purchase-lifetime-refunded`,
	`purchase-lifetime-disputed`,
	`upgrade-monthly-to-yearly`,
] as const;

export const DEV_PERSONA_SLUGS = [
	...AUTH_PERSONA_SLUGS,
	...BILLING_PERSONA_SLUGS,
] as const;

export type AuthPersonaSlug = (typeof AUTH_PERSONA_SLUGS)[number];
export type BillingPersonaSlug = (typeof BILLING_PERSONA_SLUGS)[number];
export type DevPersonaSlug = (typeof DEV_PERSONA_SLUGS)[number];

function buildEmails(): Record<DevPersonaSlug, string> {
	const out = {} as Record<DevPersonaSlug, string>;
	for (const slug of AUTH_PERSONA_SLUGS) {
		out[slug] = `${slug}@test.dev`;
	}
	for (const slug of BILLING_PERSONA_SLUGS) {
		out[slug] = `${slug}@test.dev`;
	}
	return out;
}

export const DEV_PERSONA_EMAIL: Record<DevPersonaSlug, string> = buildEmails();

export function isDevPersonaSlug(s: string): s is DevPersonaSlug {
	return (DEV_PERSONA_SLUGS as readonly string[]).includes(s);
}
