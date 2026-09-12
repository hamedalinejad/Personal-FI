# Audit Batch §§6–13 Status (2026-09-13)

Honest status: **contract/lock GREEN where noted; RELEASE-PROVEN only when Golden+Recovery+Standalone all green.**

## 6. Test / fixture integrity

| ID | Status | Evidence |
|----|--------|----------|
| P0-TEST-001 | **GREEN** | `scripts/fixture-empty-check.js` in gates; empty claimed fixtures fail |
| P0-TEST-002 | **LOCKED** | IMPLEMENTED ≠ Golden/Recovery/Standalone; STATUS-TAXONOMY + COMMAND matrix |
| P1-TEST-003 | **GREEN** | `lint:money-number` bans Number/parseFloat on money paths |

## 7. Governance

| ID | Status | Evidence |
|----|--------|----------|
| P0-GOV-004 | **LOCKED** | DOC-AUTHORITY-CHAIN + concept homes; historical audits non-normative |

## 8. Field ownership

| ID | Status | Evidence |
|----|--------|----------|
| P0-FIELD-001 | **LOCKED** | `authority/FIELD-KIND-VOCABULARY.md` sole owner |
| P0-FIELD-002 | **LOCKED** | SYSTEM_INDEX = non-editable index, never SoT |
| P0-FIELD-003 | **LOCKED** | deletedAt forbidden on posted financial ledgers |

## 9. Price/history

| ID | Status | Evidence |
|----|--------|----------|
| P1-PRICE-005 | **PARTIAL** | null-source unique index + PRICE-HISTORY-CONTRACT; prefer canonical manual source row |
| P1-PRICE-006 | **LOCKED** | historical reports need asOf/priceAsOf/fxAsOf/engineVersions/stale |

## 10. Cross-feature investment

| ID | Status | Evidence |
|----|--------|----------|
| P0-INV-001 | **LOCKED** | ghost cash tables OMITTED; CashSettlementPort only |
| P0-INV-002 | **LOCKED** | CRYPTO-ECONOMIC-KIND + economic_kind enum |
| P0-INV-003 | **LOCKED** | STOCKS-CA-EVENT-PATH; runtime CA each still OPEN |
| P0-INV-004 | **LOCKED** | FUNDS-PRICE-TRIPLE (NAV ≠ tx ≠ liquidation) |
| P0-INV-005 | **LOCKED** | METALS-PURITY-SNAPSHOT RAW purity / DERIVED fineWeight |
| P1-INV-006 | **LOCKED** | tradeDate ≠ settlementDate |

## 11. Tax / reporting

| ID | Status | Evidence |
|----|--------|----------|
| P0-TAX-001 | **GREEN** | changeStatus paid → TAX_PAID_REQUIRES_PAYTAX |
| P0-TAX-002 | **LOCKED** | TAX-RECORD-EVENT-SOT |
| P1-REPORT-003 | **GREEN** | `rpt_*` prefix |
| P1-REPORT-004 | **LOCKED** | REPORT-CASH-SOT journal only |
| P1-REPORT-005 | **OPEN** | full BS/IS/CF golden vectors not release-proven |

## 12. Offline / recovery

| ID | Status | Evidence |
|----|--------|----------|
| P0-OFFLINE-001 | **PARTIAL** | PROTOCOL_PROVEN_NODE_HARNESS; real sql.js/IDB RELEASE open |
| P0-OFFLINE-002 | **PARTIAL** | RECOVERY-MATRIX rows not all COVERED |
| P1-OFFLINE-003 | **PARTIAL** | multi-tab contract; browser proof open |

## 13. Modular / standalone

| ID | Status | Evidence |
|----|--------|----------|
| P0-MOD-001 | **PARTIAL** | standalone tests exist for some verticals; not all RELEASE-PROVEN |
| P0-MOD-002 | **PARTIAL** | lint-boundaries in gates; expand coverage |
| P1-MOD-003 | **LOCKED** | license capability only; history immutable |

---

### Release rule

```
Production GREEN only if:
  gates (incl fixture:empty, lint:money-number) pass
  + Golden families claimed
  + Recovery matrix COVERED
  + Standalone editions claimed
  + Browser adapter RELEASE-PROVEN (if shipping browser)
```

Loan vertical coding remains ALLOWED under CODING-GATE.
