# RESTORE.md

> DB backup + restore procedures. Test before launch.

---

## Backup Policy

| What | Where | Frequency | Retention |
|---|---|---|---|
| Postgres snapshot | Managed provider | Daily 03:00 UTC | 30 days |
| Postgres WAL | Managed provider | Continuous | 7 days PITR |
| Off-site copy | S3/R2 bucket | Daily post-snapshot | 90 days |

Stripe data is Stripe's responsibility — retrievable via API anytime. Not backed up locally.

---

## Local / CI `pg_dump` script

For a portable logical backup (custom format) from any machine with `pg_dump` and `DATABASE_URL`:

```bash
pnpm backup:db
```

Artifacts land in `backups/marketforge-<UTC-timestamp>.dump`. Restore with `pg_restore` to an empty database (see Scenario 3). Add the `backups/` directory to `.gitignore` if you run this locally — do not commit dumps.

---

## Restore Scenarios

### Scenario 1: Point-in-Time Recovery (PITR)

**Use when:** Destructive query ran against prod. Data loss window ≤ 7 days.

1. Maintenance mode on — stop writes.
2. Identify target timestamp just before the event.
3. Managed DB console → Restore → Point in time → timestamp.
4. Update `DATABASE_URL` to new instance.
5. Restart app.
6. Spot-check known data.
7. Retire old instance after 48h of confidence.

**Time to recovery:** 10–30 min.

### Scenario 2: Full Restore from Daily Snapshot

**Use when:** Primary DB lost. Data loss window ≤ 24h.

1. Maintenance mode on.
2. Managed DB console → Restore → From snapshot → latest daily.
3. Wait 5–15 min for provision.
4. Update `DATABASE_URL`.
5. Restart app.
6. Reconcile Stripe: `pnpm tsx scripts/reconcile-stripe.ts --since=<snapshot-time>`.
7. Spot-check entitlements for active users.
8. Maintenance off.

**Time to recovery:** 30–60 min.

### Scenario 3: Off-Site Restore (Provider Down)

**Use when:** Managed DB provider completely down.

1. Spin up Postgres on alternate provider.
2. Download latest off-site snapshot from S3/R2.
3. `pg_restore --clean --if-exists --no-owner --no-privileges <snapshot>`.
4. Update `DATABASE_URL`.
5. `pnpm db:migrate` to catch up.
6. Reconcile Stripe.
7. Verify + restart.

**Time to recovery:** 1–3 hours.

### Scenario 4: Compromised Database

1. **Rotate all secrets immediately.**
2. Invalidate all sessions: Better Auth → revoke all.
3. Force password reset for all users.
4. Maintenance mode on.
5. PITR to just before compromise.
6. Review `audit_log` for tampering.
7. Notify affected users within 72h (GDPR).
8. Full security review before returning to normal.

---

## Stripe Reconciliation

`scripts/reconcile-stripe.ts` — loads subscription rows from the DB with `updated_at >= --since`, verifies each `stripe_subscription_id` via Stripe `subscriptions.retrieve`, and reports rows missing in Stripe or with a status mismatch vs Stripe. Exit code `2` if any ID is missing in Stripe. (Webhook replay is a separate operational step.)

```bash
pnpm tsx scripts/reconcile-stripe.ts --since="2026-04-15T00:00:00Z"
```

---

## Quarterly Restore Drill

Restore is not a backup until you have restored from it.

1. Pick recent snapshot.
2. Restore to throwaway instance.
3. Boot app against restored instance.
4. Verify seeded flows work.
5. Time the restore.
6. Log below.
7. Destroy throwaway.

### Drill Log

| Date | Scenario | Time to Recovery | Notes |
|---|---|---|---|
| — | — | — | — |
