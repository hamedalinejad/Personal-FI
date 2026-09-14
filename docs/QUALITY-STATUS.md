# QUALITY-STATUS

Live only. History in Git. **No new audit documents.**

| ID | Area | Status | Evidence |
|----|------|--------|----------|
| DOC | Owner tree | GOOD | DOCUMENTATION-STANDARD |
| HASH | Single commandHash | FIXED | economicHash.test |
| IDEM | Replay + conflict | FIXED | idempotencyConflict.test |
| DUR | Durability vocabulary | FIXED | schema + OFFLINE-RELEASE |
| REQ | Live matrix refs | FIXED | requirements-matrix-check |
| FRZ | FREEZE_PROVEN=false | LOCKED | status.registry |
| FX | amountInBase + crossRate | IMPROVING | amountInBase.test · crossRate.test |
| CRYPTO | buy/sell/transfer | PARTIAL | module + deferred list |
| IRAN-CAL | Equity weekend Thu+Fri v2 | FIXED | settlementPolicy.js |
| STOCKS | T+n / CA deferred | PARTIAL | module |
| FUNDS | NAV ≠ tx price | PARTIAL | module |
| METALS | purity/delivery | PARTIAL | module |
| LOAN | formulas | STRONG | modules/loan + scheduleEngine |
| BROWSER | sql.js RELEASE-PROVEN | OPEN | — |
| INV | Field inventory covers schema columns | GREEN | schema:inventory strict |
| FREEZE | semantic freeze | false | — |
| P0-01 | Book base ≠ txn currency | FIXED | bookSettings.resolveBookBaseCurrency |
| P0-03 | Fund no silent NAV price | FIXED | subscribe FUND_TRANSACTION_PRICE_REQUIRED |
| P0-04 | Capitalized fee has GL legs | FIXED | feeEngine journal |
| P0-05 | Reports posted-only GL | FIXED | generalLedger status filter |
| P0-06 | Settle uses book base + FX | FIXED | stocks/settle.js |
| P0-07 | Sell fee vocab = buy | FIXED | stocks/sell.js |
| P0-08 | Metals holding + purity key | FIXED | platform+instrument+purity_ratio |
| P0-09 | Delivery field persist | FIXED | physical_deliveries full columns |
| P1-01 | Schema live owner refs | FIXED | schema.sql header |
| P1-16 | Metals quoteBasis/unit | FIXED | metals/buy.js |
| P1-17 | Settle no PRAGMA probe | FIXED | locked related_operation_id |
| P1-18 | JSON persist requires opId | FIXED | worker.js |
| P2-01 | Semantic test names | FIXED | field-preservation* |
| PROD | Production | **NO_GO** | — |

### Remaining before RELEASE_PROVEN
- Full golden families with non-empty expected
- Recovery matrix all rows green
- Browser sql.js+IDB proof
- Field-inventory complete machine coverage
- Standalone edition packs complete

### Implementation sequence (locked)
Decimal/FX → Journal/invariants → Persistence → Loan→Crypto→Stocks→Funds→Metals → Planning/Tax/Reports → Browser → License → UI

## 2026-09-14 — Final grammar lock (§8–13)
Owner docs updated: FINANCIAL-CORE §20, API §10–12, OFFLINE §20, DATA-MODEL §20, modules loan/crypto/stocks/funds/metals/tax/accounts/cheque/income-expense/budget.
Production remains **NO-GO** until browser offline + recovery golden matrix + freeze evidence.

## FREEZE_PROVEN checklist
```
[ ] no dead live references
[ ] no contradictory owner/registry status
[ ] book base currency canonical
[ ] cross-currency golden tests
[ ] posted-only report boundary enforced
[ ] fee capitalization balanced journal proof
[ ] Iran calendar versioned/data-driven
[ ] fund NAV ≠ transactionPrice contract
[ ] metal purity identity
[ ] delivery no-field-loss
[ ] command field preservation machine-checked
[ ] loan formulas explicit
[ ] golden fixtures non-empty expected
[ ] recovery matrix green
[ ] standalone packs green
[ ] browser adapter release proof (if shipping browser)
[ ] command API schemas complete
```
Until all green: `FREEZE_PROVEN = false`. Production remains **NO-GO**.

### Inventory vs coverage
| Layer | Status |
|-------|--------|
| Schema inventory tooling | operational |
| Command field coverage | PARTIAL |
| Browser offline | OPEN |

## Fee / hash freeze (2026-09-14)
| ID | Status |
|----|--------|
| BUG-001 fee treatment enum unified | FIXED |
| BUG-002 feeQuantity for reduce_received_quantity | FIXED |
| BUG-003 no silent expense default in Core | FIXED |
| BUG-004 same-currency journal filled before hash | FIXED |

## BUG-005…009 / FINDING-010
| ID | Status |
|----|--------|
| BUG-005 Number forbidden in economic hash | FIXED |
| BUG-006 result_json vs journal SoT table | FIXED (docs + soft mismatch class) |
| BUG-007 dead COMMAND-COVERAGE-MATRIX ref | FIXED → QUALITY-STATUS |
| BUG-008 file-inventory regenerated | FIXED |
| BUG-009 ticket vocabulary in feeEngine | already clean / verify |
| FINDING-010 settle source_reference fallback | REMOVED |

