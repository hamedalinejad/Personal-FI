# Personal-FI

Offline-first personal accounting & investments (Iran-aware).

## Developer start

```text
docs/DEVELOPER-HANDOFF.md
```

```bash
npm ci
npm test
npm run gates
```

| Coding full product | **READY** |
| Production release | **NO-GO** until CI release evidence |

Loan package under `src/features/loan` is the reference implementation pattern.
Scaffolds: `src/features/{crypto,funds,stocks,metals}`.
