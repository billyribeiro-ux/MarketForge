/** Canonical public origin for Stripe redirect URLs (no trailing slash). */
export function getPublicAppUrl(): string {
	return (process.env.PUBLIC_APP_URL ?? `http://localhost:5173`).replace(
		/\/$/,
		``,
	);
}
