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
| `import` | CSV/JSON/batch |
| `api` | نادر برای tx؛ بیشتر قیمت |
| `system` | مثلاً fee سیستمی |
| `opening` | موجودی اولیه |
| `correction` | بعد از reversal |
| `migration` | |

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
