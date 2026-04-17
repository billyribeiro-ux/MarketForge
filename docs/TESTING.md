# TESTING.md

> Every seeded persona, every coupon state, every critical flow.
> If a state can happen in production, it is seeded and one-click testable.

---

## Quick Commands

```bash
pnpm db:reset && pnpm db:seed     # Fresh DB + Stripe test mode (~15s)
pnpm stripe:listen                # Forward webhooks to localhost
pnpm test                         # Vitest unit tests
pnpm test:e2e                     # Playwright E2E (needs DATABASE_URL + auth env in shell, or use next line)
pnpm test:e2e:local               # Loads `.env.local` then Playwright (recommended locally)
pnpm test:e2e:ui                  # Playwright with UI
```

Dev login: `http://localhost:5173/dev/login-as/<persona>`
Password for all personas: `.env.local` → `DEV_TEST_PASSWORD`

---

## Auth Personas (6)

| Persona | Email | Entitlements | Purpose |
|---|---|---|---|
| free | `free@test.dev` | none | Paywall tests, upgrade prompts |
| pro | `pro@test.dev` | `pro_access` | Standard paying user |
| pro-expired | `pro-expired@test.dev` | none (expired) | Post-expiry UX |
| trial | `trial@test.dev` | `pro_access` (trial) | Trial countdown UI |
| admin | `admin@test.dev` | `pro_access`, `admin` | Admin dashboard access |
| banned | `banned@test.dev` | none, banned flag | Middleware blocking |

---

## Billing Personas (12)

### Active Subscriptions (6)

| Persona | State | Purpose |
|---|---|---|
| sub-monthly-active | Monthly, paid, renewing | Happy path |
| sub-monthly-cancelled-still-active | Cancelled, access until period end | Cancel UX |
| sub-monthly-past-due | Payment failed, in dunning | Past-due banner |
| sub-quarterly-active | Quarterly, paid | Quarterly-specific logic |
| sub-yearly-active | Yearly, paid + `indicator_vault` | Yearly entitlements |
| sub-yearly-trial | Trialing, card on file | Trial state |

### Trial Edge Cases (2)

| Persona | State | Purpose |
|---|---|---|
| sub-yearly-trial-expiring-tomorrow | Trial ends in <24h | Trial-end email trigger |
| sub-yearly-trial-no-card | Trialing, no payment method | Silent-charge prevention |

### One-Time Purchases (3)

| Persona | State | Purpose |
|---|---|---|
| purchase-lifetime | Lifetime, paid + all entitlements | Forever access |
| purchase-lifetime-refunded | Lifetime refunded, all entitlements revoked | Revocation UX |
| purchase-lifetime-disputed | Chargeback filed, entitlements revoked | Dispute flow |

### Cross-Product (1)

| Persona | State | Purpose |
|---|---|---|
| upgrade-monthly-to-yearly | Mid-cycle upgrade with proration credit | Proration test |

---

## Coupon States (12)

| Code | Behavior | Purpose |
|---|---|---|
| `DEV_PERCENT_OFF` | 100% off any product | Happy path discount |
| `DEV_FIXED_OFF` | $20 off any product | Fixed discount |
| `DEV_SUB_ONLY` | Subscriptions only | Rejection on lifetime |
| `DEV_LIFETIME_ONLY` | Lifetime only | Rejection on subscription |
| `DEV_FIRST_MONTH_ONLY` | First invoice only | Renewal re-charges full price |
| `DEV_FOREVER` | Every renewal | Persistent discount |
| `DEV_EXPIRED` | Past expiry | Expired rejection |
| `DEV_USED_UP` | Max redemptions reached | Exhausted rejection |
| `DEV_DISABLED` | Manually disabled | Disabled rejection |
| `DEV_WRONG_CURRENCY` | Wrong currency | Currency mismatch |
| `DEV_MIN_AMOUNT` | Requires $100+ cart | Under-minimum rejection |
| `DEV_STACKED` | Second coupon attempt | Stacking prevention |

---

## Critical Flows

Each flow has a corresponding Playwright test in `tests/e2e/`.

### Auth Flows

