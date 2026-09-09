# Personal-FI

Offline-first personal accounting + investment system (Iran-aware).

## Status

| Scope | Status |
|-------|--------|
| **Coding (Loan + Core)** | READY |
| **Production release** | **NO-GO** |
| **Other features (Crypto/Stocks/…)** | SPECIFIED — after Loan RELEASE-PROVEN |

## Start here (developers)

```text
docs/DEVELOPER-HANDOFF.md
```

Then:

```bash
npm ci          # or: npm install
npm test
npm run gates
```

## Architecture (one-liner)

```text
Feature UI/API → Domain → Atomic Operation → Journal + Cash Port → SQLite txn → Rebuildable reports
```

- One cash SoT: `fin_accounts` + `fin_journal_lines`
- One journal · Decimal strings only · Posted facts immutable
- Feature independence · ≤6 navigation pages (`docs/00-Product/Pages-IA.md`)

## Repo layout

```text
docs/          specifications (authority chain)
src/core/      money, operation, persistence, engines
src/features/loan/   first vertical (executable)
scripts/       gates, schema drift, inventory
```

## License / sharing

Designed for offline single-user and future license editions (loan-only, crypto-only, …).
