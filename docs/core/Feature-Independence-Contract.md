# Feature Independence Contract

هر Feature مشخص می‌کند:

| | |
|--|--|
| **Required** | بدون آن Feature کار نمی‌کند |
| **Optional** | غنی‌سازی |
| **Integration** | وصل به چه Featureهایی |
| **Can operate without** | لیست صریح |

## نمونه Loan

| | |
|--|--|
| Required | Core, Loan Ledger |
| Optional | Accounts, Parties, Documents, Notifications, Accounting Reports UI |
| Without | Investments, Budget, Goals, Crypto |

## نمونه Fund

| | |
|--|--|
| Required | Core, Fund Ledger, Instrument Registry |
| Optional | Bank, Portfolio, Price, Accounting UI |

```text
Standalone UI ≠ Standalone Ledger
Journal از Core همیشه قابل تولید است.
```


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
Accounting Core (journal lines — همیشه در atomic op قابل تولید)
```

| لایه | اجباری برای صحت مالی؟ | اجباری در UI کاربر؟ |
|------|------------------------|---------------------|
| Accounting Core (journal, fin_accounts, operations) | **بله** (حداقل projection) | خیر |
| Chart of Accounts / Trial Balance / Journal browser UI | خیر | فقط اگر کاربر Accounting را فعال کند |
| Loan / Crypto / Fund UI | طبق ماژول‌های روشن | بله برای همان ماژول |

```text
Accounting Core ≠ Accounting UI
Standalone Feature UI ≠ بدون Ledger/Journal پشت‌صحنه
```

### ماتریس استقلال UI

| حالت کاربر | UI فعال | Core پشت‌صحنه |
|------------|---------|----------------|
| Loan only | Loan + حداقل Settings | Loan Ledger + Journal projection |
| Crypto only | Crypto | Crypto Ledger + Journal + CostBasisEngine |
| Fund only | FIF | FIF Ledger + Journal + CostBasisEngine |
| Metal only | Metals | Metals Ledger + Journal + CostBasisEngine |
| Full | همه + Accounting UI اختیاری | همه |

Feature در قرارداد خود می‌نویسد:

| | |
|--|--|
| Required Core | db, Decimal, Atomic op, Journal writer |
| Required Domain | ledger خودش |
| Optional UI modules | Accounting reports, Portfolio, … |
| Can hide | Chart of Accounts, Trial Balance, raw Journal screens |

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

جزئیات لایه‌بندی کل سیستم: `Module-Architecture.md`.
