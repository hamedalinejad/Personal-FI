# DEVELOPMENT

**Owner:** engineering process · **Status:** LOCKED structure

## Coding workflow
1. Read `DOCUMENTATION-STANDARD.md` → relevant owner → `modules/<feature>.md` → `schema.sql`
2. Implement behind public API / ports only
3. Add or update fixture + test
4. Run `npm test` (and relevant gates)
5. Update `QUALITY-STATUS.md` only if a **live status** changes

## Test workflow
- Domain money: Decimal only; no `Number()` on money in domain tests
- Acceptance tests named by **capability**, not ticket IDs
- Golden/recovery fixtures under `fixtures/` (machine proof)

## Definition of done (implementation unit)
- Spec in one owner or one module
- Schema/field ownership clear if persisted
- Command/query path tested
- No silent defaults on financial fields
- Idempotent mutations where required
- Release remains NO_GO until RELEASE_PROVEN

## Status vocabulary
| Layer | Values |
|-------|--------|
| Implementation | SPEC_ONLY · SCAFFOLD · IMPLEMENTED · INTEGRATED |
| Proof | UNPROVEN · GOLDEN_GREEN · RECOVERY_GREEN · STANDALONE_GREEN · RELEASE_PROVEN |
| Release | NO_GO · CONDITIONALLY_GO · GO |

Do not use READY/DONE/GREEN as synonyms across layers.

## Commit policy
- `docs:` structure only — no silent financial rule change
- `fix:` code + test
- `feat:` capability with tests
- No new BUG/AUDIT/MATRIX specification files

## Documentation lifecycle
```
NO NEW DOC · NO NEW BUG DOC · NO NEW AUDIT DOC · NO NEW MATRIX
```
unless updating an existing **owner** listed in DOCUMENTATION-STANDARD.

## Forbidden documentation behavior
- Second owner for one concept
- Ticket IDs as domain vocabulary in normative text
- Ghost cash tables
- Treating QUALITY-STATUS as a requirements catalog

## Module template (mandatory headings)
```
1. Purpose
2. Scope
3. Supported v1 behavior
4. Unsupported / Deferred behavior
5. Actors / roles
6. UI pages
7. Sheets / drawers
8. Entities
9. Field ownership
10. Identity
11. Commands
12. Queries
13. API contract
14. State machine
15. Validation
16. Money / quantity semantics
17. FX behavior
18. Fee behavior
19. Tax behavior
20. Accounting / journal mapping
21. Cost basis / valuation
22. Persistence impact
23. Transaction boundary
24. Idempotency
25. Reversal / correction
26. Historical / asOf behavior
27. Reports
28. Standalone edition behavior
29. Licensing / capabilities
30. Edge cases
31. Error codes
32. Fixtures
33. Tests / proof
34. Machine-file references
```
Module files hold **feature-specific** behavior only. Global rules stay in global owners.


## Universal command contract (required fields)
command ID · purpose · request fields · required/optional · types · units · currency · precision · normalization · defaults · identity · validation · journal mapping · fees · FX · cost basis · DB writes · transaction boundary · idempotency · reversal · result · errors · queries · reports · standalone · fixture · invariants · recovery  
Detail per command lives in the owning `modules/<feature>.md` + API schemas when present.
