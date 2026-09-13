# DATA-MODEL (sole data / field / identity owner)

**Status:** CURRENT

Absorbs: Data-Dictionary, Field-Level-SoT, Field-Level-Data-Ownership-Matrix, Data-Preservation, Raw-vs-Derived, Canonical-Ownership-Matrix, Relationship matrices, Migration-Data-Preservation, Storage-API field mapping (prose).

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

