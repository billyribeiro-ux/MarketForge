# SPEC.md

> **MarketForge — product specification. The contract for the entire build.**

---

## Product

- **Name:** MarketForge
- **One-line description:** Institutional-grade trading education, indicators, and live rooms for serious traders.
- **Target customer:** Active retail and semi-pro traders (currently 18,000+ in the Explosive Swings / Revolution Trading Pros community).
- **Core promise:** Tools, education, and community that operate at PE7-engineering standards — no retail toys, no shortcuts.

---

## Stack

- **Frontend + Backend:** SvelteKit 2.x + Svelte 5 (runes-only) + TypeScript strict
- **Styling:** PE7 CSS (OKLCH, `@layer`, logical props, scoped `--_` custom props, zero Tailwind)
- **Database:** PostgreSQL 16 + Drizzle ORM + postgres.js driver
- **Auth:** Better Auth (self-hosted, first-class SvelteKit integration)
- **Payments:** Stripe (Checkout Sessions + hosted Billing Portal)
- **Email:** Resend (transactional)
- **Icons:** Iconify (Phosphor + Carbon) + svg-to-svelte for project icons
- **Animation:** Motion (motion.dev) — GPU-accelerated
- **Dev tooling:** Svelte Agentation (dev-mode inspector) + Svelte MCP (remote)
- **Observability:** Sentry + Plausible + pino
- **Package manager:** pnpm (locked, enforced)

---

## Auth

- **Provider:** Better Auth (no Auth0, no Clerk, no Supabase Auth)
- **Method:** Email + password (argon2id under the hood)
- **Session:** Server-side, stored in Postgres, HTTP-only + Secure + SameSite=Lax cookie, 30-day sliding expiry
- **Email verification:** Required before first purchase
- **Password reset:** Token-based, 30-minute expiry, single-use
- **2FA:** TOTP available, optional per user
- **Passkeys:** Available, optional per user
- **OAuth:** None on v1

---

## Billing

### Products & Prices

| Product | Type | Interval | Price (USD) | Entitlements Granted |
|---|---|---|---|---|
| Pro Monthly | Subscription | month | $49 | `pro_access` |
| Pro Quarterly | Subscription | 3 months | $129 | `pro_access` |
| Pro Yearly | Subscription | year | $449 | `pro_access`, `indicator_vault` |
| Pro Lifetime | One-time | — | $1499 | `pro_access`, `indicator_vault`, `live_room` |

### Trial Policy

- **Length:** 14 days on Yearly only
- **Card required up-front:** Yes
- **Behavior on trial end with card:** Auto-charge to Yearly rate
- **Behavior on trial end without card:** Downgrade to free. Never silent-charge.

### Refund Policy

- **Subscriptions:** 7-day money-back, no partial refunds after
- **Lifetime:** 30-day money-back, no refunds after
- **Refund → entitlement revoked immediately** via `charge.refunded` webhook.

### Proration Rules

- **Upgrade Monthly → Yearly:** Immediate upgrade with pro-rated credit for unused monthly time
- **Upgrade Monthly → Quarterly:** Same — immediate with credit
- **Downgrade Yearly → Monthly:** Scheduled at period end, no proration
- **Lifetime while on active subscription:** Cancel subscription immediately, credit unused time to Stripe balance

---

## Entitlements

Entitlements are what users **have**. Subscriptions and purchases record how they **got** them. Always read from the `entitlements` table, never from `user.plan`.

| Entitlement | Description | Granted By |
|---|---|---|
| `pro_access` | Core app access — courses, standard indicators | Any paid product |
| `indicator_vault` | Full institutional-grade indicator library with Pine Script + ThinkScript source | Yearly, Lifetime |
| `live_room` | Access to real-time live trading room | Lifetime only |
| `admin` | Admin dashboard access | Manual grant only |

---

## Personas (Development Seed)

All personas seeded by `scripts/seed-dev.ts`. Login via `/dev/login-as/<persona>` in dev only. Full catalog in `TESTING.md`.

**Auth personas (6):** free, pro, pro-expired, trial, admin, banned
**Billing personas (12):** see `TESTING.md`
**Coupon states (12):** see `TESTING.md`

---

## Public Pages

- `/` — Landing page
- `/pricing` — Pricing (reads from DB, never hardcoded)
- `/about`
- `/contact`
- `/support`
- `/terms`, `/privacy`, `/refund-policy`, `/cookie-notice`

## Authed Pages

- `/app` — Dashboard
- `/app/indicators` — Indicator Vault (gated: `indicator_vault`)
- `/app/live` — Live Room (gated: `live_room`)
- `/app/courses` — Course catalog (gated: `pro_access`)
- `/app/courses/[slug]` — Course detail with progress tracking
- `/account` — Profile, password, 2FA, passkeys
- `/account/billing` — Stripe Billing Portal handoff
- `/account/entitlements` — What you have and how you got it
- `/app/admin` — Admin dashboard (gated: `admin`)

## Dev-Only (tree-shaken from production)

- `/dev/login-as/[persona]` — instant persona login for testing

---

## Out of Scope for v1

Explicit non-goals. Do not build:

- Native mobile app
- Affiliate / referral program
- Team or multi-seat accounts
- Custom checkout UI (use Stripe Checkout hosted)
- Custom billing portal (use Stripe hosted)
- In-app helpdesk / ticketing
- Live chat
- Forum / community discussion board
- Trade journal / portfolio tracking
- Broker integration

---

## Success Criteria for v1 Launch

- [ ] All 8 build phases complete per `PROMPT.md`
- [ ] All E2E tests green in CI
- [ ] Lighthouse 95+ on landing, pricing, dashboard
- [ ] Staging environment tested for 7 days with real purchases in Stripe test mode
- [ ] Backup restore procedure executed successfully
- [ ] Legal pages reviewed by counsel
- [ ] Support email monitored with auto-responder live
- [ ] Zero TypeScript errors, zero lint warnings
- [ ] Zero `any`, zero `@ts-ignore`, zero hardcoded secrets

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-04-17 | Initial spec | Billy Ribeiro |
