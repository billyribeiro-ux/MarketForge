import { sql } from 'drizzle-orm';
import type { Component } from 'svelte';
import { render } from 'svelte/server';

import { db } from '$lib/server/db';
import { type EmailOutboxPayload, emailOutbox } from '$lib/server/db/schema';
import { sendTransactionalEmail } from '$lib/server/email/auth-emails';
import { logger } from '$lib/server/logger';

import type { DbOrTx } from './db/tx';

export interface EnqueueOptions {
	maxAttempts?: number;
	/** Schedule the first send attempt; defaults to `now`. */
	sendAt?: Date;
}

/**
 * Enqueue a prerendered email for durable delivery.
 *
 * Callers typically call this inside a larger business transaction so the
 * email only goes out when the transaction commits — Stripe webhooks are
 * the motivating case. The dispatcher handles retries with exponential
 * backoff and moves rows to `dead` after `max_attempts` failures.
 */
export async function enqueueEmail(
	executor: DbOrTx,
	payload: EmailOutboxPayload,
	opts: EnqueueOptions = {},
): Promise<string> {
	const [row] = await executor
		.insert(emailOutbox)
		.values({
			kind: `email`,
			payload,
			maxAttempts: opts.maxAttempts ?? 5,
			nextAttemptAt: opts.sendAt ?? new Date(),
		})
		.returning({ id: emailOutbox.id });

	if (!row) throw new Error(`email outbox enqueue returned no row`);
	return row.id;
}

/**
 * Enqueue a Svelte email template, rendered at enqueue time so in-flight
 * rows are immune to template changes. Prefer this over raw-HTML enqueue.
 */
export async function enqueueRenderedEmail<
	TProps extends Record<string, unknown>,
>(
	executor: DbOrTx,
	Template: Component<TProps>,
	props: TProps,
	envelope: { to: string; subject: string; replyTo?: string },
	opts?: EnqueueOptions,
): Promise<string> {
	const { body } = render(Template, { props });
	return enqueueEmail(
		executor,
		{
			to: envelope.to,
			subject: envelope.subject,
			html: body,
			...(envelope.replyTo ? { replyTo: envelope.replyTo } : {}),
		},
		opts,
	);
}

type ClaimedRow = {
	id: string;
	payload: EmailOutboxPayload;
	attempts: number;
	max_attempts: number;
} & Record<string, unknown>;

export interface DrainResult {
	claimed: number;
	sent: number;
	retried: number;
	dead: number;
}

/**
 * Claim up to `batchSize` pending rows atomically and attempt delivery on
 * each. Safe to run concurrently — `FOR UPDATE SKIP LOCKED` guarantees that
 * two drainers never pick up the same row, and the claim UPDATE increments
 * `attempts` before we ever call the email provider so a crash during send
 * still counts as an attempt.
 */
export async function drainOutbox(
	opts: { batchSize?: number } = {},
): Promise<DrainResult> {
	const batchSize = opts.batchSize ?? 25;
	const result: DrainResult = { claimed: 0, sent: 0, retried: 0, dead: 0 };

	const claimed = await db.execute<ClaimedRow>(sql`
		WITH claim AS (
			SELECT id FROM email_outbox
			WHERE status = 'pending' AND next_attempt_at <= now()
			ORDER BY next_attempt_at
			LIMIT ${batchSize}
			FOR UPDATE SKIP LOCKED
		)
		UPDATE email_outbox AS o
		SET attempts = o.attempts + 1,
			updated_at = now(),
			-- Exponential backoff: 30s, 1m, 2m, 4m, 8m, … — bumps start with the
			-- *new* attempt count, so the very first retry is 30s out.
			next_attempt_at = now() + (interval '30 seconds' * power(2, o.attempts))
		WHERE o.id IN (SELECT id FROM claim)
		RETURNING o.id, o.payload, o.attempts, o.max_attempts
	`);

	const rows = claimed as unknown as ClaimedRow[];
	result.claimed = rows.length;
	if (rows.length === 0) return result;

	for (const row of rows) {
		try {
			await sendTransactionalEmail(row.payload);
			await db.execute(sql`
				UPDATE email_outbox
				SET status = 'sent', sent_at = now(), updated_at = now()
				WHERE id = ${row.id}
			`);
			result.sent += 1;
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			const exhausted = row.attempts >= row.max_attempts;
			if (exhausted) {
				await db.execute(sql`
					UPDATE email_outbox
					SET status = 'dead', last_error = ${e.message}, updated_at = now()
					WHERE id = ${row.id}
				`);
				result.dead += 1;
				logger.error(
					{ err: e, id: row.id, attempts: row.attempts },
					`email outbox row moved to dead letter`,
				);
			} else {
				await db.execute(sql`
					UPDATE email_outbox
					SET last_error = ${e.message}, updated_at = now()
					WHERE id = ${row.id}
				`);
				result.retried += 1;
				logger.warn(
					{ err: e, id: row.id, attempts: row.attempts },
					`email outbox row failed; will retry`,
				);
			}
		}
	}

	return result;
}
