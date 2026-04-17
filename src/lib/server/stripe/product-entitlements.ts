import type { EntitlementKey } from '$lib/types/auth';

/** Mirrors catalog slugs in `scripts/seed-dev.ts`. Yearly adds vault; lifetime adds vault + live room. */
const SLUG_TO_KEYS: Record<string, EntitlementKey[]> = {
	'pro-monthly': [`pro_access`],
	'pro-quarterly': [`pro_access`],
	'pro-yearly': [`pro_access`, `indicator_vault`],
	'pro-lifetime': [`pro_access`, `indicator_vault`, `live_room`],
};

export function entitlementKeysForProductSlug(slug: string): EntitlementKey[] {
	return SLUG_TO_KEYS[slug] ?? [`pro_access`];
}
