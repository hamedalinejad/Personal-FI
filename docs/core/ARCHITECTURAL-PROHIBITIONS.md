# Architectural Prohibitions (Final Audit §37)

**Authority:** this file + CANONICAL-FINANCIAL-REQUIREMENTS. Ticket numbers are not authority.

```text
❌ second cash source of truth
❌ feature-owned cash ledger
❌ symbol-as-instrument-identity
❌ assetKey-as-canonical-identity
❌ direct mutation of posted financial facts
❌ financial numbers stored as JS number primitives
❌ historical valuation from today's price
❌ mixed period-return bridges
❌ mandatory Accounts UI dependency for standalone features
❌ feature-to-feature raw SQL access
❌ duplicated corporate-action formulas
❌ duplicated fee logic across features
❌ silent snapshot repair during reconcile
❌ silent financial correction via UPDATE
❌ license state embedded in journal truth
❌ server dependency for normal offline financial operation
```

## Must always preserve (Final Audit §38)

```text
✓ raw source values · gross/fee/net · original financial dates
✓ historical FX used by operation · valuation context · provenance
✓ external identifiers · source documents · operationId · commandHash
✓ reversal/correction links · immutable journal · instrument identity
✓ cost basis history · fee treatment role · CA provenance
✓ loan schedule version · backup evidence · engineVersions
```
