import type { Session, User } from 'better-auth/types';

import type { AuthTier, EntitlementKey } from '$lib/types/auth';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
			user:
				| (User & {
						banned?: boolean;
						stripeCustomerId?: string | null;
						twoFactorEnabled?: boolean;
				  })
				| null;
			entitlementKeys: EntitlementKey[];
			authTier: AuthTier;
		}
	}
}
