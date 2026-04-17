export type AuthTier = `anonymous` | `authed` | `entitled` | `admin`;

export type EntitlementKey =
	| `pro_access`
	| `indicator_vault`
	| `live_room`
	| `admin`;
