# Crypto

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Crypto holdings and trades with venue/network scope; cash via CashSettlementPort.

## Shared contracts
Money / FX / journal / fee / reversal / rebuild → [FINANCIAL-CORE.md](../FINANCIAL-CORE.md)  
API envelope / idempotency shape → [API.md](../API.md)  
Layers / public-api → [ARCHITECTURE.md](../ARCHITECTURE.md)  
Offline / backup / recovery → [OFFLINE-RELEASE.md](../OFFLINE-RELEASE.md)  
Process / freeze → [DEVELOPMENT.md](../DEVELOPMENT.md)  
Command cards → `docs/core/registry/command-catalog.json`

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
Queries: module-local reads where listed below; otherwise Core/Reporting readers only.

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
All statement effects via Core journal.

## 21. Cost basis / valuation
WAC/cost in costCurrency; valuation via price_history asOf

## 27. Reports
Module statements + REPORTING from journal.

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
fixtures/CRYPTO-* · STANDALONE-CRYPTO.json

## 33. Tests / proof
src/features/crypto/tests · recovery-roundtrip

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
## 28. Standalone edition behavior (LOCKED)
**Crypto-only** full bookkeeping for buy/sell/transfer without Accounts UI or other investments.

| Requirement | Rule |
|-------------|------|
| Identity | instrument + venue + network |
| Settlement | local settlement via CashSettlementPort |
| Commands | `crypto.buy` · `crypto.sell` · `crypto.transfer` |
| Reports | holdings · realized P&L · TB subset |
| Deferred | deposit, withdrawal, swap, airdrop, opening balance |
| Forbidden | cross-feature internal imports |

Proof path: `src/features/crypto/tests/standalone.test.js`

## Fee defaults (v1 — LOCKED)
| Context | Default treatment | Field |
|---------|-------------------|--------|
| Buy quantity fee | `reduce_received_quantity` | `feeQuantity` (required) |
| Buy money fee | `expense` unless explicit | `feeAmount` |
| Sell fee | `expense` | `feeAmount` |
| Transfer network fee | `expense` | money and/or quantity |

Never interpret monetary `feeAmount` as quantity. Version with capability `crypto`.

## Transfer field preservation (LOCKED)
Must persist (or reject if accepted at API):
```
fromVenue · fromNetwork · toVenue · toNetwork
quantity · networkFee · feeFundingKind
externalTxReference · provenance
```

## Swap (DEFERRED — do not implement casually)
Before any `crypto.swap` command exists, lock:
```
asset out · asset in · prices · valuation currency
fees · FX · cost basis transfer · realized P&L rule · economic_kind
```
No partial swap() without that contract.

## economic_kind (LOCKED) — separate from tx_type
Canonical economic classification only:
```
acquisition · disposal · transfer_internal · swap_economic · fee · income · adjustment
```
Operational `tx_type` remains separate (`buy`, `sell`, `transfer_in`, `transfer_out`, …).

### Migration map (do not blind-rename)
| Old value | New value | Rule |
|-----------|-----------|------|
| transfer | transfer_internal | only if internal scope transfer |
| internal_transfer | transfer_internal | same |
| economic_swap / swap | swap_economic | only when economic swap semantics present |
| bridge | transfer_internal or deferred external move | classify by evidence |

## Transfer persistence map (LOCKED)
| API field | Table.column | Kind |
|-----------|--------------|------|
| fromVenue / fromNetwork | from holding `exchange_id`/`network_id` + tx scope | RAW |
| toVenue / toNetwork | to holding scope | RAW |
| quantity | inv_crypto_transactions.gross_quantity / net_quantity | RAW |
| networkFee | fee_quantity and/or fee amount fields | RAW |
| feeFundingKind | fee_funding_kind | RAW |
| externalTxReference | provenance / source_reference on operation | RAW |
| provenance | fin_operations provenance + optional address ids | RAW |
| economic_kind | inv_crypto_transactions.economic_kind | RAW status |

## Venue identity (LOCKED)
`exchange_id` is venue/container identity. type in {cex,dex,wallet,other}. API alias venueId maps to exchange_id.


## Queries (v1)
This package exposes **commands** via public-api. List/detail/holdings reads use **Core/Reporting readers**, not package-local query exports (`queries = {}` is intentional).


## API field: venueId (LOCKED)
Canonical domain/API field: **`venueId`**.  
Persistence column remains `exchange_id` → `inv_crypto_exchanges.id` where `type ∈ {cex,dex,wallet,other}`.  
No schema rename required in v1.

## Handoff Contract — v1 currency lock

- Public `currency` MUST equal `costCurrency` on `crypto.buy`.
- Multi-currency means: transaction/cost currency vs book base via explicit FX — not a separate cash currency leg in v1.
- `feeAmount` persists on `inv_crypto_transactions.fee_amount`; `feeQuantity` on `fee_quantity` (never conflated).
- `price`, `priceAsOf`, `amount`, `currency` persist on the transaction row.
