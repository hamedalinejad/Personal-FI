# Execution Contract

**Canonical long form:** `EXECUTION-HANDOFF.md`  
**Status:** PARTIAL runtime · docs ready for Loan coding.

```text
Command → validate → normalize → hash → idempotency
  → SQLite txn (domain + journal + cash)
  → durability → exact replay
```

Rules: `CODING-GATE.md`. Sequence: Loan RELEASE-PROVEN before other Features.
