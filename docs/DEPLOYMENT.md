# DEPLOYMENT.md

> Staging and production deployment procedures. No change ever goes direct to production.

---

## Environments

| Environment | URL | Database | Stripe Mode | Email |
|---|---|---|---|---|
| Local | `http://localhost:5173` | Docker Postgres | Test | Resend sandbox |
| Staging | `https://staging.marketforge.io` | Managed staging DB | Test | Resend sandbox |
| Production | `https://marketforge.io` | Managed prod DB | **Live** | Resend prod |

---

## Required Secrets (per environment)

Stored in the host's secret manager. Never in the repo.

| Secret | Notes |
|---|---|
| `DATABASE_URL` | Pooled URL for app |
| `DIRECT_DATABASE_URL` | Direct URL for migrations |
| `BETTER_AUTH_SECRET` | 64-byte random, rotated annually |
| `BETTER_AUTH_URL` | Public URL of the app |
| `STRIPE_SECRET_KEY` | `sk_test_*` staging, `sk_live_*` prod |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_*` / `pk_live_*` |
| `STRIPE_WEBHOOK_SECRET` | Unique per environment |
| `RESEND_API_KEY` | Sandbox staging, live prod |
| `SENTRY_DSN` / `PUBLIC_SENTRY_DSN` | Separate projects |
| `DEV_TEST_PASSWORD` | Dev/staging only, never prod |

---

## First-Time Staging Setup

1. Provision hosting (Vercel/Cloudflare) + managed Postgres.
2. Stripe test-mode account → copy `sk_test_*` + webhook signing secret.
3. Set all secrets in hosting provider.
4. Point DNS: `staging.marketforge.io` → host.
5. Deploy from `main`.
6. `pnpm db:migrate` on staging DB.
7. Seed staging (reduced seed, no dev-only personas): `pnpm db:seed:staging`.
8. Stripe webhook endpoint → `https://staging.marketforge.io/api/webhooks/stripe`.
9. Run full Playwright E2E suite against staging. All green before moving on.

---

## First-Time Production Setup

1. Provision prod hosting + managed Postgres (separate from staging).
2. **Activate Stripe live mode.** Complete business verification.
3. Create live-mode products + prices + coupons via one-time production seed script.
4. Copy live Stripe keys + webhook secret into host secrets.
5. Set all env secrets.
6. Point DNS.
7. Deploy from tagged release (e.g. `v1.0.0`).
8. `pnpm db:migrate` on prod DB.
9. **Do not run dev seed.** Prod starts with zero users.
10. Stripe webhook → `https://marketforge.io/api/webhooks/stripe`.
11. Verify webhook signature with a test event.
12. Grant founding admin via `scripts/grant-admin.ts`.
13. Smoke test: signup → real card checkout → entitlement → refund → revocation.
14. Enable monitoring + alerts.

---

## Standard Deployment Flow

```
feature branch → PR → CI green → merge to main
                                     ↓
                         auto-deploy to staging
                                     ↓
                    smoke test (automated + manual)
                                     ↓
                        tag release → promote to prod
```

```bash
# After staging verification:
git checkout main && git pull
git tag v1.4.2 -m "Add billing portal"
git push origin v1.4.2
# Production deploys from the tag
```

---

## Migration Strategy

Migrations run **before** the new app version takes traffic. Backwards compatible always.

### Safe patterns
- Adding columns: nullable or with default
- Removing columns: two-step deploy (stop writing, then drop)
- Renaming columns: three-step (add new, dual-write, drop old)
- Adding indexes: `CREATE INDEX CONCURRENTLY`
- Changing types: add new, backfill, swap, drop old

### Never
- Destructive migrations requiring DB rollback
- `ACCESS EXCLUSIVE` locks on active tables
- Mixing schema changes with data backfills in one migration

---

## Rollback

**App rollback (fast, safe):**
```bash
<hosting-cli> deploy --revision <previous-tag>
```
~30s. Schema unchanged due to backwards-compatible migrations.

**DB rollback:** Only for destructive migrations. See `RESTORE.md`. Better to redesign as multi-step deploy.

---

## Pre-Launch Checklist

### Stripe
- [ ] Live mode activated, business verification complete
- [ ] All products/prices created in live mode
- [ ] Webhook endpoint + signing secret configured
- [ ] Real-card test purchase + refund completed
- [ ] Customer portal enabled + branded
- [ ] Tax collection configured
- [ ] Payout schedule confirmed

### Infrastructure
- [ ] DNS propagation confirmed
- [ ] TLS cert valid + auto-renewal
- [ ] HTTP → HTTPS redirect
- [ ] DB backups daily, 30-day retention
- [ ] Backup restore tested end-to-end
- [ ] Rate limiting on auth, checkout, webhooks
- [ ] CORS configured
- [ ] Security headers (CSP, HSTS, X-Frame-Options, etc.)

### Monitoring
- [ ] Sentry receiving events in prod
- [ ] Uptime monitor pinging `/health`
- [ ] Alert channels configured + tested
- [ ] Stripe webhook failure alerts
- [ ] Slow query alerts

### Legal
- [ ] Terms live + counsel-reviewed
- [ ] Privacy live + counsel-reviewed
- [ ] Refund Policy matches Stripe dispute policy
- [ ] Cookie Notice live (if EU/UK traffic)

### Communications
- [ ] Support email monitored
- [ ] Auto-responder configured
- [ ] Transactional emails verified in prod Resend
- [ ] Sender domain authenticated (SPF, DKIM, DMARC)

### Final
- [ ] Full Playwright suite green against staging
- [ ] Load test × 3 expected launch traffic
- [ ] Rollback dry-run completed
- [ ] On-call schedule set for first 72 hours
