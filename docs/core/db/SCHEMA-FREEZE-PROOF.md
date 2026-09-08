# Schema Freeze Proof — v1 coding baseline

**Date:** 2026-09-08  
**Decision:** Schema **content freeze for Feature implementation** is **PROVEN** under the checks below.  
Additive migrations after this baseline require migration scripts + inventory row + drift PASS.

## Automated evidence (must stay green)

| Check | Command | Result required |
|-------|---------|-----------------|
| Table name parity | `node scripts/schema-drift-test.js` | PASS |
| Column inventory coverage | `node scripts/field-inventory-verify.js` | gaps = 0 |
| Unit tests | `npm test` | PASS |
| CI | `.github/workflows/ci.yml` runs drift + inventory | required |

## Vocabulary locked

| Field | Values |
|-------|--------|
| `fin_operations.status` | draft \| posted \| voided \| failed |
| Reversal | `reverses_operation_id` / `corrects_operation_id` (relationship) |
| `durability_state` | pending \| sql_committed \| persisted \| persist_failed |

## What freeze proven means

1. Every CREATE TABLE column is inventoried.
2. Drift test enforces tables + inventory + status vocabulary.
3. No ad-hoc ALTER without migration + inventory update.
4. Semantic edges in RELATIONSHIP-MATRIX + SEMANTIC-RELATIONSHIPS.

## Residual (does not unblock coding)

- Deeper ON DELETE auto-diff continuous improvement
- API/fixture disposition flags filled during Feature work
- Production release still needs golden family CI

**Gate B for starting Feature code** = this document + scripts green.
