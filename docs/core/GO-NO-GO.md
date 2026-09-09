# Go / No-Go

**Team entry:** `docs/DEVELOPER-HANDOFF.md`

## Coding

| Scope | Decision |
|-------|----------|
| Core | **GO** |
| Loan | **GO** (pattern + tests green) |
| Crypto / Funds / Stocks / Metals / Cheque | **GO to implement** (specs locked; copy Loan pattern) |
| UI / PWA shell | **GO after** data commands for each vertical |

## Production release

| | |
|-|-|
| Tag / ship to end users | **NO-GO** |
| Until | GitHub Actions `npm ci` + full gates green + recovery evidence on release checklist |

## Live residual (engineering)

See `OPEN-ISSUES-REGISTER.md` — not documentation blockers.
