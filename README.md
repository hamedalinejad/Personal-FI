# Personal-FI

**Docs entry:** [docs/README.md](docs/README.md) → PRODUCT → ARCHITECTURE → FINANCIAL-CORE → … → modules/

**Live status:** [docs/QUALITY-STATUS.md](docs/QUALITY-STATUS.md)  
**Process:** [docs/DOCUMENTATION-STANDARD.md](docs/DOCUMENTATION-STANDARD.md)

Production: **NO-GO** until RELEASE_PROVEN.


**Start here (human):** `docs/PRODUCT.md` → `docs/DEVELOPMENT.md` → `docs/QUALITY-STATUS.md`  
**Machine:** `docs/core/db/schema.sql`, registries, fixtures.

Production: **NO-GO** until release evidence computed.

# Personal-FI

Offline-first personal accounting & investments (Iran-aware).

## Project phase (canonical)

```text
IMPLEMENTATION_SCAFFOLD_PHASE
```

- **Specification authority:** `docs/**` (contracts win over informal notes)
- **Runtime:** `src/**` exists as scaffold / partial vertical slices — **not** production release
- **Production:** **NO-GO** until release gates (field no-loss, golden fixtures, recovery) are green

## Developer start

```text
docs/DEVELOPER-HANDOFF.md
```

```bash
npm ci
npm test
npm run gates
```

| Full-product coding | Allowed against docs + existing scaffold |
| Production release | **NO-GO** |

## Feature status (HEAD)

| Package | Status |
|---------|--------|
| Core | scaffold / partial |
| Loan | strongest vertical (coding reference) |
| Crypto | partial buy slice |
| Funds | partial subscribe slice |
| Stocks | partial buy slice |
| Metals | partial buy slice |
| Full product | not integrated / not release-proven |

Loan under `src/features/loan` is the reference implementation pattern.


## Phase declaration

Documentation-first + implementation scaffold / reference runtime + **pre-production**. Production: **NO-GO**.
See `docs/core/authority/SCAFFOLD-FINAL-STATUS.md`.