## Module status snapshot
| Module | Doc | Runtime | Remaining |
|--------|-----|---------|-----------|
| Accounts | good | partial/core | command depth |
| Income/Expense | baseline | partial | field/command depth |
| Cheque | baseline | partial | lifecycle proof |
| Loan | strongest | implemented | policy breadth |
| Crypto | good | partial | deferred lifecycle |
| Stocks | good | partial | corporate actions |
| Funds | good | partial | edge cases |
| Metals | good | partial | pricing proof |
| Physical Assets | baseline | partial | valuation semantics |
| Budget/Goals/Bills | baseline | planning | forecast linkage |
| Tax | baseline | partial | policy depth |

## Explicitly deferred (do not fake in v1)
- Crypto: deposit, withdrawal, swap, airdrop, opening_balance  
- Stocks: bonus, split, reverse split, rights, merger, spinoff, symbol change  
- Loan: variable rate, reschedule, alternate day-count, full penalty/grace matrix  
- Browser: sql.js+IndexedDB RELEASE-PROVEN  

## Target human tree (compact)
11 global owners + 11 modules + archive/AUDIT-HISTORY.md + machine `docs/core/*` only.  
No `docs/core/authority/` human trees. Command coverage → `command-catalog.json` (machine-only) when expanded.

## Priority matrix (live)

### P0 semantic freeze — status after HEAD
| Item | Status |
|------|--------|
| Fee treatment vocabulary | **FIXED** (canonical enum + aliases) |
| fee_from_received qty vs money | **FIXED** (`feeQuantity` required) |
| Fee silent default | **FIXED** (`FEE_TREATMENT_REQUIRED`) |
| Hash normalization order | **FIXED** (same-currency fill before hash) |
| Money Number in hash | **FIXED** (`HASH_NUMBER_FORBIDDEN`) |
| Dead COMMAND-COVERAGE-MATRIX ref | **FIXED** |
| Inventory regenerated | **FIXED** |
| field-inventory-live-check.js | **DELETED** (do not restore) |
| Command machine contracts | **PARTIAL** (`command-catalog.json` skeleton) |
| Field preservation machine coverage | **PARTIAL** |
| Golden financial families | **PARTIAL** |

### P1 before production
Browser E2E · Recovery matrix · Standalone packs · Reporting completeness · Iran policy packages — all **OPEN/PARTIAL**

### P2 cleanup
Ticket IDs in comments · legacy test names · duplicate tests — ongoing, do not bulk-delete tests

### Gates
```
FREEZE_PROVEN = false
PRODUCTION = NO-GO
```

## Freeze blockers closed (2026-09-14 evening)
| Finding | Fix |
|---------|-----|
| Dead related_contracts paths | → DATA-MODEL / FINANCIAL-CORE / command-catalog |
| Journal FX equation | INV_JOURNAL_FX_MISMATCH in assertJournalBalanced |
| Posted empty journal | OP_POSTED_REQUIRES_JOURNAL |
| stocks.sell fee field loss | fee_commission/tax/other + treatments_json |
| stocks.sell silent fee treatment | FEE_TREATMENT_REQUIRED when fee ≠ 0 |
| Crypto/funds/metals holding uniqueness | SQL unique indexes with ifnull sentinel |
| Metals purity range | CHECK 0 < purity ≤ 1 |

## REVIEW-001 command naming (2026-09-14)
Canonical IDs in `docs/core/registry/command-catalog.json` (42 entries).
Forbidden aliases: `loan.payment`→`loan.recordPayment`, `fund.*`→`funds.*`.
Gate: `npm run command:catalog`.

## REVIEW-002…010 (2026-09-14)
| ID | Status |
|----|--------|
| 002 requirements dead refs | OK — 0 missing live paths; checker walks define/evidence/related_contracts |
| 003 R-M26 navigation | OK — PRODUCT.md (+ DOCUMENTATION-STANDARD) |
| 004 FX equation | OK — amountInBase must equal amount×rate |
| 005 posted empty journal | OK — posted requires ≥2 journal lines |
| 006 stocks fee fields | OK — fee_commission/tax/other + treatments_json on buy+sell |
| 007 silent expense | OK — MODULE_DEFAULT_FEE_TREATMENT per module |
| 008–010 holding uniqueness | OK — ifnull sentinels on crypto/funds/metals |

## REVIEW-011…014 + DOC-001 (2026-09-14)
| ID | Status |
|----|--------|
| 011 post_state cache | OK — integrity scan; reports use fo.status |
| 012 source vocabulary | OK — legacy `source` written NULL |
| 013 FX rates unique + resolver | OK — uq_cur_exchange_rates_obs + resolveStoredRate |
| 014 category cycle | OK — assertNoCategoryCycle |
| DOC-001 command cards | PARTIAL — template + cards on key mutations in command-catalog |

