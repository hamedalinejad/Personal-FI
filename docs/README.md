# Documentation index

**Project state:** Specification-locked **reference implementation scaffold** — executable Core/feature code, tests, and gates exist; **not** a release-proven product. Future work extends this scaffold; do **not** reimplement the kernel from zero.

**One concept → one owner.** History lives in Git. Proof lives in tests/fixtures. Status lives in QUALITY-STATUS + registries.

## Structure
See [DOCUMENTATION-STANDARD.md](./DOCUMENTATION-STANDARD.md).

## Programmer handoff (start here)
Any implementer should be able to ship a feature using **only**:

1. [PRODUCT.md](./PRODUCT.md) — scope, six routes, **standalone editions**
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — layers, public-api boundary, command pipeline
3. [FINANCIAL-CORE.md](./FINANCIAL-CORE.md) — money, FX, journal, fee, cost basis, reversal
4. [DATA-MODEL.md](./DATA-MODEL.md) — identity, SoT, relationships, no-field-loss
5. [API.md](./API.md) — envelope, errors, idempotency
6. [REPORTING.md](./REPORTING.md) — posted-only statements
7. [OFFLINE-RELEASE.md](./OFFLINE-RELEASE.md) — persistence, backup, recovery
8. [DEVELOPMENT.md](./DEVELOPMENT.md) — DoD, freeze phases, forbidden docs
9. [modules/&lt;feature&gt;.md](./modules/) — feature-specific rules + standalone behavior
10. Machine: `core/db/schema.sql` · `core/registry/command-catalog.json` · `fixtures/` · `src/**/tests`

**No** BUG/P0/AUDIT Markdown is authority.

### Modular / standalone
- Loan-only, Crypto-only, Stocks-only, Funds-only, Metals-only, Full — see PRODUCT.
- Same Financial Core under every edition; license gates capability only.
- UI never talks to SQL; only `features/*/public-api`.

### Read order (full)
1. PRODUCT → 2. ARCHITECTURE → 3. FINANCIAL-CORE → 4. DATA-MODEL → 5. API → 6. REPORTING → 7. OFFLINE-RELEASE → 8. DEVELOPMENT → 9. modules → 10. schema/registry/fixtures/tests

Live gates: [QUALITY-STATUS.md](./QUALITY-STATUS.md)

## Coding may start (Core + Loan)
Owner tree is intentionally small. Remaining work is proof depth (goldens, recovery, browser), not more Markdown files. See DEVELOPMENT.md coding sequence steps 1–4.
