# Crypto

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Crypto holdings and trades with venue/network scope; cash via CashSettlementPort.

## 2. Scope
Personal offline edition; Core journal is cash/accounting truth.

## 3. Supported v1 behavior
| Item | Rule |
|------|------|
| buy/sell/transfer | implemented subset |
| fee | cash or asset (feeFundingKind) |
| identity | instrumentId + venue/network |
| holding | rebuildable from transactions |


## 4. Unsupported / Deferred behavior
Ghost exchange cash ledgers · provider symbol as instrument identity · full C2C without economic_kind

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Primary surface under product IA for Crypto.

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
inv_crypto_* · ref_instruments · journal

## 9. Field ownership
Feature RAW fields owned here; journal owned by FINANCIAL-CORE.

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
crypto.buy · sell · transfer (scope per public-api)

## 12. Queries
List / get / statement-style reads as applicable.

## 13. API contract
API.md envelope; decimal strings; operationId on mutations.

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 16. Money / quantity semantics
Quantity decimal; fee qty separate from gross/net

## 17. FX behavior
Non-base currency requires locked exchangeRateToBase (FINANCIAL-CORE).

## 18. Fee behavior
Fee Engine; fee_from_received vs cash fee

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
All statement effects via Core journal.

## 21. Cost basis / valuation
WAC/cost in costCurrency; valuation via price_history asOf

## 22. Persistence impact
SQLite + feature tables inside atomic operation txn.

## 23. Transaction boundary
runAtomicFinancialOperation boundary.

## 24. Idempotency
operationId idempotency.

## 25. Reversal / correction
Reversal operation; no in-place rewrite of posted amounts.

## 26. Historical / asOf behavior
asOf queries rebuild from ledger; no live price required for history.

## 27. Reports
Module statements + REPORTING from journal.

## 28. Standalone edition behavior
Crypto-only edition + local settlement

## 29. Licensing / capabilities
Capability/license gates UI and commands only.

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
fixtures/CRYPTO-* · STANDALONE-CRYPTO.json

## 33. Tests / proof
src/features/crypto/tests · recovery-roundtrip

## 34. Machine-file references
docs/core/db/schema.sql · registry · fixtures.

## V1 command boundary (LOCKED)
**Implemented:** `crypto.buy` · `crypto.sell` · `crypto.transfer`  
**Deferred:** deposit · withdrawal · swap · airdrop · opening_balance  

Holding identity: `instrument + venue/exchange + network`.  
Wallet / network / provider fields = provenance, not economic identity.
## Fee treatment (LOCKED)
- Core: no silent treatment.
- Module policy v1: buy quantity fee → `reduce_received_quantity`; sell fee → `expense`.

## 9.1 Identity & transfer (LOCKED)

Identity (never symbol alone):
```
instrumentId + venue/exchange + network
```

Holding scopes:
| Scope | Meaning |
|-------|---------|
| exchange-offchain | CEX balance under exchange_id; network may be empty sentinel |
| wallet on-chain | network_id required; address/wallet metadata as provenance |

Transfer must preserve (no-field-loss):
```
fromVenue · fromNetwork · toVenue · toNetwork
quantity · networkFee · feeFundingKind
externalTxReference · provenance
```

Fee funding kinds: cash leg vs quantity burn/reduce_received — explicit treatment via Fee Engine.

## 9.2 V1 deferred (do not implement accidentally)
| Command / event | Status |
|-----------------|--------|
| deposit | DEFERRED |
| withdrawal | DEFERRED |
| swap / C2C economic | DEFERRED until economic_kind + valuation rule locked |
| airdrop | DEFERRED |
| opening balance (crypto) | DEFERRED |

Supported v1 mutations only: `crypto.buy` · `crypto.sell` · `crypto.transfer`.

Catalog cards: `docs/core/registry/command-catalog.json`.
