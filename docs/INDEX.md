# INDEX.md

> Map of every documentation file.

| File | Purpose | Update When |
|---|---|---|
| `SPEC.md` | Product contract | Product definition changes |
| `../README.md` | Repo setup entry (root) | Scripts or structure change |
| `ARCHITECTURE.md` | System design + rationale | Non-obvious design call made |
| `TESTING.md` | Personas, coupons, flows | New persona, flow, or test added |
| `DEPLOYMENT.md` | Staging + prod procedures | Infrastructure or process changes |
| `RESTORE.md` | Backup + recovery | After every restore drill |
| `CONTRIBUTING.md` | Code standards | Standards evolve |
| `SECURITY.md` | Security policy | After any incident |
| `CHANGELOG.md` | Version history | Every release |
| `INDEX.md` | This file | Rarely |

## Fill-In Order

1. `SPEC.md` — before any code
2. `README.md` — as scripts scaffold
3. `ARCHITECTURE.md` — as design decisions are made
4. `TESTING.md` — alongside seed script
5. `CONTRIBUTING.md` — before external contributors
6. `DEPLOYMENT.md` — before first staging deploy
7. `RESTORE.md` — before first prod deploy
8. `SECURITY.md` — before first prod deploy
9. `CHANGELOG.md` — at first tagged release

## The Rule

Docs next to the code stay accurate. Docs in Notion or Confluence rot in 6 months. Every PR that changes the system updates the matching doc in the same PR.
