# معماری نهایی (خلاصه قفل)

```text
UI / PWA  +  Feature Public APIs
        ↓
   Feature Layer (Accounts, Loans, Crypto, Stocks, Funds, …)
        ↓
   CashSettlementPort  (Adapter: Accounts | Local Settlement)
        ↓
   Financial Core (Operation · Journal · Audit)
        ↓
   Domain Ledgers
        ↓
   SQLite / sql.js → IndexedDB
```

| | |
|--|--|
| Price API | Valuation only — secondary |
| Internet | Optional enhancement — Core هرگز وابسته نیست |
| License | Separate from financial data |
| Report | Ledger → calc → report |
| Snapshot | Cache only |
| Cash path | فقط از طریق CashSettlementPort + Adapter |
| Local First | App → Local API → Domain → SQLite — بدون سرور اجباری |

## اصول قفل‌شده (P0)

### ۱. Integration = Adapter
Loan / Crypto / Stock / Fund / Metal **مستقیماً** به Accounts وابسته نیستند.
فقط `CashSettlementPort` → `AccountsCashAdapter` یا `LocalSettlementAdapter`.
→ Loan-only و Editionهای مشابه واقعاً کار می‌کنند.
سند: `Cash-Settlement-Adapter.md`

### ۲. صفحات = ۹ Shell + Sheet
```text
Dashboard · Accounts · Transactions · Investments · Loans · Assets · Planning · Reports · Settings
```
Investments = یک Shell با تب‌های Overview / Crypto / Stocks / Funds / Metals.
عملیات = Drawer / Modal / Sheet / Side Panel — نه ده‌ها صفحه مستقل.
`/wealth` = زیر Dashboard یا Reports — **صفحه دهم نیست**.

### ۳. 100% Local First
```text
App → Local API → Domain → SQLite
```
Price Fetching، Notifications، License، Cloud Backup **Core را وابسته نمی‌کنند**.
`PriceProvider` = interface: Manual + Cached + Online.
Offline = Manual + Cached کافی است.
هیچ Featureی نباید بگوید: اینترنت نداریم → سیستم کار نمی‌کند.

### ۴. Historical Price مستقل
Current Price ≠ Historical Price.
حداقل فیلدها: instrumentId, price, currency, timestamp, marketDate, source, sourceReference, isOfficial.
Valuation تاریخی: Transaction Date → closest valid historical price (≤ date) — نه current.

### ۵. Exchange Rate تاریخی
Transaction FX (قفل در operation) · Historical FX · Current FX — کاملاً جدا.
گزارش تاریخی هرگز از نرخ فعلی استفاده نمی‌کند.

## اولویت Documentation (وضعیت)

### P0 — قبل از Feature implementation
| مورد | وضعیت تقریبی |
|------|----------------|
| Crypto Cash SoT | ✅ SoT Matrix + crypto cash |
| Gross/Fee/Net qty | ✅ Fee matrix + crypto |
| Asset Registry یکسان | ✅ ref_instruments only |
| Account layers تفکیک | ✅ Account-Layers |
| Standalone Feature Contract | ✅ Feature-Independence |
| **Cash Settlement Adapter** | ✅ Cash-Settlement-Adapter.md |
| Dependency Matrix | ✅ Domain-Dependency |
| Raw/Derived/Snapshot | ✅ Field-Level-SoT |
| Data Preservation | ✅ + attachments |
| Currency vs Asset | ✅ economicKind |
| Historical Price / FX | ✅ Price-Fetching + Currency docs |
| Local First + PriceProvider | ✅ Technical-Architecture |
| Pages IA (۹ + Shell) | ✅ Pages-IA.md |

### P1
| مورد | وضعیت |
|------|--------|
| Loan Schedule + Calendar | ✅ در Loan doc |
| Iran business dates | ✅ Iran Core + Date matrix |
| Accounting Core / Journal | ✅ Accounting-Core |
| Reversal مشترک | ✅ Canonical Operation |
| Import/Export | ✅ Import + backup docs |
| Backup/Restore | ✅ 06-migration-backup |
| Document preservation | ✅ این سند |

جزئیات: SPEC-FREEZE.md
