# PROMPT.md — Build "MarketForge" to PE7 Standard

> **The single execution prompt for Claude Code.**
> Paste this as your initial message, attach all `docs/*.md` files as context, then let Claude Code execute.

---

## ROLE

You are a Principal Engineer at ICT Level 7 standard. You build to Apple / Microsoft enterprise grade. You write TypeScript with zero `any`, zero `@ts-ignore`, zero shortcuts. You build for 10-year longevity. You have no tolerance for hacky workarounds.

You are building this app for **Billy Ribeiro** — founder of Explosive Swings and Revolution Trading Pros, serving 18,000+ active traders. Quality is non-negotiable.

---

## PROJECT

**Name:** MarketForge
**Tagline:** Institutional-grade trading education, indicators, and live rooms — built on PE7 engineering standards.
**Type:** Fullstack SvelteKit membership platform with subscriptions, lifetime purchases, and gated trading content.
**Target users:** 18,000+ active retail + semi-pro traders.
**Launch goal:** Production-ready, ship-capable, zero-tech-debt v1.

---

## THE STACK — LOCKED

Every library below is required. No substitutions without asking.

### Core
- **SvelteKit 2.x** (latest, fullstack — owns frontend AND backend)
- **Svelte 5 runes-only** (`$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- **TypeScript strict mode** — zero `any`, zero `@ts-ignore`
- **`{@attach}`** over `use:action`, **`{#snippet}` + `{@render}`** over slots
- **Vite** (bundled with SvelteKit)
- **pnpm** (enforced via `only-allow pnpm`)

### Database & ORM
- **PostgreSQL 16**
- **Drizzle ORM** — lives in `src/lib/server/db/`
- **drizzle-kit** for migrations + Drizzle Studio
- **postgres.js** as the driver

### Auth
- **Better Auth** (latest) with SvelteKit first-class integration
- **argon2id** password hashing via Better Auth's built-in
- Email/password + email verification + password reset + 2FA + passkeys (enable all)
- Server-side sessions, HTTP-only Secure SameSite=Lax cookies

### Payments
- **Stripe** — Checkout Sessions + hosted Billing Portal
- Stripe Node SDK in `src/lib/server/stripe/`
- Stripe CLI (`stripe listen`) for local webhook dev
- Webhook handler at `src/routes/api/webhooks/stripe/+server.ts`
- Idempotent via `webhook_events` dedupe table keyed on `event.id`

### Validation
- **Zod** for every server endpoint + form action body
- **sveltekit-superforms** for form validation + progressive enhancement

### Email
- **Resend** SDK in `src/lib/server/email/`
- Templates as Svelte components rendered server-side to HTML strings

### Styling — PE7 CSS Architecture
- **Zero Tailwind. Zero utility frameworks.**
- **OKLCH color tokens only** — no hex, no rgb, no hsl
- **`@layer` cascade:** reset, tokens, base, components, utilities, overrides
- **9-tier breakpoint scale:** xs (320), sm (480), md (768), lg (1024), xl (1280), xl2 (1536), xl3 (1920), xl4 (2560), xl5 (3840)
- **Fluid typography** with `clamp()`
- **Logical properties** everywhere (`margin-inline`, `padding-block`, `inset`, etc.)
- **Scoped `--_` custom properties** per component

### Icons
- **Iconify** with **Phosphor** and **Carbon** sets only
- **Zero Lucide**
- Additionally: generate project icons from `src/lib/icons/raw/*.svg` → Svelte components using **svg-to-svelte** (build step in `scripts/generate-icons.ts`)

### Animation
- **Motion-class API** (GPU-first, same interaction model as Motion / Framer Motion). This repo ships **`@humanspeak/svelte-motion`** for Svelte 5 until `motion/svelte` is adopted end-to-end; see `docs/ARCHITECTURE.md`.
- Hardware-accelerated transforms. Zero layout thrashing. Respect `prefers-reduced-motion`.
- Springs, tweens, gestures, scroll-linked reveals — through that layer on marketing (and the same rules apply app-wide).

### Developer Experience Inside the App
- **Svelte Agentation** — dev-mode source-aware element inspector for browser annotations (dev-only, tree-shaken out of production)
- **Svelte MCP (remote)** — connected during Claude Code sessions so the agent can look up Svelte 5 docs on demand via `svelte:list-sections` and `svelte:get-documentation`, and run `svelte:svelte-autofixer` on every component before committing

### Observability
- **Sentry** (first-party SvelteKit integration — client + server)
- **Plausible** for privacy-respecting analytics
- **pino** for structured server logs

### Testing
- **Vitest** for unit + integration tests
- **Playwright** for E2E tests
- **MSW** (Mock Service Worker) for frontend-first mocking during parallel development

### Tooling
- **Biome** for lint + format
- **Docker Compose** for local Postgres
- **Stripe CLI** for webhook forwarding

### Hosting (configured but not deployed by the agent)
- App: Vercel or Cloudflare (via `adapter-cloudflare`)
- DB: Neon or managed Postgres

---

## CORE PRODUCT FEATURES (v1)

The app exists to gate premium trading content behind subscriptions and lifetime purchases.

1. **Auth** — signup, login, password reset, email verification, 2FA optional, passkeys optional
2. **Billing** — Monthly ($49), Quarterly ($129), Yearly ($449), Lifetime ($1499); coupons; trials; refunds
3. **Indicator Vault** — gated library of trading indicators (Pine Script, ThinkScript downloads)
4. **Live Room** — gated real-time trading room (lifetime tier only)
5. **Courses** — gated course content with progress tracking
6. **Admin Dashboard** — user management, entitlement grants/revocations, audit log viewer
7. **Public marketing site** — landing, pricing, about, contact, legal pages
8. **Account management** — profile, password, 2FA, billing portal, entitlements view

---

## NON-NEGOTIABLES (PE7 Rules)

These are not guidelines. These are laws.

1. TypeScript strict mode. Zero exceptions. Zero `any`. Zero `@ts-ignore`.
2. pnpm only. `preinstall` fails on npm/yarn.
3. Svelte 5 runes-only. No legacy `$:` reactive syntax.
4. Zero Tailwind. PE7 CSS only. OKLCH colors. `@layer` cascade.
5. Zero Lucide. Iconify with Phosphor/Carbon, plus svg-to-svelte for project icons.
6. Entitlements are a separate table from subscriptions and purchases. Never read `user.plan` — always read from `entitlements`.
7. Webhook handlers idempotent, keyed on `event.id` in a `webhook_events` dedupe table.
8. Grant entitlements ONLY from verified Stripe webhooks. Never from `/checkout/success` UI.
9. Dev-only routes (like `/dev/login-as/:persona`) tree-shaken from production via `import.meta.env.DEV`, not if-guarded.
10. Server-only code strictly under `src/lib/server/` — Vite guarantees it never ships to the browser.
11. Every form action and endpoint validates input with Zod before touching the DB.
12. Every public page hits Lighthouse 95+ on all metrics.
13. Build for 10-year longevity. No hacky workarounds.

---

## EXECUTION ORDER

Follow the PE7 Build Order precisely. Do NOT skip ahead. Do NOT build UI before tokens. Do NOT build the product before the paywall.

### Phase 1 — Foundation (in this order)

1. `pnpm create svelte@latest .` — SvelteKit skeleton, TypeScript.
2. Set TypeScript strict mode in `tsconfig.json`. Lock pnpm in `package.json` with `"packageManager"` and `preinstall` guard.
3. Create `.env.example` and `.env.local` with every secret the app will ever need (see `docs/SPEC.md`).
4. Create `src/lib/styles/tokens.css` with full PE7 CSS foundation:
   - OKLCH color tokens (primary, surface, text, success, warn, danger — each with light/dark)
   - 9-tier breakpoint scale as CSS custom properties
   - Fluid typography scale with `clamp()`
   - Spacing scale
   - `@layer` cascade declaration (`@layer reset, tokens, base, components, utilities, overrides;`)
5. Create `src/hooks.server.ts` with global error handler + pino logger skeleton.
6. Install and configure **Svelte Agentation** (dev-mode only).

### Phase 2 — Data

7. Design the Drizzle schema in `src/lib/server/db/schema.ts`. Tables: `users`, `sessions`, `accounts` (Better Auth), `verification_tokens`, `subscriptions`, `purchases`, `entitlements`, `products`, `prices`, `coupons`, `webhook_events`, `audit_log`, `courses`, `course_progress`, `indicators`.
8. Generate first migration. Run against local Postgres (Docker Compose).
9. Create `scripts/seed-dev.ts` with production guards (`NODE_ENV` + `DATABASE_URL` checks that throw on production).
10. Wire up `pnpm db:reset`, `pnpm db:seed`, `pnpm db:studio`, `pnpm db:generate`, `pnpm db:migrate`.

### Phase 3 — Auth (Better Auth)

11. Install Better Auth. Configure in `src/lib/server/auth.ts` with email/password, email verification, password reset, 2FA, passkeys.
12. Wire `svelteKitHandler` + `sveltekitCookies` plugin in `src/hooks.server.ts`.
13. Build auth routes: `/signup`, `/login`, `/verify-email`, `/reset-password`, `/logout`.
14. Seed 6 auth personas in `scripts/seed-dev.ts`: `free@test.dev`, `pro@test.dev`, `pro-expired@test.dev`, `trial@test.dev`, `admin@test.dev`, `banned@test.dev` — all using `DEV_TEST_PASSWORD` env var.
15. Build `src/routes/dev/login-as/[persona]/+server.ts` wrapped in `import.meta.env.DEV`.
16. Build route-protection middleware in `hooks.server.ts`. Four states: anonymous, authed, entitled, admin. Checks `entitlements` table, NEVER `user.plan`.

### Phase 4 — Money

17. Extend seed script to create Stripe test-mode products + prices (Monthly, Quarterly, Yearly, Lifetime).
18. Build `/checkout/[product]/+server.ts` — creates Stripe Checkout Session, returns URL.
19. Build `/checkout/success/+page.svelte` — confirmation only. Never grants entitlements.
20. Build `/api/webhooks/stripe/+server.ts` — handle all 10 critical events idempotently via `webhook_events` dedupe table:
    - `checkout.session.completed`, `customer.subscription.created/updated/deleted/trial_will_end`
    - `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`
    - `charge.refunded`, `charge.dispute.created`
21. Build `/account/billing/+server.ts` — creates Stripe Billing Portal session and redirects.
22. Extend seed with 12 billing personas + 12 coupon states (see `docs/TESTING.md`).

### Phase 5 — Product (gated from day one)

23. Build Indicator Vault — gated behind `indicator_vault` entitlement — with file downloads for Pine Script + ThinkScript files.
24. Build Live Room page — gated behind `live_room` entitlement — placeholder integration, admin-announces-sessions.
25. Build Courses — gated behind `pro_access` — markdown-based course content, progress tracking in DB.
26. Build authed app shell at `src/routes/(app)/+layout.svelte` — sidebar, user menu, account link, logout.
27. Build entitlement-aware UI components: `UpgradePrompt`, `RenewalBanner`, `TrialCountdown`, `PastDueWarning`.
28. Build Admin Dashboard at `src/routes/(app)/admin/` — user management, entitlement management, audit log viewer. Gated behind `admin` entitlement.

### Phase 6 — Marketing

29. Build public layout at `src/routes/(marketing)/+layout.svelte` with auth-aware navbar + footer.
30. Build landing page with hero, value prop, social proof, features, pricing preview, FAQ, CTA.
    - **Use Motion for hero animations, scroll-linked reveals, and hover/gesture effects on feature cards.**
    - Every animation GPU-accelerated. Zero layout thrashing. Respect `prefers-reduced-motion`.
31. Build pricing page — fetches prices from DB (seeded from Stripe). NEVER hardcoded.
32. Build legal pages: `/terms`, `/privacy`, `/refund-policy`, `/cookie-notice` (placeholder content).
33. Build `/about`, `/contact`, `/support` pages.

### Phase 7 — Polish

34. Per-page SEO: title tags, meta descriptions, Open Graph, Twitter cards, JSON-LD. Generate `sitemap.xml` and `robots.txt` dynamically.
35. Plausible analytics with custom events: `signup_started`, `signup_completed`, `checkout_started`, `checkout_completed`, `subscription_cancelled`, `lifetime_purchased`.
36. Transactional emails via Resend: welcome, purchase receipt, renewal reminder, payment failed, trial ending, subscription cancelled.
37. Optimize images (AVIF with JPEG fallback), enable code splitting, add prefetching. Verify Lighthouse 95+.
38. Accessibility pass: keyboard nav, focus states, ARIA labels, AA contrast. Run axe-core on every page.

### Phase 8 — Ship

39. Playwright E2E tests for critical flows (see `docs/TESTING.md` for full list).
40. Write GitHub Actions CI workflow: typecheck, lint, unit tests, E2E tests on every push.
41. Sentry wired for client + server.
42. Configure daily Postgres backup script (documented in `docs/RESTORE.md`).
43. Final launch checklist from `docs/DEPLOYMENT.md`.

---

## AGENT OPERATING RULES

### Use the Svelte MCP

For **every** Svelte component you write:
1. Call `svelte:list-sections` at the start of a session to know what docs are available.
2. Before writing complex Svelte 5 features (runes, attachments, snippets, transitions), call `svelte:get-documentation` for the relevant sections.
3. After writing any component, run `svelte:svelte-autofixer` on it and fix every reported issue before committing.

### Use the Visualizer for architecture artifacts

When you need to produce diagrams (ER diagrams, sequence diagrams for auth/billing flows, component hierarchies), use the visualizer — don't draw ASCII art.

### Generate project icons at build time

- Source SVGs in `src/lib/icons/raw/`
- `scripts/generate-icons.ts` uses `svg-to-svelte` to convert them to typed Svelte components in `src/lib/icons/generated/`
- Wire into the build pipeline as a pre-build step

### Commit discipline

- Conventional Commits enforced by commitlint
- One logical change per commit
- Every commit passes typecheck + lint before the next commit starts
- Never commit `console.log`, `any`, `@ts-ignore`, or hardcoded secrets

### When you must ask

Before making any of these calls, stop and ask Billy:
- Swapping any locked library for a different one
- Changing the entitlement model
- Altering the billing structure or prices
- Introducing any third-party service not listed in the stack

### When you must NOT ask

Proceed without asking for:
- Implementation details (naming, file organization within `src/lib/`, query shape, etc.)
- Styling choices that follow the PE7 tokens
- Test coverage decisions that meet the rules in `docs/CONTRIBUTING.md`
- Error message copy (use clear, direct language)

---

## DELIVERABLES

At the end of the build, the repo must contain:

### Code
- Full SvelteKit 2 app with every feature listed above
- Drizzle schema + migrations + seed script
- Better Auth configured end-to-end
- Stripe integration with idempotent webhooks
- Motion-powered marketing animations
- Generated icon library from SVGs
- Svelte Agentation dev tooling
- 12+ auth/billing seed personas accessible via `/dev/login-as/:persona`
- Playwright E2E tests for critical flows
- Vitest unit tests for business logic
- GitHub Actions CI

### Documentation
Canonical docs live under **`docs/`** (plus root **`README.md`** for setup). These are your source of truth:
- `docs/SPEC.md` — product contract
- `README.md` — setup + scripts + structure (see `docs/INDEX.md` for the full map)
- `docs/ARCHITECTURE.md` — system design decisions
- `docs/TESTING.md` — personas, coupons, critical flows
- `docs/DEPLOYMENT.md` — staging + production + launch checklist
- `docs/RESTORE.md` — backup + recovery
- `docs/CONTRIBUTING.md` — code standards + commit conventions
- `docs/SECURITY.md` — vulnerability policy + practices
- `docs/CHANGELOG.md` — version history
- `docs/INDEX.md` — docs map

### Infrastructure files
- `.env.example` — every secret the app needs, with placeholders
- `docker-compose.yml` — local Postgres
- `drizzle.config.ts` — Drizzle configuration
- `playwright.config.ts` — E2E configuration
- `vitest.config.ts` — unit test configuration
- `biome.json` — lint + format configuration
- `.github/workflows/ci.yml` — CI pipeline

---

## SUCCESS CRITERIA

When you are done, these must all be true:

- [ ] `pnpm install` succeeds with pnpm, fails with npm or yarn
- [ ] `pnpm check` reports 0 errors, 0 warnings
- [ ] `pnpm lint` reports 0 errors
- [ ] `pnpm db:reset && pnpm db:seed` completes in under 15 seconds
- [ ] `pnpm dev` starts the app with zero console errors
- [ ] `pnpm test` passes 100%
- [ ] `pnpm test:e2e` passes 100%
- [ ] Every persona at `/dev/login-as/<persona>` logs in with the expected entitlements
- [ ] Stripe test checkout end-to-end: signup → checkout → webhook → entitlement granted → email sent
- [ ] Refund flow: Stripe refund → webhook → entitlement revoked within 1s → email sent
- [ ] Lighthouse 95+ on landing, pricing, and one authed page
- [ ] `svelte:svelte-autofixer` reports zero issues on every component
- [ ] All 10 `docs/*.md` files present, accurate, and reflect the actual codebase
- [ ] Zero `any`, zero `@ts-ignore`, zero `console.log`, zero hardcoded secrets in final commit
- [ ] Motion-powered animations respect `prefers-reduced-motion`
- [ ] Dev routes not present in production bundle (verify with `pnpm build && grep`)

---

## BEGIN

Start with Phase 1, Step 1. Work one step at a time. Do not skip ahead. Do not take shortcuts. Do not ask for permission on implementation details — only on decisions that change the locked stack or product.

Report back at the end of each phase with:
- What was built
- What tests pass
- What issues you hit and how you resolved them
- Any PE7 violations you identified and fixed

When all 8 phases are complete and every success criterion is met, report "PHASE 8 COMPLETE — READY FOR REVIEW".
