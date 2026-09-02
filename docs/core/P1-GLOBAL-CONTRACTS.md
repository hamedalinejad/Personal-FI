# P1 — Global Contracts (All Features)

این سند قراردادهای **P1** سراسری است. Featureها باید آن را تکمیل کنند (field matrices، reverse plans، rebuild determinism). در تعارض با مثال قدیمی Feature، قفل‌های P0 موجود + این P1 مبنا هستند.

---

## 20.1 Data / Field contract

برای **هر field** دامنه/API در هر Feature، جدول تکمیل شود:

| Column | Values / meaning |
|--------|------------------|
| Classification | `RAW` \| `DERIVED` \| `SNAPSHOT` \| `EXTERNAL_REPORTED` \| `LABEL` |
| Owner | Feature / Core / User / System |
| Editable? | yes/no + when (create-only, never after post, …) |
| SoT | table/engine that owns truth |
| Rebuild source | if SNAPSHOT/DERIVED: how to recompute |
| Migration status | canonical \| legacy-read-only \| deprecated |

**قانون:** هیچ field صرفاً به‌خاطر «قدیمی/زیاد» حذف نشود — legacy → read-only + migration path (Data-Preservation).

مرجع الگو: `Field-Level-SoT.md`, `Field-Level-Data-Ownership-Matrix.md`.

---

## 20.2 API surface

هر Feature فقط دو surface اصلی:

```text
commands  // mutate
queries   // read / calculate
```

### Command shape

```text
request.operationId  (required for financial commands)
  → validate
  → atomic financial operation
  → result.operationId (+ warnings/errors typed)
```

Public JSON: primitives + **decimal strings** for money/qty/rates (no IEEE number).

See `Feature-API-Contract.md`, `API-Result-and-Errors.md`.

---

## 20.3 Reversal plan (every financial Feature)

هر Feature مالی باید بتواند برای هر نوع operation بگوید:

```text
original operation
→ affected domain rows
→ journal lines
→ cash legs
→ snapshot targets to rebuild
→ reverse plan  (input to core.reverseOperation / buildReversalPlan)
```

Feature **اعمال** reverse را مالک نیست — Core است (X-001). Feature مالک **plan** و نگاشت دامنه است.

---

## 20.4 Rebuild determinism

```text
same ledger + same engineVersions + same asOf / ValuationContext
→ same result
```

Offline-only; no live provider (X-013). Ordering: business/effective date → createdAt → stable id (X-015).

---

## 21 — ValuationContext (global)

همه Portfolio / Report / Feature valuationها همین semantics را map می‌کنند:

```typescript
interface ValuationContext {
  valuationAsOf: string;   // primary as-of for the view
  priceAsOf?: string;      // override/default for asset prices
  fxAsOf?: string;         // FX curve / rates as-of
  cashAsOf?: string;       // cash & settlement cutoff
  liabilityAsOf?: string;  // loans/cheques/liabilities
  baseCurrency: string;
  valuationMode?: string;  // e.g. nav | market_last | …
  cashScope?: string;      // investments_only | include_platform_cash | full
  liabilityScope?: string; // principal_only | principal_plus_accrued | full_carrying
}
```

Historical reports **must** pass an explicit context; “latest everything” for a past date is forbidden (RP-002, X-010).

---

## 22 — Attribution model (multi-currency assets)

```text
Total P&L (base)
├── Asset price effect
├── FX effect
├── Fees (feeEffect — once per CanonicalFeeEvent)
├── Realized P&L
├── Unrealized P&L
└── External cash flows  → NOT P&L
```

| Event | Wealth Δ | P&L |
|-------|----------|-----|
| External contribution into portfolio | ↑ | 0 (flow, not return) |
| Internal transfer (same economic owner) | 0 | 0; cost basis moves |
| Network / trading fee | ↓ (usually) | per fee accounting policy (once) |
| Price/FX mark | varies | asset + FX effects |

Golden numeric example: `docs/core/fixtures/GOLDEN-CRYPTO-BTC-USDT-IRR-PNL.md`.

---

## 23 — Investment return vs wealth change

Reports must not conflate:

| Concept | Meaning |
|---------|---------|
| Contribution / Withdrawal | external capital flow |
| Price return | asset price effect |
| FX return | FX effect |
| Realized income / expense | distributions, interest received, fees expensed, realized gains |

**Example:** +1,000m IRR contribution, asset prices unchanged → **Wealth +1,000m**, **P&L = 0**.

Period investment return uses opening / flows / closing bridge (RP-006, FI-010), not raw wealth delta.

---

## 24 — Cash ownership

One pocket of money must not have two independent balances.

```text
Canonical SoT:
  fin_accounts + fin_journal_lines
```

Feature tables (`inv_crypto_cash`, brokerage `cashBalance`, metals platform cash, …):

```text
finAccountId  → FK to canonical account (when integrated)
balance       → DERIVED / SNAPSHOT only
```

Rebuild/reconcile against journal. See `Canonical-Cash-Model.md`, P0-091.

---

## Feature completion checklist (P1)

- [ ] Field matrix 20.1 for all persisted fields  
- [ ] commands/queries only; operationId on financial commands  
- [ ] Reversal plan table per operation kind  
- [ ] Rebuild deterministic tests (engineVersions + asOf)  
- [ ] ValuationContext mapped on all valuation queries  
- [ ] Attribution fields when quote path ≠ base  
- [ ] Wealth vs P&L separation in reports  
- [ ] Cash projections linked to fin_accounts / ports  

