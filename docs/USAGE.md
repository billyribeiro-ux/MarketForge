# MarketForge — PE7 Ultimate App Prompt Bundle

> Everything you need to hand to Claude Code to build MarketForge to PE7 standard.

---

## What's in this bundle

```
pe7-ultimate-app/
├── PROMPT.md           ← THE prompt. Paste this as your first message.
├── .env.example        ← Every env var the app will need
└── docs/
    ├── SPEC.md         ← Product contract
    ├── README.md       ← Setup + scripts + structure
    ├── ARCHITECTURE.md ← System design + rationale
    ├── TESTING.md      ← Personas + coupons + flows
    ├── CONTRIBUTING.md ← Code standards + commit conventions
    ├── DEPLOYMENT.md   ← Staging + production + launch checklist
    ├── RESTORE.md      ← Backup + recovery
    ├── SECURITY.md     ← Security policy + practices
    ├── CHANGELOG.md    ← Version history (empty, to be filled as releases ship)
    └── INDEX.md        ← Docs map
```

---

## How to use

### Step 1. Set up Claude Code

Make sure you have these connected in your Claude Code session:
- **Svelte MCP** (`https://mcp.svelte.dev/mcp`) — already in your connected list
- Anthropic API access
- Your local project folder as the working directory

### Step 2. Create the empty project folder

```bash
mkdir marketforge && cd marketforge
git init
```

### Step 3. Copy the docs + env example into the project

```bash
cp -r /path/to/pe7-ultimate-app/docs ./docs
cp /path/to/pe7-ultimate-app/.env.example ./.env.example
```

Commit:
```bash
git add -A && git commit -m "docs: initial PE7 documentation and env scaffold"
```

### Step 4. Start the Claude Code session

Paste the contents of `PROMPT.md` as your first message. Claude Code will read the docs, understand the full spec, and start executing Phase 1.

### Step 5. Let it run

Phase by phase. It will:
- Report progress at the end of each phase
- Run `svelte:svelte-autofixer` on every component
- Generate icons from SVGs via `svg-to-svelte`
- Wire up Motion-powered animations on marketing pages
- Enable Svelte Agentation in dev mode only
- Tree-shake dev-only routes from production builds
- Write E2E tests for every critical flow

### Step 6. Review at "PHASE 8 COMPLETE — READY FOR REVIEW"

When Claude Code hits that marker, the full success-criteria checklist from `PROMPT.md` should pass. Verify each one yourself.

---

## What to expect

- **Phase 1–4** is infrastructure. Expect ~1–2 days of Claude Code time.
- **Phase 5** is the actual product. Varies with complexity.
- **Phase 6–8** is marketing, polish, ship. ~1–2 days.

The agent will not skip ahead. The agent will not take shortcuts. The agent will push back if anything in the request violates the PE7 rules laid out in `CONTRIBUTING.md`.

---

## Your job during the build

- Respond when the agent asks about stack changes, entitlement model changes, or billing changes. Everything else, it decides.
- Review the phase-end reports. If anything looks off, push back before next phase.
- Do not add features mid-build. Every new requirement resets the testing surface. Add to v1.1.

---

## When it's done

You have:
- A production-ready SvelteKit 2 membership platform
- Complete test coverage (unit + E2E)
- Full docs that match the code
- CI pipeline enforcing every standard
- Seed data covering every billing state
- Motion-powered marketing site
- Typed icon library generated from SVGs
- Zero TypeScript errors, zero warnings, zero hacks

Then: staging deploy → 7-day staging bake → production launch per `DEPLOYMENT.md`.
