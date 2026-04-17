import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
config({ path: resolve(repoRoot, '.env.local') });
config({ path: resolve(repoRoot, '.env') });

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
	throw new Error('db-migrate: DATABASE_URL is required');
}

const sql = postgres(connectionString, { max: 1, prepare: false });
const db = drizzle(sql);

try {
	await migrate(db, { migrationsFolder: resolve(repoRoot, 'drizzle') });
} finally {
	await sql.end({ timeout: 5 });
}

console.info('db-migrate: applied pending migrations');
