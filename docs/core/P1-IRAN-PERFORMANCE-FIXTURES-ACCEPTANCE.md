# P1 — Iranian Detail · Performance · Golden Fixtures · Acceptance Matrix

مکمل `P1-GLOBAL-CONTRACTS.md`. قبل از **SPEC freeze** این موارد باید در قراردادها پوشش داده شده باشند (نه لزوماً همه در UI).

---

## 25 — Iranian accounting detail (contracts, not UI bloat)

| Area | Contract requirement |
|------|----------------------|
| **Rial / Toman** | IRR canonical storage; Toman = **display only** (`isTomanDisplay` / UI scale ×10). Never dual currency SoT. |
| **Dates** | Storage Gregorian/UTC for timestamps; `businessDate` and user-facing calendars support **Jalali** via settings; tax periods carry `calendar` (jalali/gregorian). |
| **Bank** | IBAN/Shaba, bank, branch, account kind/product metadata on Accounts; uniqueness scoped (AC-005). |
| **Cheque** | Sayadi ID + cheque number validation/scoped unique (CH-005); clear/bounce dates (CH-001…003). |
| **Loan** | Interest / fee / penalty **component-level** outstanding and payment allocation (LN-004/005). |
| **Equities** | Trade vs settlement T+n (ST-001); Iran market lot/tick (ST-010). |
| **Dividend** | gross / withholding / net (ST-007). |
| **CA** | Rights, capital increase, bonus, split — CorporateActionEngine (ST-002/003). |
| **Funds** | Issuance/redemption + ETF paths; NAV vs market (FI-001/002). |
| **Metals** | Purity/fine vs gross, making/labor (ME-002/003/010); coin ≠ bullion (ME-004). |
| **Metals→Physical** | Delivery lineage + carrying cost (ME-009, PA-008). |
| **FX** | Historical rate on every multi-currency op: `exchangeRateToBase` + asOf + path when multi-hop. |

UI stays thin: these live in **domain contracts + engines + optional advanced fields**, not extra main pages.

---

## 26 — Performance and simplicity

**Many Features are fine; many main Pages are not.**

```text
~9 main pages (IA)
  + contextual sheets/drawers
  + Feature APIs
  + Core engines
```

Reference: `docs/00-Product/Pages-IA.md` (align count/structure; do not explode page tree per Feature).

### Heavy reports

```text
background local rebuild
  → snapshot + sourceWatermark
  → UI reads result
```

- UI **must not** run ad-hoc multi-Feature SQL.
- Queries go through Feature/Capability APIs and report projections.
- Stale → rebuild or explicit fail (RP-009).

---

## 27 — Golden Fixture Pack (mandatory)

Inventory of **required** fixtures before implementation release of the related area. Each fixture: inputs, expected domain/journal/cash effects, decimal strings, engineVersions.

### Core

| Fixture | Covers |
|---------|--------|
| income | post income + cash |
| expense | post expense + cash |
| transfer | internal transfer principal + fee leg |
| reversal | exact inverse |
| correction | reverse + new op graph |
| fee | CanonicalFeeEvent one effect |
| multi-currency | exchangeRateToBase + path |

### Crypto

| Fixture | Covers |
|---------|--------|
| IRR buy / USDT valuation | book vs mark path |
| BTC↓ + USDT/IRR↑ | attribution golden (existing file) |
| BTC↑ + USDT/IRR↓ | attribution offset |
| fee in quote | net qty = gross |
| fee in base asset | net < gross |
| C2C | transferred cost ≠ market |
| internal transfer | P&L=0, cost carry |
| network fee burn | qty/fee once |
| bridge | two instruments |
| external gift | cost policy |
| airdrop | economicKind |
| opening | opening operation |

Existing: `docs/core/fixtures/GOLDEN-CRYPTO-BTC-USDT-IRR-PNL.md`

### Stocks Iran

buy/sell · dividend gross/withholding/net · bonus · split/reverse split · capital increase · rights issue/exercise/sell · brokerage transfer · settlement delay · delisting/write-off

### Funds

issue · redemption · ETF buy/sell · distribution · reinvest · NAV vs market · fee treatment

### Metals

18K · 24K · coin · fine/gross pricing · buy/sell · delivery · delivery cancellation · delivery fee · metals→physical lineage

### Loan

monthly declining · weekly · custom day count · variable rate · grace · partial payment · early payment · fee due/paid/waived · final residual · multi-currency repayment · reversal

### Fixture authoring rules

- One folder or index under `docs/core/fixtures/` (and/or `docs/features/.../fixtures/`).
- Link from `Mandatory-Test-Vectors.md`.
- Status: planned | specified | implemented-green.

---

## 28 — Acceptance matrix before SPEC freeze

| محور | شرط |
|------|------|
| Identity | یک canonical identity per asset (`ref_instruments.id`) |
| Money | decimal string everywhere (public + persist financial) |
| FX | direction + as-of + path when multi-hop |
| P&L | price / FX / fee / cash-flow attribution |
| Fee | one economic effect |
| Accounting | balanced journal |
| Cash | one SoT (fin_accounts + journal) |
| Reversal | exact inverse via Core |
| Idempotency | same operationId retry safe |
| Historical | deterministic as-of |
| Snapshot | rebuildable + watermark |
| Offline | no provider dependency for transaction correctness |
| Standalone | Feature usable without Accounts UI (via ports) |
| API | commands/queries + serializable result |
| Data preservation | no silent field loss |
| Reconcile | expected vs actual |
| Fixtures | green before implementation release |

**SPEC freeze gate:** این ماتریس + fixture pack مربوط به scope همان release باید مشخص/سبز باشند؛ در غیر این صورت scope کاهش می‌یابد نه کیفیت قرارداد.

---

## Related

- `P1-GLOBAL-CONTRACTS.md`
- `Mandatory-Test-Vectors.md`
- `Pages-IA.md`
- Feature `*-LOCKS.md` files

## P0-FINAL-033…035 Fixture gate

Schema for numeric fixtures, failure vectors, reversal before/after pairs: `Financial-Invariants.md`. Inventory alone is not release-green.

