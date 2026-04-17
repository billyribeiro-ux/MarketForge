# SECURITY.md

> Security policy + practices.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue.**
Email `security@marketforge.io` with reproduction steps + impact.
Response within 48 hours.

## Scope

**In scope:** main app, API endpoints, auth, billing, entitlements, data exposure.
**Out of scope:** DoS via traffic flooding, social engineering, third-party services, publicly disclosed CVEs in deps.

## Practices

### Auth
- Better Auth handles argon2id hashing + session management
- HTTP-only + Secure + SameSite=Lax cookies
- Rate limits on login (5/15min/IP), signup (3/h/IP), password reset (3/h/IP+email)
- Generic login error messages (no account enumeration)

### Authorization
- Centralized middleware enforces entitlements on every protected route
- IDOR prevented via user-scoped queries

### Data
- TLS + HSTS everywhere
- Payment data never touches our servers (Stripe only)
- PII minimized (email + optional display name)
- DB encrypted at rest
- Backups encrypted

### Dependencies
- `pnpm audit` in CI on every PR
- Dependabot/Renovate for advisories
- Security updates merged within 7 days

### Secrets
- Never in repo (gitleaks in pre-commit + CI)
- Hosting secret manager only
- Rotated annually or on suspected compromise

### Headers
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: <strict CSP>
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Webhooks
- Stripe signatures verified on every request
- Unsigned webhooks rejected
- Handlers idempotent on `event.id`

### Rate Limits
| Endpoint | Limit |
|---|---|
| `POST /login` | 5 / 15min / IP |
| `POST /signup` | 3 / hour / IP |
| `POST /password-reset` | 3 / hour / IP + email |
| `POST /api/checkout` | 10 / minute / user |

---

## Incident Response

1. **Contain:** rotate secrets.
2. **Preserve:** DB snapshot + log capture.
3. **Investigate:** audit_log, Sentry, hosting logs, Stripe events.
4. **Eradicate:** patch vulnerability.
5. **Recover:** force password resets if needed.
6. **Notify:** affected users within 72h (GDPR).
7. **Post-mortem:** published internally.
