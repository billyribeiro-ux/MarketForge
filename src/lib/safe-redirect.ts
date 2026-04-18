/**
 * Validates an attacker-controllable "next" path so it can only redirect the
 * user to an in-app location. Rejects:
 *
 *  - non-strings / missing values
 *  - absolute URLs (e.g. `https://evil.com`)
 *  - protocol-relative URLs (e.g. `//evil.com`, which pass a naive `startsWith('/')` check)
 *  - backslash-prefixed URLs (e.g. `/\\evil.com`, which some browsers normalize)
 *
 * Use on both sides of a redirect loop — the `load` that seeds the form
 * default AND the action that performs the redirect — so the value can never
 * be smuggled past one of them.
 */
export function safeRedirectPath(raw: unknown, fallback = `/app`): string {
	if (typeof raw !== `string` || raw.length === 0) return fallback;
	if (!raw.startsWith(`/`)) return fallback;
	if (raw.startsWith(`//`)) return fallback;
	if (raw.startsWith(`/\\`)) return fallback;
	return raw;
}
