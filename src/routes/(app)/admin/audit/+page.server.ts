import { desc } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { auditLog } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select()
		.from(auditLog)
		.orderBy(desc(auditLog.createdAt))
		.limit(100);

	return { entries: rows };
};
