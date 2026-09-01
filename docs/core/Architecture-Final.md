# معماری نهایی (خلاصه قفل)

```text
UI / PWA  +  Feature Public APIs (commands / queries)
        ↓
   Feature Layer (Accounts, Loans, Crypto, Stocks, Funds, …)
        ↓
   CashSettlementPort  (Adapter: Accounts | Local Settlement)
        ↓
   Financial Core (Operation Graph · Journal · Audit)
        ↓
   Domain Ledgers + IranCore (versioned rules)
        ↓
   SQLite / sql.js → IndexedDB
```

| | |
|--|--|
| Price API | Valuation only — secondary |
| Internet | Optional enhancement — Core هرگز وابسته نیست |
| License | Separate from financial data |
| Report | Ledger → calc → report |
| Snapshot | Cache only — rebuildable |
| Cash path | فقط از طریق CashSettlementPort + Adapter |
| Local First | App → Local API → Domain → SQLite — بدون سرور اجباری |
| API | Transport-agnostic: Request / Response / Error / operationId |

## اصول قفل‌شده P0 (۲۱–۳۹)

### Integration = Adapter
Loan / Crypto / Stock / Fund / Metal → `CashSettlementPort` → Accounts یا Local Settlement.
سند: `Cash-Settlement-Adapter.md`

### صفحات = ۹ Shell + Sheet
Dashboard · Accounts · Transactions · Investments · Loans · Assets · Planning · Reports · Settings  
Investments = یک Shell + تب‌ها؛ `/wealth` زیر Dashboard/Reports.

### 100% Local First
PriceProvider = Manual | Cached | Online. Offline = Manual + Cached.

### Historical Price / FX
Current ≠ Historical. closest ≤ asOf. Transaction FX · Historical FX · Current FX جدا.

### IranCore (قوی، نه پیچیده)
Calendar · MarketDate · MarketSession · Holiday · SettlementRule · CurrencyDisplay · Toman/Rial · NumberFormat · Market Rules  
قواعد Settlement / Fee / Tax / Holiday / Trading Calendar = **versioned/configurable** — نه hard-code در Feature.

### ریال / تومان
DB = **IRR فقط**. UI = ریال | تومان (display preference). هیچ Money بدون Currency.

### Documents
`docs_documents` + `docs_links` — پیوست Invoice/Contract/Receipt/Statements بدون تکرار در Domain Ledger.

### Audit
Who · When · Which Operation · Before · After · Why · Source · Reference — حتی در Single User.

### operationId در DB
UNIQUE در `fin_operations` + idempotency در `runAtomicFinancialOperation` — double-submit = یک نتیجه.

### Transaction = Event immutable
اصلاح = REVERSAL / CORRECTION / ADJUSTMENT جدید.

### Operation Graph
همه legهای یک عمل (cash, asset, fee, tax, journal) یک `operationId` دارند.

### Fixture تراز
Σ Debit = Σ Credit · Qty · Cash · Loan principal · Net Worth — در CI.

### Reconciliation همه‌جانبه
Bank · Crypto · Stocks · Funds · Metals · Loans · Assets · Journal · Portfolio — drift = Error نه silent accept.

### Snapshot قابل rebuild
حذف snapshot نباید دادهٔ غیرقابل‌ساخت از ledger را از بین ببرد.

### EXTERNAL_REPORTED ≠ DERIVED
سود گزارش‌شده کارگزاری/صندوق جدا از calculatedProfit حفظ می‌شود.

### Feature API
`commands/` + `queries/` — Transport-agnostic.

## وضعیت Documentation

| مورد | وضعیت |
|------|--------|
| Cash Settlement Adapter | ✅ |
| Pages IA (۹ + Shell) | ✅ |
| Local First + PriceProvider | ✅ |
| Historical Price / FX | ✅ |
| IranCore versioned | ✅ `core/iran/README.md` |
| IRR vs Toman display | ✅ |
| Documents links model | ✅ |
| Audit fields | ✅ `Audit-vs-Financial-Event.md` |
| operationId UNIQUE + Graph | ✅ `Canonical-Financial-Operation.md` |
| Immutable events + fixtures | ✅ |
| Reconcile all features | ✅ `db/04-reconciliation-integrity.md` |
| Snapshot rebuild + EXTERNAL | ✅ `Raw-vs-Derived-Data.md` |
| commands/queries + transport | ✅ `Feature-API-Contract.md` |

جزئیات: SPEC-FREEZE.md · اسناد لینک‌شده بالا
