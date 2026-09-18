# DATA-MODEL (sole data / field / identity owner)

**Status:** CURRENT

Absorbs: Data-Dictionary, Field-Level-SoT, Field-Level-Data-Ownership-Matrix, Data-Preservation, Raw-vs-Derived, Canonical-Ownership-Matrix, Relationship matrices, Migration-Data-Preservation, Storage-API field mapping (prose).

## fieldKind vs fieldDisposition (LOCKED)

**fieldKind** — semantic nature of the data:
```
RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX | REFERENCE | STATUS
```

**fieldDisposition** — what happens at the API boundary for an accepted field:
```
PERSISTED   — stored as RAW (or REFERENCE) column
DERIVED     — computed by formula; not independently stored as SoT
SNAPSHOT    — versioned rebuildable cache
DEFERRED    — accepted concept reserved; not implemented this release
REJECTED    — must error; must not silently drop
```

Example:
```
fieldKind = RAW, fieldDisposition = PERSISTED
fieldKind = RAW, fieldDisposition = DEFERRED
fieldKind = DERIVED, fieldDisposition = DERIVED
```

There is never: accepted → silently discarded.
## 1. Field Kind (locked)
`RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX | REFERENCE | STATUS`

## 2. No-field-loss
Every documented field: kind, owner, schema column or VIRTUAL|DERIVED|DEFERRED, nullable, unit, currency, formula, migration, export, reversal.

## 3. Identity
operationId · instrumentId · accountId · holdingId · partyId · featureId.  
Provider symbol ≠ instrument identity.

## 4. Holding scope
| Feature | Scope |
|---------|--------|
| Crypto | instrument + venue/network |
| Stocks | instrument + brokerage/account |
| Funds | instrument + account |
| Metals | instrument + platform/account |

## 5. deletedAt
Forbidden on posted financial ledgers.

## 6. Import lineage
import_batches, import_raw_records, import_dedupe_keys; preserve unknown fields.

## 7. price_history
quote_type NOT NULL; source_id preferred; uniqueness per schema indexes.

## 8. Machine artifacts
`docs/core/db/schema.sql` · field-inventory · schema.manifest · registry JSON.

## 9. Entity catalog
See schema.sql for full table list (fin_*, acc_*, ln_*, inv_*, tax_*, rpt_*, …). Cash SoT = fin_journal_*.

## 10. Relationships (semantic)
Operation → journal entries/lines → accounts.  
Feature tx rows link operationId.  
Holdings rebuild from feature transactions + cost basis version.


## Cached / control-plane fields (not second ledgers)

| Field | Kind | Owner | Writer | Rebuild source | Direct write |
|-------|------|-------|--------|----------------|--------------|
| fin_operations.durability_state | STATUS | OFFLINE-RELEASE / Core | persistence worker | n/a (transport) | Forbidden outside worker |
| fin_operations.source | RAW/LABEL | FINANCIAL-CORE | operation engine | command provenance | Only at create |
| fin_journal_entries.post_state | STATUS | FINANCIAL-CORE | journal writer | entry lifecycle | Forbidden ad-hoc |
| acc_accounts.current_balance | SNAPSHOT/DERIVED | modules/accounts | rebuild job / query | **sum journal lines** | **Forbidden as SoT** |

**Accounting SoT = journal lines + fin_accounts classification.**  
`current_balance` is a cache; if present it must reconcile to journal or be ignored by statements.

## 20. Field-preservation protocol (LOCKED)

Every **input** field maps to:
```
Input → semantic owner → kind → normalized value
  → persistence column OR explicit DERIVED|VIRTUAL|DEFERRED
  → query projection → report/export → reversal → migration
```

Every **table** field records:
```
kind · owner · nullable · unit · currency · precision · formula · source · migration · export · reversal
```

### Forbidden
```
input accepted → not stored → not returned → not rejected
```
That is a hard **no-field-loss** violation. Accept implies persist or explicit reject.

### Posted ledger deletion
No `deletedAt` strategy may hide posted accounting history.

## 21. Canonical book base currency
Authority: book settings / `db_meta` (default IRR). Commands resolve via Core; never silent `baseCurrency = transactionCurrency`.

## 22. Metals holding identity
Scope key includes **purityRatio** when instrument policy requires purity segregation. Do not merge different purity lots without explicit policy.

## 23. Legacy alias lifecycle
Alias → normalize at API boundary → persist canonical only → document removal criterion after zero inbound use.

## 30. Iran & asset field preservation (LOCKED)

### IRR / Toman
Ledger currency = **IRR**. Toman = presentation only. UI conversion must not rewrite stored truth.

### Stocks Iran — keep distinct
tradeDate · settlementDate · cashDate · marketDate · priceAsOf · fxAsOf · settlement_policy_version

