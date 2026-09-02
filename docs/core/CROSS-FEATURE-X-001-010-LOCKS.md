# Cross-Feature Locks X-001 … X-010

در تعارض با Feature prose قدیمی، این سند + Core operation/identity/FX docs برنده است.

---

## X-001 — Reversal: Core owns reverse

| Forbidden | Required |
|-----------|----------|
| Feature-local “void then manually reverse cash/domain” paths that bypass Core | `core.reverseOperation(operationId)` (or equivalent single Core API) |
| Partial reverse of journal without domain or vice versa | Feature only **buildReversalPlan** / adapter input; Core applies |

**Acceptance:** one reverse undoes cash + domain + journal effects **exactly once** (no double reverse legs).

---

## X-002 — Correction graph

Correction pattern:

```text
originalOperationId
  → reverseOperation (reversesOperationId = original)
  → new correcting operation (optional link: correctsOperationId / supersedes)
```

- Graph must be queryable: original + reverse + corrected as one correction chain.
- **No double cash effect** (reverse restores; new op applies delta once).

---

## X-003 — Identity: ref_instruments.id only

- Canonical asset identity = `ref_instruments.id` (UUID).
- `assetKey` = provider/index convenience only — **not** PK/identity for holdings rebuild.
- `symbol` = mutable label.
- Rebuild/query paths must not key identity on symbol or assetKey alone.

---

## X-004 — Snapshot is projection

- SoT: ledger / journal (+ domain immutable events).
- `cashBalance`, holding qty totals, etc. = **snapshot/projection**.
- Corrupt snapshot detectable via `reconcile*`; repair rebuilds from SoT (audited), never silent ledger rewrite.

---

## X-005 — Public API money types

- Public API + JSON examples: **decimal strings only** for money/qty/rates.
- No `number` / public `Decimal` object in contracts or canonical examples.
- Align with Financial-Invariants + DOCUMENTATION-STYLE-P2.

---

## X-006 — Polymorphic relatedFeature + relatedId

- No real DB FK across all features; integrity via:
  - atomic validation on write,
  - `acc_transaction_links` (or equivalent link table),
  - reconcile orphan detection.
- **Acceptance:** orphan link count = 0 in fixtures/tests.

---

## X-007 — Enum single owner

- `relatedFeature`, account kinds, and shared enums: **one Core owner** (e.g. `core/types`).
- Feature-local duplicate enum definitions forbidden for the same concept.
- Doc/CI check against Core enum list.

---

## X-008 — FX naming

- Canonical field: `exchangeRateToBase` (rate from tx currency → user `baseCurrency` at operation).
- `quoteCurrency` / pair metadata separate when needed.
- UI may show «نرخ تتر» only as label when quote is USDT; **not** the domain field name.
- Same semantic for base = IRR | USD | EUR | USDT | …

---

## X-009 — FX attribution in P&L

Total base P&L alone is insufficient. Decompose when multi-currency:

| Effect | Meaning |
|--------|---------|
| Asset price effect | Change in asset price in quote/local |
| FX effect | Change from FX movement to base |
| Fee effect | Fees in base |
| Cash-flow effect | Explicit cash in/out |

Document at least one fixture (e.g. BTC priced in USDT, base IRR) showing split.

---

## X-010 — Historical valuation

Historical reports **must** use:

- `asOf` / report period bounds  
- `priceAsOf` / `marketDate`  
- `fxAsOf` / rate locked on operation or as-of curve  
- settlement cutoff when cash is settlement-dated  

**Forbidden:** applying latest price/FX to historical dates. Today’s market move must not rewrite history.

---

## Status

| ID | Status |
|----|--------|
| X-001 … X-010 | **LOCKED** 2026-09-02 |

## Golden fixture (X-009)

BTC/USDT/IRR worked example with assetPriceEffect + fxEffect adding to pnlBase: `docs/core/fixtures/GOLDEN-CRYPTO-BTC-USDT-IRR-PNL.md`.

