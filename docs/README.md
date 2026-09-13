# Personal-FI Documentation

**One entry path. No archaeology.**

## Coding handoff chain
```
PRODUCT
 → ARCHITECTURE
 → FINANCIAL-CORE
 → DATA-MODEL
 → API
 → REPORTING
 → OFFLINE-RELEASE
 → DEVELOPMENT
 → modules/<feature>.md
 → schema (docs/core/db/schema.sql)
 → fixtures
 → tests
```

## Global owners (8)
| Doc | Question |
|------|----------|
| [PRODUCT.md](./PRODUCT.md) | What is the product? |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | How is the system layered? |
| [FINANCIAL-CORE.md](./FINANCIAL-CORE.md) | What is the financial rule? |
| [DATA-MODEL.md](./DATA-MODEL.md) | What are the fields / identities? |
| [API.md](./API.md) | What is the API? |
| [REPORTING.md](./REPORTING.md) | What is the report rule? |
| [OFFLINE-RELEASE.md](./OFFLINE-RELEASE.md) | Offline, recovery, release proof? |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | How do I change the repo? |

## Modules (11)
[modules/](./modules/) — one human-facing spec per feature.

## Machine (not prose authority)
`docs/core/db/` · `docs/core/registry/` · `docs/core/fixtures/` · `/fixtures` · tests

## History
[archive/AUDIT-HISTORY.md](./archive/AUDIT-HISTORY.md) only. Full text in git.

## Live gates
[QUALITY-STATUS.md](./QUALITY-STATUS.md)
