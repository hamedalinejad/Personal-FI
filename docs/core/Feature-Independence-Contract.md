# Feature Independence Contract

هر Feature مشخص می‌کند:

| | |
|--|--|
| **Required** | بدون آن Feature کار نمی‌کند |
| **Optional** | غنی‌سازی |
| **Integration** | وصل به چه Featureهایی — **فقط از طریق Port/Adapter** |
| **Can operate without** | لیست صریح |

## نمونه Loan

| | |
|--|--|
| Required | Core, Loan Ledger, CashSettlementPort |
| Optional | Accounts (via AccountsCashAdapter), Parties, Documents, Notifications, Accounting Reports UI |
| Without | Investments, Budget, Goals, Crypto |
| Cash path | `Loan → CashSettlementPort → AccountsCashAdapter` **یا** `LocalSettlementAdapter` |

## نمونه Fund / Crypto / Stocks / Metals

| | |
|--|--|
| Required | Core, Domain Ledger, Instrument Registry, CashSettlementPort |
| Optional | Accounts (via Adapter), Portfolio, Price, Accounting UI |
| Cash path | همان الگوی Port + Adapter — **بدون import مستقیم Accounts** |

```text
Standalone UI ≠ Standalone Ledger
Journal از Core همیشه قابل تولید است.
```

---

## Cash Settlement = Adapter فقط (P0)

```text
Loan / Crypto / Stock / Fund / Metal
         ↓
  CashSettlementPort
         ↓
  ┌──────┴──────┐
  │             │
Accounts     Local Settlement
(اگر فعال)   (اگر Accounts خاموش)
```

این الگو **اجباری** است تا:

```text
Loan-only Edition
Crypto-only Edition
Fund-only Edition
…
```

واقعاً بدون ماژول Accounts کار کنند.

جزئیات: **`Cash-Settlement-Adapter.md`**.

---

## Accounting Core ≠ Accounting UI (P0)

خواسته محصول: کاربر می‌تواند **فقط Loan** (یا فقط Crypto / Fund / Metal / Stocks) را ببیند و استفاده کند.

این **حذف Accounting Core نیست**.

```text
User
  ↓
Loan Module (UI + API + Reports تخصصی)
  ↓
Loan Ledger (domain)
  ↓
CashSettlementPort → Adapter
  ↓
Accounting Core (journal lines — همیشه در atomic op قابل تولید)
```

| لایه | اجباری برای صحت مالی؟ | اجباری در UI کاربر؟ |
|------|------------------------|---------------------|
| Accounting Core (journal, fin_accounts, operations) | **بله** (حداقل projection) | خیر |
| CashSettlementPort + یکی از Adapterها | **بله** برای ops نقدی | خیر (تزریق در bootstrap) |
| Chart of Accounts / Trial Balance / Journal browser UI | خیر | فقط اگر کاربر Accounting را فعال کند |
| Loan / Crypto / Fund UI | طبق ماژول‌های روشن | بله برای همان ماژول |

```text
Accounting Core ≠ Accounting UI
Standalone Feature UI ≠ بدون Ledger/Journal پشت‌صحنه
Accounts Optional ≠ بدون مسیر تسویه نقدی
```

### ماتریس استقلال UI

| حالت کاربر | UI فعال | Core پشت‌صحنه | Adapter نقدی |
|------------|---------|----------------|--------------|
| Loan only | Loan + حداقل Settings | Loan Ledger + Journal projection | LocalSettlementAdapter |
| Crypto only | Crypto | Crypto Ledger + Journal + CostBasisEngine | LocalSettlementAdapter |
| Fund only | FIF | FIF Ledger + Journal + CostBasisEngine | LocalSettlementAdapter |
| Metal only | Metals | Metals Ledger + Journal + CostBasisEngine | LocalSettlementAdapter |
| Full | همه + Accounting UI اختیاری | همه | AccountsCashAdapter |

Feature در قرارداد خود می‌نویسد:

| | |
|--|--|
| Required Core | db, Decimal, Atomic op, Journal writer, CashSettlementPort |
| Required Domain | ledger خودش |
| Optional UI modules | Accounting reports, Portfolio, Accounts |
| Can hide | Chart of Accounts, Trial Balance, raw Journal screens, Accounts UI |

---

## ساختار هر Feature (استقلال ماژول)

```text
Feature
 ├── Domain
 ├── Ledger
 ├── API
 ├── Queries
 ├── UI
 ├── Reports
 └── Tests
```

هر ماژول به‌تنهایی قابل پیاده‌سازی و تست است؛ درخواست‌ها از UI فقط از **Feature API** می‌روند، نه SQL مستقیم.
اتصال به Accounts فقط از طریق **CashSettlementPort**.

جزئیات لایه‌بندی کل سیستم: `Module-Architecture.md` · `Cash-Settlement-Adapter.md`.
