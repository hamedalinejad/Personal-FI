---
id: DOC-AUTH-FINAL-VERDICT
title: Final Repository Verdict, Gates & Developer Rules
status: approved
version: 1.0
updated: 2026-09-12
authority: binding
---

# 25. File lifecycle

Delete only if:

```text
unique rule = 0 AND inbound refs = 0
```

`P0` in a filename is **not** a deletion criterion.

# 26–28. Keep / do not recreate / historical

**Must stay:** governance (`DOC-AUTHORITY-CHAIN`, `GO-NO-GO`, `CODING-GATE`, …), `docs/core/authority/**`, financial canonical homes, `docs/core/db/**`, `docs/core/fixtures/**`.

**Do not recreate** as parallel authority: CROSS-CUTTING-CONTRACTS-BATCH*, X-001-020 packs, Documentation-Audit-2026-09-01, Support-Layers-Audit, FEATURE-BUG-RESOLUTIONS, DOCUMENTATION-STYLE-P2, etc.

**Historical candidates (C-001…C-004):** keep while inbound refs > 0 → **DELETE NOW = none**.

# 29. Documentation simplification

Prefer: canonical concept + section + ticket ID + status.  
Avoid one file per bug ticket.

# 30. Status vocabulary

```text
SPEC_LOCKED | IMPLEMENTED | PARTIAL | BLOCKED | DEFERRED | CLOSED_HISTORICAL
```

Release proof:

```text
GOLDEN-GREEN | RECOVERY-GREEN | RELEASE-PROVEN
```

```text
READY TO IMPLEMENT ≠ IMPLEMENTED ≠ RELEASE-PROVEN
```

# 31. Implementation order

0 Docs consistency → 1 Persistence → 2 Operation kernel → 3 No-field-loss/import → 4 Accounting/reports → 5 Loan reference → 6 Crypto→Funds→Stocks→Metals→Cheque→Accounts UI.  
UI polish **after** financial correctness.

# 32. Before writing code

Read: authority chain, coding gate, operation contract, cash contract, invariants, schema, field matrix, feature contract, fixtures.  
Implement **exactly** the documented contract.

# 33. Forbidden guesses

Do not guess: field meaning, currency, date, fee treatment, instrument identity, accounting entry, historical price, recovery behavior.  
Missing contract stays SPECIFIED/PARTIAL until decided.

# 34. Release gate

RELEASE-PROVEN only when **all** green:

```text
spec locked + implementation + integration + golden + recovery
+ rebuild + standalone proof + CI + no-field-loss
```

# 35. Final repository verdict

| Area | Verdict |
|------|---------|
| Product direction | GREEN |
| Accounting-first | GREEN |
| Minimal navigation | GREEN |
| Feature independence | GREEN concept |
| Canonical authority | GREEN |
| Schema | SPEC_LOCKED |
| Runtime persistence | Strong / needs proof |
| Loan | Reference vertical |
| Crypto / Funds / Stocks / Metals | PARTIAL |
| Browser offline | PARTIAL |
| Golden / Recovery / No-field-loss | Not fully release-proven |
| **Production** | **NO-GO** |

Project state wording (mandatory):

```text
Documentation-first
+ implementation scaffold / reference runtime
+ pre-production
```