## DOC-001 command matrix (2026-09-14)
All public mutations in `command-catalog.json` now carry a `card` (purpose, fields, journal, fee, FX, cost basis, writes, idempotency, reversal, errors).
Maturity still baseline/partial/strongest per module — card ≠ RELEASE-PROVEN.
Gate: `npm run command:catalog` requires `card.purpose` on every command.

## Investment / Loan / Reporting locks (2026-09-14)
Owner modules updated: crypto, stocks, funds, metals, loan + REPORTING.
Deferred lists explicit (crypto deposit/withdraw/swap/airdrop; stock CA family; TWR/MWR; loan borrower/variable rate).
No new BUG/P0 markdown files.

## Status dimensions (dashboard only — not a second requirements system)
```
SPEC_ONLY · SCAFFOLD · IMPLEMENTED · INTEGRATED
UNPROVEN · GOLDEN_GREEN · RECOVERY_GREEN · STANDALONE_GREEN · RELEASE_PROVEN
NO_GO · CONDITIONALLY_GO · GO
```
Keep concepts separate. Live production: **NO_GO** until RELEASE_PROVEN.

## §12–24 offline/standalone/UI/freeze (2026-09-14)
Owner updates in OFFLINE-RELEASE · PRODUCT · ARCHITECTURE · DEVELOPMENT.
Deleted: `scripts/generate-command-status-md.js` + `status:gen` (MD command matrix anti-pattern).

## Maturity verdict (2026-09-14)
| Area | Verdict |
|------|---------|
| Documentation architecture | GREEN |
| Consolidation strategy | GREEN |
| Six-route IA | GREEN |
| Shared Core direction | GREEN |
| Decimal / IRR-Toman | GREEN |
| Operation / idempotency direction | GREEN / needs more proof |
| Fee model | GOOD / keep module defaults explicit |
| FX + journal invariants | Mostly enforced in Core — need golden depth |
| Data identity constraints | Mostly enforced — keep integrity-audit |
| Field preservation | PARTIAL |
| Module command contracts | PARTIAL (cards exist; depth varies) |
| Golden fixtures | PARTIAL |
| Recovery proof | PARTIAL |
| Browser offline | OPEN |
| Standalone proof | PARTIAL |
| Production | **NO-GO** |
| UI coding | **WAIT** |

## Next objective (not a new feature)
```
SEMANTIC FREEZE CLOSURE
```
Snapshot tag: `personal-fi-pre-semantic-freeze-2026-09-14`

Already landed in prior commits (do not re-open as missing unless regression):
command ID normalization · dead refs · catalog cards · FX/posted journal · fee defaults · stock fee fields · holding uniqueness · FX resolver · category cycle · offline/standalone docs.

Still open for FREEZE_PROVEN:
field-preservation machine coverage · non-empty goldens for all high-value families · executable recovery matrix · standalone packs · browser sql.js+IDB proof · request/result JSON schemas where still missing.

## Freeze closure progress (2026-09-14 late)
| Blocker | Status |
|---------|--------|
| A Registry | GREEN |
| B Core math | GREEN (invariants + tests) |
| C Data identity | GREEN |
| D Field preservation | PARTIAL — machine matrix from command cards (209 rows) |
| E Module depth | PARTIAL |
| F Goldens | IMPROVED — LOAN flat/qarz/bullet/declining, metal fineWeight, fund NAV, core |
| G Recovery | IMPROVED — matrix test + BACKUP_CORRUPT |
| H Standalone | PARTIAL (existing standalone tests) |
| Browser | OPEN |

`FREEZE_PROVEN` remains **false** until browser proof + remaining deferred fixtures + full standalone packs are green.
`npm run freeze:check` = structural gate only.

## Modular product stance
Documentation is intentionaly **small and modular**: owner docs + one file per feature + machine registries.  
Standalone editions are a **product requirement**, not an afterthought — see PRODUCT.md edition matrix.

## Inventory integrity
| ID | Status | Note |
|----|--------|------|
| BUG-CURRENT-001 file-inventory stale | **CLOSED** | Regenerated from filesystem; `npm run inventory:check` hard-fails on missing paths |
| BUG-CURRENT-002 phase vocabulary | **CLOSED** | Scaffold ≠ docs-only; see DEVELOPMENT.md |

## Command-card / prose hygiene
| ID | Status | Note |
|----|--------|------|
| BUG-CURRENT-003 command cards incomplete | **CLOSED** | All 42 cards: validation, errors, fixtureRefs, recoveryCases, businessRules, result shape |
| BUG-CURRENT-004 duplicate owner prose | **CLOSED** | DoD xref; schema ticket IDs stripped; single PRODUCT standalone/routes |
| BUG-CURRENT-005 schema ticket vocabulary | **CLOSED** | Active schema comments are semantic-only |

## Historical issues (do not re-open as docs)
Fee vocabulary · feeQuantity · silent fee default · amountInBase-before-hash · Number in hash ·
dead command-coverage ref · book-base default · NAV as tx price · capitalized fee GL ·
posted-only reports · stock sell fees · holding uniqueness · FX resolver · category cycles ·
settle probing · operationId silent gen · metals purity/delivery · command aliases → **FIXED**.

Inventory: regenerated + `inventory:check`. Regression = code + test, not new audit Markdown.
