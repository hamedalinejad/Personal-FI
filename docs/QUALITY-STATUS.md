# QUALITY-STATUS

Live only. History in Git.

| ID | Area | Status | Owner | Evidence |
|----|------|--------|-------|----------|
| DOC | Owner architecture | GOOD | DOCUMENTATION-STANDARD | tree |
| HASH | Single computeCommandHash | FIXED | operationEngine | economicHash.test |
| DUR | durability vocabulary | FIXED | OFFLINE-RELEASE + schema | CHECK constraint |
| REQ | matrix live refs hard-fail | FIXED | requirements-matrix-check | script tests |
| FRZ | FREEZE_PROVEN single flag | FIXED | status.registry | false/false |
| AUTH | authority_owners live | FIXED | status.registry | docs-consistency |
| REL-E | RELEASE-EVIDENCE live paths | FIXED | RELEASE-EVIDENCE.json | — |
| CACHE | journal SoT / balance cache | FIXED | DATA-MODEL | table |
| FX | FX contract | PARTIAL | FINANCIAL-CORE | expand tests |
| CRYPTO | events/fees | PARTIAL | modules/crypto | — |
| STOCKS | T+n/calendar | PARTIAL | modules/stocks | — |
| FUNDS | NAV vs tx price | PARTIAL | modules/funds | — |
| METALS | purity/delivery | PARTIAL | modules/metals | — |
| LOAN | formulas in module | STRONG | modules/loan | scheduleEngine |
| CA | corporate actions | DEFERRED | modules/stocks | — |
| BROWSER | offline proof | PARTIAL | OFFLINE-RELEASE | — |
| FREEZE | schema FREEZE_PROVEN | false | status.registry | — |
| PROD | Production | **NO_GO** | OFFLINE-RELEASE | — |

### P0 closure (runtime/registry)
```
[x] Remove duplicate economic hash construction
[x] Canonicalize durability-state vocabulary
[x] Clean dead requirements-matrix references
[x] Requirements checker fails on missing live paths
[x] Remove contradictory FREEZE_PROVEN field
[x] Repair authority_owners registry
[x] Repair RELEASE-EVIDENCE references
[x] Classify cached/source fields
[ ] Complete field preservation machine proof (ongoing)
[ ] Complete FX/crypto/stocks/funds/metals/loan proof packs
[ ] Browser recovery RELEASE-PROVEN
[ ] Standalone golden packs complete
```

**No new global audit documents.** Spec = owners · Proof = tests/fixtures · Status = this file + registry · History = Git.
