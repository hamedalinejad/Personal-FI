# ARCHITECTURE (sole architecture owner)

**Status:** CURRENT · **Class:** CURRENT

Sole architecture authority. Absorbs Technical-Architecture.md, ARCHITECTURE-LOCKED.md, Module-Architecture, Layer-Separation, Domain-Dependency prose as **non-authoritative** after merge.

## 1. Layer stack
```
UI (≤6 routes + sheets)
  → Feature Public API
    → Domain / Feature ledger tables
      → Financial Core (operation kernel)
        → Fee / CostBasis / Schedule / CA engines (as applicable)
          → CashSettlementPort
            → Journal + Invariants
              → Persistence Port
                → SQLite (Node) | Browser adapter
```

## 2. Module boundaries
| Layer | May depend on | Must not |
|-------|---------------|----------|
| UI | Feature public-api only | SQL, Core internals, other feature internals |
| Feature | Core ports, own ledger | Other feature internals, direct MetaTrader/broker APIs |
| Core | Persistence, money, pure domain | Features |
| Persistence | schema, fs/db | Business policy |

## 3. Public API boundary
Each feature exports `public-api/` only. Cross-feature calls go through public-api or Core orchestration — never `../otherFeature/commands/`.

Enforced by `scripts/lint-boundaries.js` (blocking gate).

## 4. Port definitions
| Port | Responsibility |
|------|----------------|
| **CashSettlementPort** | Map domain cash intent → balanced journal legs on Core accounts |
| **PersistencePort** | `persistOperation` / `loadOperation` / openDb; Node SQLite vs browser adapter |
| **Price provider** | Observations into `price_history`; never mutates posted costs |
| **FX provider** | Rates with as-of; historical rebuild uses stored rates |

## 5. Adapter responsibilities
- **Node worker:** SQLite, BEGIN IMMEDIATE, draft→posted promote, result_json after journal.
- **Browser adapter:** same surface; durable ACK after publish; single-writer (tabWriter).
- **MQL/broker:** out of scope for Personal-FI Core (investment features use domain ports).

## 6. Read/write separation
- **Writes:** only via `runAtomicFinancialOperation` (or documented Core helpers under that boundary).
- **Reads:** queries/reports; **query purity** — no journal side effects.

## 7. Transaction ownership
Operation engine owns the atomic SQLite transaction. Features may register `withinTransaction(db)` for domain rows **inside** that boundary only.

## 8. Write pipeline (locked)
```
UI → Feature Public API
  → validation
  → normalize decimal/date/identity
  → resolve instrument/account/party
  → build Financial Operation (explicit status)
  → calculation context / engine_versions
  → Fee Engine (when applicable)
  → domain policy mapper
  → CostBasis / Schedule / CA
  → balanced journal
  → invariants
  → single SQLite transaction
  → durable persist ACK
  → canonical API envelope
  → rebuild projections
```

## 9. Runtime dependency graph
```
features/*  →  core/domain, core/money, core/persistence (port)
core/*      →  not features/*
UI          →  features/*/public-api only
```

## 10. Browser / Node split
| Path | DB | Status |
|------|-----|--------|
| Node | `personal-fi.sqlite` | primary implementation path |
| Browser | sql.js + IndexedDB via persistence port | protocol harness proven; full browser E2E OPEN |

## 11. Build / test boundary
- Unit/domain tests: Node.
- Gates: `npm run gates` (boundaries, inventory, fixtures, money lint).
- Fixtures under `fixtures/` with non-empty expected or `status: DEFERRED`.

## 12. Cash truth (architecture statement)
**Cash is derived from Core journal truth.** Feature balances are projections.

## 13. Supersedes
`Technical-Architecture.md`, `docs/core/ARCHITECTURE-LOCKED.md`, and similar — **MERGE pointers only**.


## 14. Anti-patterns (forbidden)
* Feature imports another feature internal path
* UI constructs journal lines
* Float money arithmetic
* Advancing “paid” tax without payTax
* Using NAV as liquidation price
* Collapsing tradeDate into settlementDate
* Treating archive/** as requirements

## 15. Failure containment
* Risk/ops kill paths independent of feature UI
* Persistence failure does not mark operation posted
* Model/feature crash must not leave unbalanced journal (transaction rollback)

## 16. Rebuild determinism
same ledger + engineVersions + asOf/context → same outputs; no live provider calls in historical path.