- [ ] Signup → email verification → first login
- [ ] Login with correct password
- [ ] Login with wrong password → generic error, no account enumeration
- [ ] Password reset request → email → reset → login with new password
- [ ] Email verification link expires after 30 minutes
- [ ] Session expiry after 30 days of inactivity
- [ ] Logout invalidates session cookie AND server-side session
- [ ] Banned user cannot log in
- [ ] 2FA enrollment + verification + backup code usage
- [ ] Passkey enrollment + usage

### Subscription Flows

- [ ] Signup → monthly checkout → webhook → entitlement granted
- [ ] Signup → quarterly checkout → webhook → entitlement granted
- [ ] Signup → yearly checkout → webhook → `pro_access` + `indicator_vault` granted
- [ ] Trial start → trial end with card → charged → entitlement continues
- [ ] Trial start → trial end no card → downgraded to free (no silent charge)
- [ ] Renewal success → invoice paid → entitlement extended → receipt email
- [ ] Renewal fails → dunning emails → grace period → cancellation → entitlement revoked
- [ ] Cancel mid-period → access until period end → revoked
- [ ] Reactivate cancelled sub before period end
- [ ] Upgrade monthly → yearly mid-cycle → proration credit applied
- [ ] Downgrade yearly → monthly → scheduled at period end

### One-Time Purchase Flows

- [ ] Purchase lifetime → webhook → all 3 entitlements granted forever
- [ ] Refund lifetime → entitlements revoked within 1s
- [ ] User buys lifetime while on monthly sub → monthly cancelled → credit issued
- [ ] Duplicate lifetime purchase attempt → blocked with clear error
- [ ] Chargeback on lifetime → entitlements revoked, account flagged

### Coupon Flows

- [ ] Valid coupon at checkout → discount reflected in invoice
- [ ] Expired coupon → rejection message
- [ ] Used-up coupon → rejection message
- [ ] Disabled coupon → rejection message
- [ ] Subscription-only on lifetime → rejection
- [ ] First-month-only → renewal charges full price
- [ ] Stacking attempt → second coupon rejected

### Entitlement-Gated Content

- [ ] Free user hits `/app/indicators` → UpgradePrompt shown
- [ ] Pro user hits `/app/indicators` → UpgradePrompt shown (no indicator_vault)
- [ ] Yearly user hits `/app/indicators` → full access
- [ ] Lifetime user hits `/app/live` → full access
- [ ] Yearly user hits `/app/live` → UpgradePrompt (no live_room)

### Admin Flows

- [ ] Non-admin cannot access `/app/admin/*`
- [ ] Admin can manually grant entitlement → audit log entry
- [ ] Admin can manually revoke entitlement → audit log entry
- [ ] Admin can view user billing history

### Webhook Idempotency

- [ ] Replay `checkout.session.completed` twice → entitlement granted once
- [ ] Replay `charge.refunded` twice → entitlement revoked once
- [ ] Out-of-order webhook delivery handled correctly

---

## Manual Smoke Test (Before Every Release)

1. `pnpm db:reset && pnpm db:seed` — under 15 seconds
2. Log in as each of the 6 auth personas, verify UI state
3. Log in as each of the 12 billing personas, verify UI state
4. Run full Playwright suite: `pnpm test:e2e`
5. Stripe test mode dashboard: products, prices, coupons present
6. One real test checkout with `4242 4242 4242 4242`
7. Welcome email received in Resend dashboard
8. Refund the test charge — verify entitlement revoked + email sent

---

## Stripe Test Cards

| Card | Behavior |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires 3DS authentication |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0341` | Attaches but fails on charge |
| `4000 0000 0000 0002` | Generic decline |

---

## PE7 Testing Rules

1. Every production state has a seeded persona.
2. Every persona is one-click accessible via `/dev/login-as/`.
3. Every webhook handler is idempotent, keyed on Stripe event ID.
4. Every critical flow has a Playwright test in CI.
5. `pnpm db:reset && pnpm db:seed` completes in under 15 seconds.
6. No test accounts exist in the production database. Ever.
7. Dev-login route tree-shaken from production builds.
