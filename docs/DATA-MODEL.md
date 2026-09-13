# DATA-MODEL (sole data/field ownership owner)

**Status:** CURRENT · Normative for field kinds, ownership, identity, no-field-loss.  
**Machine proof:** `docs/core/db/schema.sql`, field-inventory, schema.manifest.

## 1. Identity
Canonical IDs: featureId, instrumentId, accountId, partyId, operationId, holdingId, sourceReference.  
Provider symbol ≠ financial identity.

## 2. Field kinds (closed vocabulary)
`RAW` · `DERIVED` · `SNAPSHOT` · `EXTERNAL_REPORTED` · `LABEL` · `SYSTEM_INDEX` · `REFERENCE` · `STATUS`  
No other document may invent field-kind enums.

## 3. Ownership
Each column: owner domain, SoT, editable_after_post, migration disposition.

## 4. No-field-loss
RAW financial facts preserved through import/export/migration. Rename ⇒ explicit mapping.

## 5. Schema contract
schema.sql is bootstrap authority. Manifest + inventory must cover columns. FREEZE_PROVEN is evidence-level (registry), not mere SPEC_LOCKED.

## 6. Provenance
sourceChannel / sourceType / sourceReference — see FINANCIAL-CORE + SOURCE-VOCABULARY.

## 7. Ghost tables
No feature cash transaction tables as SoT (intentional omissions in schema remain).

## 8. Absorbs
Field-Level-SoT, ownership matrices, data dictionary prose → this file (detail tables may remain generated).


## 9. Field metadata matrix (required columns)
For every persisted financial field document:
`field · entity · kind · owner · source · nullable · unit · currency · formula · migration · reversal · export`

If not in SQL: only DERIVED | VIRTUAL | DEFERRED — never silent drop.


## Absorbed topics
Field-Level-SoT · Field-Level-Data-Ownership-Matrix · RELATED-FEATURE-ENUM · PRICE-IDENTITY · instrument vs provider mapping · no-field-loss doctrine.

Machine artifacts: `docs/core/db/schema.sql`, field-inventory, schema.manifest (GENERATED/MACHINE — not prose authority).
