# Personal-FI — AI Think-Tank Synthesis (through 2026-09-19)

**HEAD:** `d36da22` (main)  
**Mode:** multi-perspective strategic review — not a release certificate  
**Global truth:** `FREEZE_PROVEN=false` · `RELEASE_PROVEN=false` · `PRODUCTION=NO-GO`

---

## Room composition

| Seat | Lens |
|------|------|
| Systems engineer | invariants, ports, failure modes |
| Double-entry accountant | journal SoT, cash truth, Iran household books |
| Crypto/markets quant | cost basis, valuation context, no silent zero |
| Offline systems designer | crash, backup, browser durability |
| Product strategist | editions, minimal IA, what ships first |
| Cognitive psychologist | user trust, mental models, error meaning |
| Security realist | local secrets, export, future sync |
| Future-of-money analyst | multi-host, local-first vs cloud |
| Skeptical auditor | “implemented ≠ proven” discipline |

---

## 1. Systems engineer — “the machine is coherent”

What exists is no longer a pile of Markdown dreams. There is a real pipeline:

```
command → normalize → economic hash → atomic operation
  → journal + domain rows → durability → reports/rebuild
```

Phase 0–2 locked the grammar: Decimal strings, posted immutability, fee direction, idempotency, field-preservation (492 rows / 882 cols, gate OK). Phase 3 made persistence honest about integrity and backup. That is the right skeleton for a financial OS.

**Warning:** Structure gates (`freeze:check`) still say “structure OK, not freeze-proof.” Do not let structural greenwash become semantic freeze.

## 2. Accountant — “cash has one mouth”

The non-negotiable win: **cash is journal-derived**. Feature balances, brokerage cash snapshots, and planning envelopes are not second ledgers. Phase 6 correctly posts income/expense/cheque-clear/tax-pay through the same kernel, and budget/goal/bill **never** touch the journal.

For Iranian personal books this matters more than flashy charts: cheques, loans, tax obligations, and bank cash must reconcile to one trial balance story.

**Remaining gap:** full statement suite (GL/TB/BS/IS/CF) as product-facing, valuation-context-complete reports is still uneven relative to the kernel strength.

## 3. Markets quant — “price is an observation, not a wish”

Investment reporting unified crypto/stocks/funds/metals under Decimal + asOf + FX + explicit metal purity. Zero market value now serializes as `"0"`, not `null`. Scalar metal without purity rejects.

**Still partial:** R-M07 historical multi-hop FX golden family; corporate actions; TWR/MWR (correctly DEFERRED). Cost-basis architecture exists; product-depth of every fee role across venues is not “done forever.”

## 4. Offline designer — “Node is proven; browser is not the product yet”

Node SQLite path + integrity firewall + backup/restore validation is in good shape for a developer-grade offline core. The architecture document correctly targets:

```
Web: sql.js + IndexedDB via Persistence Port
Native: SQLite adapter
```

**Hard truth (R-M24):** durable-memory harness ≠ RELEASE E2E. Until real browser reload/crash/single-writer is proven, Web production is rhetoric.

## 5. Product strategist — “editions beat feature sprawl”

Standalone editions (loan-only, crypto-only, …) on one Core is the commercial differentiator—not 40 routes. PRODUCT locks six destinations; PLATFORM-ARCHITECTURE forbids UI→SQL.

Phase 6 gives the “daily money” surface the Core needed so Loan/Investment are not islands. The next product risk is **UI gravity**: building pages before Persistence Port + browser proof will fork the architecture.

**Ship sequence that still makes sense:**

1. Green CI on current main HEAD (process proof)  
2. Freeze-quality goldens (esp. R-M07)  
3. Browser sql.js+IDB E2E  
4. Thin PWA shell on locked IA  
5. One native POC (Capacitor *or* Tauri), not both  

## 6. Cognitive psychologist — “trust is reproducibility”

Users of personal finance software forgive plain UI; they do not forgive disappearing balances after reverse, or “zero” invented when FX is missing. The loan sign-model fix (sum signed portions) and `VALUATION_FX_MISSING` / asOf rejects are trust features, not edge cases.

Errors must stay coded envelopes (`docs/API.md`), never raw SQLite strings on screen.

## 7. Security realist

Local-first means the laptop *is* the bank vault. Encrypted backup/export and no secrets in frontend source are requirements before any sync story. Sync metadata (`originDeviceId`, `commandHash`) is correctly “schema-ready, not MVP.”

## 8. Future analyst

Equal economics across Web/Android/iOS/Windows is the north star in PLATFORM-ARCHITECTURE. That is ambitious and correct. It fails the moment any host grows a second cash ledger or a “convenience” Number path.

## 9. Skeptical auditor — final scorecard

| Claim | Verdict |
|-------|---------|
| Semantic foundation (P0) | Implemented; freeze unproven |
| Money/FX foundation (P1) | Implemented; R-M07 PARTIAL |
| Accounting kernel (P2) | Strong on main |
| Persistence/recovery (P3) | Strong on Node scope; browser E2E OPEN |
| Loan reference (P4) | Local acceptance green (stale Run 400 superseded) |
| Investment reporting (P5) | Local acceptance green + static zero/purity fixes |
| Daily finance modules (P6) | Implemented on main; catalog IMPLEMENTED |
| Multi-host architecture doc | Target captured; UI/native not built |
| Production ready | **NO** |

Local acceptance snapshot used in this synthesis: **19/19** (loan as-of + investment + phase6 core finance).  
`field:preservation` OK · `freeze:check` structure-only OK.

---

## Strategic synthesis (room consensus)

1. **Stop re-auditing closed Loan/Phase6 blueprint claims** against old phase branches; main is linear past those failures.  
2. **Do not declare FREEZE** until historical FX goldens and remaining SPEC_LOCKED release items have machine evidence.  
3. **Web is first product**, but only after Persistence Port browser E2E—otherwise “PWA” is a demo of a different system.  
4. **Protect the Core:** every new feature must enter through public-api + atomic operation + journal; planning stays non-journal.  
5. **Commercial path:** licensable verticals on one Core > broad UI. Capability gates must never delete history.  
6. **Honesty as brand:** `IMPLEMENTED ≠ GOLDEN ≠ RECOVERY ≠ RELEASE`. Keep that vocabulary sacred.

### One paragraph for the owner

Personal-FI today is a serious offline accounting kernel with real loan, investment valuation, and daily-money modules on a single journal truth—strong enough to build a product on, not strong enough to sell as finished software. The danger is no longer “missing contracts”; it is **premature surface area** (UI, dual native wrappers, sync) before freeze-quality FX, browser durability, and CI evidence catch up. The architecture documents now say the right thing; the next work is proof and a thin host, not another generation of audit Markdown.
