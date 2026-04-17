# MarketForge

Institutional-style SvelteKit membership stack: Better Auth, Stripe (Checkout + webhooks), Drizzle/Postgres, Resend, Plausible, Sentry, PE7 CSS (OKLCH tokens, no Tailwind).

## Requirements

- Node 22+
- pnpm 10 (`corepack enable` or install pnpm)
- Docker (for local Postgres) or any Postgres 16 URL

## Quick start

```bash
cp .env.example .env.local
# Fill BETTER_AUTH_SECRET, DATABASE_URL, optional Stripe/Resend/Sentry/Plausible

pnpm install
pnpm db:reset    # docker compose + migrate + seed (see docker-compose.yml)
pnpm dev
```

- App: http://localhost:5173  
- Dev personas: http://localhost:5173/dev/login-as/&lt;persona&gt; (requires `DEV_TEST_PASSWORD`)  
- Docs: [`docs/INDEX.md`](docs/INDEX.md)

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Vite dev server |
| `pnpm build` | Regenerate icons, then production build |
| `pnpm check` | `svelte-check` + sync |
| `pnpm lint` / `pnpm lint:fix` | Biome |
| `pnpm test` / `pnpm test:unit` | Vitest |
| `pnpm test:e2e` | Playwright — port 5173 in CI, 4173 locally unless `PLAYWRIGHT_TEST_PORT`; needs DB + auth env |
| `pnpm test:e2e:local` | Loads `.env.local` then runs Playwright (local default) |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:seed` | Seed dev personas + catalog |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm icons:generate` | `raw/*.svg` → `src/lib/icons/generated/*.svelte` |
| `pnpm backup:db` | `pg_dump` to `./backups` (needs `DATABASE_URL`) |
| `pnpm stripe:listen` | Forward webhooks to local `/api/webhooks/stripe` |

## Documentation

All product/engineering docs live in **`docs/`** (see [`docs/INDEX.md`](docs/INDEX.md)): `SPEC`, `ARCHITECTURE`, `TESTING`, `DEPLOYMENT`, `RESTORE`, `CONTRIBUTING`, `SECURITY`, `CHANGELOG`.

## Conventional commits

This repo uses [Conventional Commits](https://www.conventionalcommits.org/). Validate messages with Commitlint (e.g. hook `commitlint --edit` on `commit-msg`).

## Stack highlights

- **Motion-style UI:** [`@humanspeak/svelte-motion`](https://motion.svelte.page) on marketing + `prefers-reduced-motion` via `svelte/motion`.
- **Icons:** Iconify (`@iconify/svelte`) + generated components from `src/lib/icons/raw/`.
- **Email:** Resend SDK + Svelte SSR templates under `src/lib/server/email/templates/`.
- **Mocks:** MSW wired for Vitest (`tests/msw-setup.ts`).

## License

Private — All rights reserved unless otherwise stated.
