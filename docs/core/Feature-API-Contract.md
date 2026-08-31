# Feature Public API Contract

## دو سطح API

| سطح | مثال | نقش |
|-----|------|-----|
| **Command** | `createBuy`, `recordExpense`, `correctTransaction`, `void…` | تغییر state مالی |
| **Query** | `getHolding`, `listTransactions`, `calculatePL`, `getSummary` | فقط خواندن / محاسبه |

```text
cryptoApi.createBuy(req) → Result { operationId, ... }
cryptoApi.getHolding(id)
```

## نه HTTP اجباری در v1

```text
Feature Public API = TypeScript module interface (in-process)
```

همان Contract بعداً می‌تواند پشت REST / IPC / Mobile Bridge / Cloud باشد.  
**Offline-first:** UI → `cryptoApi.*` مستقیم؛ بدون وابستگی به server.

## هر Command

```text
Request  +  Result  +  FinancialError
operationId در Result (و در request برای idempotency)
```

Trace:

```text
UI → API → runAtomicFinancialOperation(operationId)
  → Domain → Journal → Cash → Audit
```

## sourceType روی داده مالی (Raw)

| sourceType | |
|------------|--|
| `manual` | ورود کاربر |
| `import` | CSV/JSON/batch عمومی |
| `bank_statement` | صورت‌حساب بانک |
| `broker_statement` | گزارش کارگزاری |
| `exchange_api` | (نادر؛ بیشتر قیمت) |
| `api` | generic remote |
| `system` | fee/system generated |
| `opening` | موجودی اولیه |
| `correction` | بعد از reversal |
| `migration` | مهاجرت نسخه |

اختیاری: `sourceReference` (مثلاً `statement-1405-04.csv`, `broker-report-123`).

**ممنوع:** گم شدن منشأ تراکنش بعد از import.

---

## ساختار استاندارد هر Feature

```text
feature/
  commands/   buy, sell, transfer, correct, void, …
  queries/    getHolding, listTransactions, getPortfolio, calculatePL, …
  events/     (emit پس از persist)
```

مثال: `crypto.commands.buy()` · `crypto.queries.getHolding()`

یکنواختی برای Web / PWA / Electron / Mobile / REST آینده — v1 همچنان **TypeScript in-process** است نه HTTP.

### Provenance fields (روی هر domain financial row)

`sourceType` · `sourceReference` · `sourceDocumentId?` · `importBatchId?` · `sourceTransactionId?` (external)

بدون provenance، audit «این مبلغ از کجا آمد؟» ممکن نیست.

---

## featureId پایدار (نه شماره Product)

| Presentation # | featureId canonical |
|----------------|---------------------|
| ۱ | `accounts` |
| ۳ | `income` |
| ۴ | `expense` |
| ۶ | `loan` |
| ۷ crypto | `investment.crypto` |
| … | `investment.stocks` / `fif` / `metals` |

شماره Product فقط presentation است؛ dependency و code با **featureId** پایدار.

### ساختار پوشه Feature

```text
feature/
  api/
  commands/
  queries/
  domain/
  events/     # optional
```

**ممنوع:** Feature مستقیم SQL جدول Feature دیگر را بخواند/بنویسد.  
مجاز: Feature → Core API / Accounting Core / public API فیچر دیگر.

## قانون طلایی ماژول

```ts
// هر فیچر فقط Public API export می‌کند
export const AccountsAPI = { createAccount, list, ... }
// import از فیچر دیگر ❌ — فقط core و public API مجاز
```

---

## Standalone Capable (محصول)

هر Feature باید بتواند بدون UI سایر Featureها:

create / list / pay / report همان دامنه

را ارائه دهد.

وابستگی فقط به **Core** (Operation, Journal, Currency, Instrument) — نه به UI صفحه Accounting.

Ledger همچنان مرکزی است.