### Funds — never collapse
NAV ≠ transactionPrice ≠ liquidationPrice

### Metals — preserve all
gross weight · purityRatio · fine weight · quoteBasis · priceUnit · premium · trade fee · delivery fee · serial · certificate · location

### Crypto identity
instrument + venue + network (symbol alone is not identity)

### Field completeness
Every field: kind · owner · schema column · nullable · unit · currency · precision · formula · source · migration · export · reversal  
Forbidden: accepted → not stored → not returned → not rejected.

## Cache vs authority
| Field | Kind | Authority |
|-------|------|-----------|
| `fin_operations.status` | RAW/system | Yes — reports/filters |
| `fin_journal_entries.post_state` | CACHE | No — integrity-scan only |
| `fin_operations.source` | LEGACY | No — do not write |
| `source_channel` / `source_type` / `source_reference` | RAW | Yes |

## Relationship contracts (LOCKED)

### Core accounting
```
fin_operations
  └── fin_journal_entries
        └── fin_journal_lines → fin_accounts
```
Only accounting truth for statements.

### Feature event
```
feature transaction → operationId → fin_operations → journal
```

### Holding projection
```
ref_instruments → feature transactions → holding projection (rebuildable)
```
Holding is never unaudited cost SoT.

### Import lineage
```
import_batch → raw_record → dedupe_key → normalized → operation → journal → provenance
```
Unknown source fields survive unless user chooses destructive transform.

## Holding identity scopes (LOCKED)
| Module | Identity |
|--------|----------|
| Crypto | `instrumentId` + venue/exchange + network |
| Stocks | `instrumentId` + brokerage/account scope |
| Funds | `instrumentId` + account scope |
| Metals | `instrumentId` + platform/account + purity when policy requires |

**symbol / providerSymbol is a LABEL only** — never economic primary key.  
Canonical identity = `ref_instruments.id` (+ scope above).

## fin_operations.source (legacy)
Column may remain for migration compatibility. **New writers must not populate `source`.**  
Use `source_channel` · `source_type` · `source_reference` only. Removal only after migration rules confirm zero inbound use.

## No-field-loss final acceptance (LOCKED)
A field may only be:
1. persisted **RAW**
2. **DERIVED** with documented formula
3. **SNAPSHOT** with owner/version
4. explicitly **DEFERRED**
5. explicitly **REJECTED**

There is **no** sixth state (“we forgot it”).

Forbidden (release-blocking):
```
input accepted → silently discarded → not returned → not exported → not reversible
```

## Protected economic fields (extra matrix coverage)
| Domain | Fields |
|--------|--------|
| Money/accounting | currency · amount · amountInBase · exchange rate · FX as-of/source · account · line kind · businessDate · settlementDate · eventAt · provenance |
| Crypto | instrument · venue · network · quantity · price · feeAmount · feeQuantity · feeFundingKind · from/to scope · external ref |
| Stocks | instrument · brokerage · qty · price · trade/settlement/cash dates · commission · tax · other fees · policy version |
| Funds | instrument · units · transactionPrice · NAV · liquidationPrice · distribution dates · reinvest semantics |
| Metals | gross · purity · fine · quoteBasis · price unit · premium · trade fee · delivery fee · serial · certificate · location |
| Loans | principal · role · rate · rate unit · method · frequency · periods · day-count · fee/penalty · allocation · schedule version · residual · FX |

## Import lineage FKs (LOCKED)
```
import_raw_records.batch_id → import_batches.id (RESTRICT)
import_dedupe_keys.raw_record_id → import_raw_records.id
source_document_id → docs_documents.id (SET NULL) when internal document
```
String IDs without FK are forbidden when the target table is in-schema.


## Attachments (LOCKED)
Use document_id → docs_documents + relative storage key + checksum. Do not use absolute OS paths as identity. Backup includes bytes or explicit DEFERRED reject.


## Field-preservation machine contract (LOCKED)
Matrix: `docs/core/registry/field-preservation-matrix.json`  
Gate: `scripts/field-preservation-check.js`

| disposition | Required |
|-------------|----------|
| PERSISTED | persistence.table + persistence.column exact |
| DERIVED | formula and/or resultPath |
| SNAPSHOT | persisted location + version |
| DEFERRED / REJECTED | reason + owner |

Forbidden storage language: `module_or_core`, `feature ledger via operationId`, wildcards.


## result_json is not field-preservation SoT (LOCKED)

`fin_operations.result_json` is a **replay/provenance snapshot**, not accounting SoT and not proof of field preservation.

For every accepted command field, disposition must be one of:
- **relational SoT** (table.column)
- **explicit SNAPSHOT** with documented rebuild semantics
- **DERIVED** (formula + result path)
- **DEFERRED / REJECTED**

Forbidden claim:
```
it survives in result_json → field preservation complete
```
