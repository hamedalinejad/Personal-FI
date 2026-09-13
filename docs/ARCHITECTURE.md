# ARCHITECTURE (sole architecture owner)

**Status:** CURRENT

## 1. Layer stack
```
UI (≤6 routes + sheets)
  → Feature Public API
    → Domain / Ledger
      → Financial Core (operation kernel)
        → CashSettlementPort
          → Journal + Invariants
            → Persistence Port
              → SQLite (Node) | Browser adapter (OPEN)
```

## 2. Dependency rules
* Feature A ↛ Feature B internals (public-api only).
* Core ↛ Features.
* UI ↛ SQL.
* No feature-owned cash ledger.

## 3. Write pipeline
Validate → Normalize → Identity resolve → Operation → Domain calc → Journal → Invariants → **one SQLite transaction** → durable persist → result → projections.

## 4. Read path
Queries/reports read only; query purity required.

## 5. Ports
* CashSettlementPort — settlement plan → journal legs
* PersistencePort — Node SQLite vs browser
* Price/FX providers — observations only; posted ops keep historical rates

## 6. Transaction ownership
Operation engine owns atomic boundary; features supply prepareDomain/withinTransaction under that boundary.

## 7. Standalone
Same Core + hidden settlement accounts; Accounts UI optional.

## 8. Runtime split
Node: SQLite production path. Browser: sql.js+IDB OPEN until proven.

## 9. Supersedes
Technical-Architecture.md · ARCHITECTURE-LOCKED.md prose as secondary authority.
