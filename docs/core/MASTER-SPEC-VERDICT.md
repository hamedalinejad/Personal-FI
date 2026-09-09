# Master Spec Verdict (§0–70)

**Production: NO-GO**  
**Current main (this write-up):** see `git rev-parse HEAD` — **not** the stale audit tip `4086c85`.

## Status by area (live)

| Area | Status |
|------|--------|
| Product / architecture intent | GOOD |
| Documentation authority | RESOLVED hierarchy (`DOC-AUTHORITY-CHAIN.md`) |
| Money / Decimal public boundary | PARTIAL→strong |
| Accounting / journal path | PARTIAL |
| Persistence port + Node SQLite | PARTIAL (PWA WASM deferred) |
| Idempotency | PARTIAL (SQLite primary; json only test mode) |
| Schema / migration | PARTIAL (semantic CHECK freeze incomplete) |
| Cost basis / FX / Price | PARTIAL |
| **Loan** | **PARTIAL** (atomic create/pay/reverse in txn; not full RELEASE-PROVEN) |
| Crypto / Funds / Stocks / Metals / Cheque | SPECIFIED, not integrated |
| Reports / recovery / rebuild / golden CI | SPECIFIED / not proven |
| package-lock | public `registry.npmjs.org` for decimal.js |

## Defect register vs audit §51–52

| ID | Audit claim | HEAD resolution |
|----|-------------|-----------------|
| D-001 | Authority dual | FIXED — concept homes win |
| D-002 | Stack dual | OPEN by design — Persistence Port |
| D-003 | Loan formula | FIXED — equal-principal v1 |
| D-004 | Loan not atomic | **FIXED** — `withinTransaction` same COMMIT |
| D-005 | No ln_transactions | **FIXED** — insert with portions |
| D-006 | borrowed/lent | FIXED scope — **lent only**; borrowed DEFERRED |
| D-007 | schema mismatch | PARTIAL — columns extended; full model still grows via migration |
| D-008 | status vocab | FIXED vocab: SPECIFIED/PARTIAL/RELEASE-PROVEN/DEFERRED/NO-GO |
| D-009 | cash port | PARTIAL — `cashSettlementPort.js` exists |
| D-010 | manifest CHECKs | OPEN |
| D-011 | ALTER result_json | **FIXED** — in schema.sql |
| D-012 | dual idempotency | **FIXED** for sqlite path |
| P0-RT-001 | create after persist | **FIXED** (stale if citing 4086c85) |
| P0-RT-002 | payment no ledger | **FIXED** |
| P0-RT-003 | direction | lent only |
| P1-RT-007 | hash before normalize | **FIXED** — `normalizeCommand` first |
| P1-RT-008 | swallow errors | **FIXED** — OP_NOT_FOUND only |
| P1-RT-010 | price numbers | **FIXED** |

## Domain contracts §38–46

Crypto/Stocks/Funds/Metals/Cheque/Opening/Reports/Budget/Tax: **SPECIFIED** in `DOMAIN-CONTRACTS-31-44.md` + this verdict.  
**No production packages until Loan RELEASE-PROVEN** (`CODING-GATE`).

## Loan RELEASE-PROVEN checklist (§59)

| # | Criterion | HEAD |
|---|-----------|------|
| A1 | atomic create domain+journal | YES |
| A2 | replay | YES |
| A3 | conflict hash | YES |
| A4 | schedule golden | YES (core vectors) |
| A5 | payment allocation | YES |
| A6 | ln_transactions portions | YES |
| A7 | reversePayment | YES |
| A8 | backup/restore | NO |
| A9 | standalone boot evidence | PARTIAL |
| A10 | borrowed rejected | YES |
| A11 | migration no-field-loss | PARTIAL |
| A12 | rebuild remaining | PARTIAL |

## Sequence (unchanged)

Phase 9–10 Loan release proof → then Crypto → Funds → Stocks → Metals → Cheque → …

## One-page handoff

See `CODING-GATE.md` + `EXECUTION-HANDOFF.md` + section 68 of the full Master Spec narrative.
