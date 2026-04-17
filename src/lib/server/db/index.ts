import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

/**
 * `vite build` runs SvelteKit analysis without a real DB. The `build` npm script sets
 * `SVELTEKIT_BUILD_PLACEHOLDER_DB=1` so this module can load. `tsx` scripts (seed, migrate)
 * never set that flag and must provide `DATABASE_URL`.
 */
const connectionString =
	process.env.DATABASE_URL?.trim() ||
	(process.env.SVELTEKIT_BUILD_PLACEHOLDER_DB === `1`
		? `postgresql://127.0.0.1:5432/__sveltekit_build__`
		: undefined);
if (!connectionString) {
	throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, { prepare: false, max: 10 });

export const db = drizzle(client, { schema });

export type Db = typeof db;
