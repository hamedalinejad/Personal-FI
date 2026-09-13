# ARCHITECTURE (sole architecture owner)

**Status:** CURRENT · Normative for layers and boundaries.  
**Not normative for:** field lists, fee formulas, report formulas.

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
* Feature A must not import Feature B internals (only public-api).
* Core must not import features.
* UI never writes SQL directly.
* No second cash ledger in features.

## 3. Write pipeline (canonical)
Validate → Normalize → Identity resolve → Operation → Domain calc (fee/tax/basis/schedule/CA) → Journal → Invariants → **one SQLite transaction** → durable persist → result → projections.

## 4. Read path
Queries/reports read journal + ledgers; never mutate. Query purity enforced in tests/lints.

## 5. Standalone
Same Core + hidden internal cash accounts via settlement adapter. UI may omit Accounts; Core remains.

## 6. Ports
CashSettlementPort · PersistencePort · Price/FX providers (observation only, not historical SoT for posted ops).

## 7. Supersedes
Technical-Architecture.md architecture sections → absorb then ARCHIVE.
