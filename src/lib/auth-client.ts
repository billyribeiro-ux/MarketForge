import { passkeyClient } from '@better-auth/passkey/client';
import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';

import { PUBLIC_APP_URL } from '$env/static/public';

const baseURL = PUBLIC_APP_URL.replace(/\/$/, ``);

export const authClient = createAuthClient({
	baseURL,
	plugins: [twoFactorClient(), passkeyClient()],
});
