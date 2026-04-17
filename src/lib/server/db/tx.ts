/** Drizzle transaction client (postgres-js). */
type DbInstance = typeof import('$lib/server/db').db;
export type DbTransaction = Parameters<
	Parameters<DbInstance['transaction']>[0]
>[0];

/**
 * Accepts either the top-level `db` or a transaction client — so callers can
 * enlist writes in an outer transaction (outbox pattern) or fire standalone.
 */
export type DbOrTx = DbInstance | DbTransaction;
