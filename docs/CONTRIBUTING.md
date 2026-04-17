# CONTRIBUTING.md

> Code standards, commit conventions, PR process. Non-negotiable — these exist so the codebase survives 10 years.

---

## Hard Requirements

### TypeScript

- Strict mode. `"strict": true` — no exceptions.
- Zero `any`. Use `unknown` and narrow if genuinely needed.
- Zero `@ts-ignore` / `@ts-expect-error`.
- Zero `as` casts unless the compiler cannot know what you know (and document why).

### Package Manager

- pnpm only. Enforced in `package.json`:
  ```json
  "scripts": { "preinstall": "npx only-allow pnpm" }
  ```

### Svelte

- Svelte 5 runes-only: `$state`, `$derived`, `$effect`, `$props`, `$bindable`
- No legacy reactive syntax (`$: foo = bar`)
- `{@attach}` over `use:action`
- `{#snippet}` + `{@render}` over slots
- Run `svelte:svelte-autofixer` via MCP before committing any component

### CSS

- PE7 architecture only: `@layer` cascade, OKLCH colors, logical properties, scoped `--_` custom properties
- Zero Tailwind, zero utility frameworks
- Zero hardcoded colors (every color is a token)
- Zero hardcoded breakpoints (use the 9-tier scale)
- Zero hardcoded spacing (use the spacing scale)

### Icons

- Iconify with Phosphor or Carbon sets for standard UI
- svg-to-svelte generated components for project icons
- Zero Lucide

### Animation

- Motion (motion.dev) only
- GPU-accelerated transforms only — never animate `width`, `height`, `top`, `left`
- Every animation respects `prefers-reduced-motion`

### Entitlements

- Never read `user.plan`. Read from the `entitlements` table.
- Never grant entitlements from UI success pages. Webhooks only.

---

## Commit Convention

Conventional Commits, enforced by commitlint.

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change, no behavior change |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `test` | Tests only |
| `chore` | Tooling, deps, config |
| `build` | Build system |
| `ci` | CI config |
| `style` | Formatting only |

### Examples

```
feat(billing): add lifetime purchase flow
fix(auth): prevent session fixation on login
refactor(entitlements): extract grant logic to service
perf(pricing): cache Stripe prices for 60s
docs(testing): add webhook idempotency flows
```

---

## Branching

- `main` — always deployable
- `feat/<n>` — features
- `fix/<n>` — bug fixes
- `chore/<n>` — tooling/deps
- `hotfix/<n>` — emergency production fixes

Branches are short-lived. Target under 3 days each.

---

## Pull Request Process

### Before opening

- [ ] `pnpm check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm test:e2e` passes locally for affected flows
- [ ] `svelte:svelte-autofixer` run on every changed Svelte file
- [ ] No `console.log` / `debugger` left behind
- [ ] New code has tests
- [ ] `docs/CHANGELOG.md` updated for user-visible changes

### PR template

```markdown
## What
<One-paragraph description.>

## Why
<Why this change is necessary. Link to issue or SPEC.md section.>

## How
<Non-obvious implementation decisions.>

## Testing
<How you verified this works. Which personas you tested against.>

## Screenshots
<UI changes only.>

## Migration impact
<Schema changes, breaking API changes, env var changes. "None" if none.>
```

### Size limits

- Target: under 400 lines changed
- Over 800 lines → split the PR
- Pure refactor PRs (many files, no behavior change) are exempt

### Review requirements

- 1 approval
- All CI checks green
- No unresolved review comments
- Rebased on latest `main`

---

## Code Organization

### Server-only code

Anything touching the DB, Stripe, email, or secrets lives in `src/lib/server/`. Vite guarantees this code never ships to the client.

```
src/lib/server/
├── auth.ts            # Better Auth config
├── db/                # Drizzle schema + queries
├── stripe/            # Stripe client + webhook handlers
├── email/             # Resend + Svelte email templates
└── entitlements/      # Grant, revoke, check logic
```

### Client-safe utilities

`src/lib/utils/` for pure functions usable anywhere.

### Components

- One component per file
- Co-located styles in `<style>` blocks
- Complex components: `Component/Component.svelte`, `Component/Component.test.ts`, `Component/index.ts`

---

## Testing Standards

- Unit tests for pure logic (billing math, entitlement grants, auth flows)
- Integration tests for DB queries and webhook handlers
- E2E tests for critical user flows (see `TESTING.md`)
- Test names describe **behavior**, not implementation

---

## Performance Rules

- No N+1 queries. Use joins or explicit batch loads.
- No unindexed queries in hot paths.
- No synchronous HTTP calls in request handlers. Queue or async.
- Lighthouse 95+ on every public page. Regressions block the PR.

---

## Security Rules

- Never log secrets. Session tokens, passwords, API keys — redacted.
- Never trust client input. Validate every request with Zod.
- Never `SELECT *` in production code. Explicit columns.
- Never concatenate SQL. Parameterized only.
- Never store PII in logs beyond what's necessary for debugging.

---

## Auto-Rejected In Review

No discussion, please fix:

- `any` type usage
- `@ts-ignore` / `@ts-expect-error`
- Hardcoded colors, breakpoints, prices
- `user.plan` reads
- `console.log` in committed code
- Tailwind classes
- Lucide icons
- Missing tests on new billing or auth logic
- Non-idempotent webhook handlers
- Entitlement grants outside of webhook handlers
- Secrets in the repo
- Migrations that lock tables with active traffic
- Animations that aren't GPU-accelerated
- Animations without `prefers-reduced-motion` respect
