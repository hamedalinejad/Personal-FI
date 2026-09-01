# معماری نهایی (خلاصه قفل)

```text
                         PERSONAL-FI
                              │
                   ┌──────────┴──────────┐
                   │                     │
             Financial Core        Application Core
                   │                     │
        ┌──────────┼──────────┐          │
        │          │          │          │
     Accounting  Money       FX       Documents / License
        │
        ├── Loans
        ├── Crypto
        ├── Stocks
        ├── Funds
        ├── Metals
        └── Assets
```

```text
UI → Feature API (commands/queries) → Domain → CashSettlementPort → Core → SQLite
```

**UI ناوبری (فقط ۹):**

```text
Dashboard · Accounts · Transactions · Investments · Loans · Assets · Planning · Reports · Settings
```

## Database Layers

| لایه | محتوا |
|------|--------|
| 01 CORE | operations, journal, fin accounts, parties, currency, audit |
| 02 DOMAIN LEDGERS | loans, crypto, stocks, funds, metals, … |
| 03 PROJECTIONS | holdings, balances, snapshots — rebuildable |
| 04 SUPPORT | documents, settings, categories, notifications, prices |

**01+02 = Canonical · 03 = Rebuildable · 04 = Supporting**

## License / Edition

```text
Core  →  License Manager  →  License File (local verify)
```

Server فقط activation/renewal. روزمره offline.  
Edition = feature flags روی **Same Core**. Accounting UI اختیاری؛ Core اجباری.

## Engines

Decimal · Money · FX · Valuation · CostBasis · LoanSchedule · Accounting · Reconciliation · Operation · Audit

## قفل‌های کلیدی (۲۱–۵۶ خلاصه)

| موضوع | قانون |
|--------|--------|
| Adapter | CashSettlementPort — Loan-only واقعی |
| Pages | ۹ shell + sheet؛ نه /wealth دهم |
| Local First | بدون سرور برای Core |
| Historical Price/FX | closest ≤ asOf؛ سه لایه FX |
| IranCore | versioned rules نه hard-code |
| IRR/Toman | DB=IRR؛ UI display |
| Documents | docs_documents + links |
| Audit | Who/When/Before/After/Why/Source |
| operationId | UNIQUE + Operation Graph |
| Events | immutable + reversal |
| Fixtures | تراز journal/qty/cash/loan/NW |
| Reconcile | همه featureها؛ drift=error |
| Snapshot | rebuildable |
| EXTERNAL | ≠ DERIVED |
| API | commands/queries؛ transport-agnostic |
| License | local verify؛ edition flags |
| Migration | no DROP without preservation |
| JSON | نه SoT برای money/qty/schedule/tiers |
| Account | financial account عام؛ UI زیرمجموعه |
| Party | مستقل از Account |
| Cheque | domain مستقل |
| Recurring/Budget | نه transaction source / نه تغییر ledger |
| Reports | query ledger+engine؛ نه SoT جدا |

## اولویت

`Implementation-Priority.md` — P0 قبل از code، P1 قبل از MVP، P2 بعد از هسته.

اسناد این بسته:

- `License-Offline.md`
- `Database-Layers.md`
- `Financial-Operation-Matrix.md`
- `Calculation-Engines.md`
- `Migration-Data-Preservation.md`
- `JSON-Policy.md`
- `Implementation-Priority.md`

---

## تکمیلی (Standalone / Isolation / Nav / Identity)

| موضوع | قانون |
|--------|--------|
| Feature Availability + Nav Visibility | Edition می‌تواند فقط Loans+Settings نشان دهد |
| Feature Isolation | بدون UI/route/store/repo فیچر دیگر؛ فقط Port/Adapter |
| Standalone A / Integrated B | LocalSettlement vs AccountsCashAdapter |
| Account name | NOT unique؛ unique = id / iban when present |
| Currency ≠ Instrument | denomination vs ownership (ref_instruments) |
| USDT | cash در صرافی یا holding per network — دو نقش |
| calculationContext | روی هر operation قفل (method + versions) |

---

## تکمیلی Domain (Loan / Fee / Fund / FX / Calendar)

| موضوع | قانون |
|--------|--------|
| Loan Operation SoT | یک operation → subledger + journal + cash؛ نه دو tx موازی |
| Core Fee Engine | policy per feature؛ feeAmount total همیشه |
| NAV ≠ transactionPrice | صندوق ایران |
| Metals | quantityMg + purity → fineWeightMg |
| Crypto identity | assetKey/instrumentId؛ gross/fee/net |
| Date fields | جدا بمانند؛ IranBusinessCalendar برای due/settlement |
| FX rate | direction صریح: 1 USDT = 60,000 IRR |
| Field lifecycle | ACTIVE…UNKNOWN؛ DROP فقط با replacement+rule+verify |
