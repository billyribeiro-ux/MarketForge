# ARCHITECTURE.md

> System design decisions and rationale. Updated when non-obvious calls are made.

---

## High-Level

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Svelte 5)                    │
│   Motion animations · Iconify · Generated SVG icons      │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼─────────────────────────────────┐
│                     SvelteKit 2                          │
│  ┌──────────────┐ ┌────────────┐ ┌───────────────────┐   │
│  │  (marketing) │ │   (app)    │ │  api/webhooks/*   │   │
│  │   routes     │ │   routes   │ │     +server       │   │
│  └──────────────┘ └────────────┘ └───────────────────┘   │
│                                                          │
│  hooks.server.ts → Better Auth → Entitlement middleware  │
│  src/lib/server/db → Drizzle → postgres.js               │
│  src/lib/server/stripe → Stripe SDK                      │
│  src/lib/server/email → Resend SDK                       │
└────┬───────────────────────┬─────────────────────┬───────┘
     │                       │                     │
     ▼                       ▼                     ▼
┌──────────┐          ┌────────────┐         ┌──────────┐
│ Postgres │          │   Stripe   │         │  Resend  │
└──────────┘          └────────────┘         └──────────┘
```

Everything lives in one SvelteKit codebase. Server-only code under `src/lib/server/` is guaranteed by Vite to never ship to the browser.

---

## Core Principle: Entitlements Are Truth

Everything downstream of billing flows through **entitlements**. Subscriptions and purchases are records of **how** a user got access; entitlements are records of **what they have**.

### Schema shape

```
users
  id, email, email_verified_at, ...
  (password hash, 2FA, passkeys all managed by Better Auth)

sessions                    (managed by Better Auth)

subscriptions               purchases
  id, user_id,                id, user_id,
  stripe_subscription_id,     stripe_payment_intent_id,
  status, current_period_end  product, amount_cents,
  ...                         ...

entitlements
  id,
  user_id,
  name,                     ← 'pro_access' | 'indicator_vault' | 'live_room' | 'admin'
  granted_by_type,          ← 'subscription' | 'purchase' | 'manual'
  granted_by_id,            ← FK to subscriptions/purchases/null
  expires_at,               ← null = forever
  revoked_at,               ← non-null = revoked
  created_at

webhook_events              ← idempotency dedupe
  stripe_event_id (PK),
  event_type, processed_at, payload

audit_log                   ← every entitlement grant/revoke/admin action
```

### Rules

- Access is determined by `SELECT * FROM entitlements WHERE user_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`.
- `user.plan` does not exist. Anywhere.
- Refunds and chargebacks set `revoked_at`. Rows are never deleted.
- Every grant and every revocation writes to `audit_log`.

---

## Auth — Better Auth

**Why Better Auth over Clerk/Auth0/Lucia-rolled-your-own:**
- Native first-class SvelteKit integration (not a community adapter)
- Self-hosted — we own the user table, no vendor lock-in
- Cost at 100K MAU is whatever Postgres costs, not $2K/month
- Instant session revocation on refund/chargeback (critical for paid product)
- Email/password + email verification + password reset + 2FA + passkeys out of the box

### Session model
- Server-side, stored in Postgres
- HTTP-only + Secure + SameSite=Lax cookie
- 30-day sliding expiry
- Revocation is one DB row delete — instant

### Middleware
`hooks.server.ts` runs in sequence:
1. `svelteKitHandler` from `better-auth/svelte-kit`
2. Session/user population onto `event.locals`
3. PE7 entitlement middleware — gates routes on `(app)/admin`, `(app)/live`, `(app)/indicators` based on entitlements

---

## Billing — Stripe

**Stripe as source of truth for money, DB as source of truth for access.**

- Stripe owns: subscriptions, invoices, payments, prices, coupons, refunds, disputes.
- Our DB owns: users, entitlements, audit log.
- Webhooks are the bridge.

### Idempotency (non-negotiable)

```sql
CREATE TABLE webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload         JSONB NOT NULL
);
```

Every webhook handler:
1. Start transaction
2. `INSERT INTO webhook_events ... ON CONFLICT (stripe_event_id) DO NOTHING`
3. If affected = 0 → already processed, return 200 OK
4. Otherwise: verify signature, process event, commit

### Never grant entitlements from UI

The `/checkout/success` page is UI-only. User can forge the URL. Entitlements come exclusively from verified `checkout.session.completed` and `customer.subscription.*` webhooks.

### Events handled (10)
- `checkout.session.completed`
- `customer.subscription.created` / `.updated` / `.deleted` / `.trial_will_end`
- `invoice.paid` / `.payment_failed` / `.payment_action_required`
- `charge.refunded`
- `charge.dispute.created`

---

## Frontend Architecture

### Two distinct layouts

```
src/routes/
├── (marketing)/+layout.svelte    ← public, auth-aware navbar
└── (app)/+layout.svelte          ← authed app, sidebar + user menu
```

They share tokens but nothing else. Marketing is a sales experience. App is a working environment.

### PE7 CSS layer structure

```css
@layer reset, tokens, base, components, utilities, overrides;
```

- `reset` — box-sizing, margin reset
- `tokens` — OKLCH colors, breakpoints, type scale, spacing, motion
- `base` — element defaults
- `components` — reusable component styles
- `utilities` — rare escape hatches (not a Tailwind replacement)
- `overrides` — page-specific overrides, sparingly

### Scoped `--_` custom properties

```svelte
<style>
  .button {
    --_bg: var(--color-primary);
    --_fg: var(--color-on-primary);
    background: var(--_bg);
    color: var(--_fg);
  }
  .button.danger {
    --_bg: var(--color-danger);
  }
</style>
```

`--_bg` is component-local by convention. Parent overrides don't leak to unrelated elements.

### Motion animation strategy

Marketing motion uses **`@humanspeak/svelte-motion`**: a maintained Svelte 5 port of the Motion / Framer Motion model (tweened props, `whileInView`, gestures). It follows the same GPU-first rules as Motion (motion.dev). Official `motion` + `motion/svelte` was not wired in this repo because the published Motion Svelte bindings lagged the stack; this package is the pragmatic PE7 substitute.

- Hero reveal, scroll-linked / in-view reveals, feature-card hover on marketing
- GPU-accelerated transforms only — never animate `width`, `height`, `top`, `left`
- Durations set to `0` when `prefers-reduced-motion` is on; hover motion disabled the same way

### Icons

Two icon sources:

1. **Iconify** (Phosphor + Carbon) — for standard UI icons. Tree-shaken per import.
2. **svg-to-svelte generated** — project-specific icons in `src/lib/icons/raw/` become typed Svelte components in `src/lib/icons/generated/` via a build step. Forwards `$$restProps` so icons accept class names, sizes, etc.

---

## Data Layer — Drizzle ORM

- Schema in `src/lib/server/db/schema.ts`
- Migrations auto-generated with `drizzle-kit`, committed to `drizzle/migrations/`
- Every query fully typed — no raw SQL in application code (exceptions need an `ARCHITECTURE_DECISION` comment)
- Drizzle Studio available via `pnpm db:studio`

### Connection pooling
- **Production:** `postgres.js` max 10 connections per app instance, behind a PgBouncer transaction-mode pooler if load warrants
- **Development:** Direct connection, no pooling

---

## Email — Resend

- All transactional emails through Resend
- Templates written as Svelte components in `src/lib/server/email/templates/`, rendered server-side to HTML strings
- Every billing event triggers a template: welcome, receipt, renewal reminder, payment failed, trial ending, cancelled

---

## Dev-Only Code Exclusion

Dev-only routes (`/dev/login-as/:persona`) wrap their route module exports in `import.meta.env.DEV` checks. Vite tree-shakes them out of production builds. **They do not exist in the production bundle.**

Svelte Agentation is imported conditionally on dev only. Same tree-shaking guarantee.

**Never** use `if (user.email === 'me@...')` to gate dev functionality — that code still ships.

---

## Observability

- **Errors:** Sentry (`@sentry/sveltekit`) for both client and server
- **Analytics:** Plausible — privacy-respecting, no cookie banner required
- **Logs:** pino (server) → stdout → hosting log aggregation
- **Product telemetry:** Plausible custom events for `signup_*`, `checkout_*`, `subscription_*`, `lifetime_purchased`

---

## Build Pipeline

1. `pnpm icons:generate` — SVGs → typed Svelte components (pre-build)
2. `pnpm check` — TypeScript + Svelte check
3. `pnpm lint` — Biome lint
4. `pnpm test` — Vitest unit tests
5. `pnpm build` — SvelteKit production build
6. `pnpm test:e2e` — Playwright against built app

CI runs all six on every push. Failing any step blocks merge.

---

## Deployment Model

- **Production:** single region on Vercel or Cloudflare (adapter chosen per deploy)
- **Staging:** identical config, separate DB, Stripe test mode
- **Every change goes to staging first.** No direct-to-prod.
- **Migrations** run before the new app version takes traffic.

---

## Decision Log

| Date | Decision | Reasoning |
|---|---|---|
| 2026-04-17 | Better Auth over Clerk | Own the user table. Instant refund-triggered revocation. No per-MAU pricing. Native SvelteKit support (Clerk's is community-maintained). |
| 2026-04-17 | Drizzle over Prisma v7 | Prisma Next is announced (March 4 2026) as a rewrite. Drizzle is lighter, SQL-closer, already the SvelteKit community default. |
| 2026-04-17 | Stripe Checkout over custom form | v1 doesn't need custom checkout UI. Migrate later if conversion data justifies it. |
| 2026-04-17 | `@humanspeak/svelte-motion` for marketing motion | Framer-style Motion API on Svelte 5 runes; official `motion/svelte` was not adopted here due to integration timing. Same animation discipline (GPU transforms, reduced motion). |
| 2026-04-17 | Iconify + svg-to-svelte instead of Lucide | Lucide icon set is banned by PE7 preferences. Iconify gives Phosphor/Carbon coverage; svg-to-svelte handles project-specific icons with typed components. |
