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


---

## Feature Isolation Invariant (P0)

A feature must be fully functional without:

- another feature **UI**
- another feature **route**
- another feature **state store**
- another feature **repository**

Optional integrations only via **Public APIs / Ports / Adapters**.

```text
ممنوع:
  Loan → import AccountsRepository / جداول داخلی Accounts

مجاز:
  Loan → SettlementPort
            ├── LocalSettlementAdapter
            └── AccountsCashAdapter
```

این invariant شرط فروش ماژولی و Edition محدود است.

---

## Standalone Feature vs Integrated Feature (قفل معنایی)

### حالت A — Standalone Feature

مثلاً فقط Loan Module فعال است (Accounts خاموش):

```text
Loan
  ↓
LocalSettlementAdapter
  ↓
Loan Ledger + Journal (Core)
```

بدون UI Accounts، بدون route Accounts، بدون وابستگی به `acc_accounts` به‌عنوان شرط صحت.

### حالت B — Integrated Feature

اگر Accounts فعال باشد:

```text
Loan
  ↓
CashSettlementPort
  ↓
AccountsCashAdapter
  ↓
Bank / Financial Account
```

### جمع‌بندی

```text
Loan Core
   ├── Local Settlement   (Standalone)
   └── Accounts Settlement (Integrated)
```

همان الگو برای **Crypto · Stocks · Funds · Metals** اجباری است.

**توجه مستندسازی:** هر جا در Feature doc هنوز `accountId → acc_transactions` به‌صورت اجباری نوشته شده، باید به‌معنی «وقتی Accounts فعال است / از طریق Port» خوانده شود؛ نه وابستگی compile-time به Accounts. مرجع اجرایی: `Cash-Settlement-Adapter.md`.


---

## Enforce در Code (P0 — روز اول پیاده‌سازی)

مستند به‌تنهایی مرز را نگه نمی‌دارد. از **روز اول کد**:

```text
ESLint: no-restricted-imports
```

- Feature A **نمی‌تواند** از مسیرهای داخلی Feature B یا `db` خام فیچر دیگر import کند
- فقط `features/<B>/public-api` یا Capability API مجاز است
- CI باید روی نقض این قانون fail شود

بدون enforce در tooling، ماژولار بودن به اسپaghetti تبدیل می‌شود.

---

## سه سطح قابلیت (اجرایی)

### Level 1 — Fully standalone
مثلاً فقط Loan: وام، اقساط، سود، جریمه، برنامه، پرداخت، گزارش، طرف — بدون نصب Investment/Budget/Crypto.

### Level 2 — Optional integration
Loan Payment → optional Cash Account از طریق Port.

### Level 3 — Full integration
Loan + Accounting UI + Accounts + Documents + Reports سراسری.

جزئیات بسته: `Feature-Independence-Contract.md`.

---
## P0-006 — Standalone vs required accountId

اگر Feature «Standalone» است، **هیچ** ستون `accountId`/`accountTransactionId` نباید NOT NULL یا «اجباری» در schema/prose باشد.
Linkage فقط از طریق SettlementPort و nullable FK.

## Capability without UI (historical batch-5 §6; see host LOCK)

Features remain operable via API alone; no hard dependency on a parent shell UI for domain operations.

Fixtures: STANDALONE-CRYPTO / LOAN / FUND — `fixtures/README.md` (P1-FINAL-047).

## Final Audit §23 — Standalone editions (acceptance-tested)

```text
Loan-only · Fund-only · Crypto-only · Stocks-only · Metals-only
```

Feature UI independence ≠ removal of Accounting Core / journal truth.

---

## Standalone Mode (License-critical)

**Definition:** A paid or free **edition** that activates only a subset of Features (e.g. Loan calculator only) without requiring Accounts UI or full Personal Accounting navigation.

### What Standalone is

```text
User sees: Loan UI (+ minimal Settings)
User does not need: Accounts page, full Chart of Accounts UI, Investment UI
```

### What Standalone is NOT

```text
Standalone ≠ no journal
Standalone ≠ feature-owned cash ledger
Standalone ≠ wipe data when license upgrades/downgrades
```

### Mandatory Core behavior

1. Every financial mutation still goes through `runAtomicFinancialOperation`.
2. Core still writes **hidden local journal** (`fin_operations`, `fin_journal_entries`, `fin_journal_lines`, `fin_accounts` including local settlement cash).
3. Cash path = `CashSettlementPort` → `LocalSettlementAdapter` → Core `fin_accounts` row + journal lines.
4. Domain ledger (e.g. `ln_transactions`) remains SoT for specialty state; journal remains SoT for accounting/cash.
5. **No-Field-Loss:** upgrading license from Loan-only → Full must **not** require re-entry of history. Existing operations, journal lines, and domain rows stay; new UI surfaces simply read the same DB.
6. **License/capability** only gates UI and `capabilities()` — never deletes journal or domain history.

### Acceptance

| Check | Pass |
|-------|------|
| Loan-only creates loan + payment without Accounts UI | yes |
| After payment, journal lines exist and balance | yes |
| Export/backup includes journal + domain | yes |
| Enable Accounts UI later → balances reconcile without data loss | yes |

---

## Hidden Journal Mode (Standalone) — قفل معماری

> **اصلاح اتاق فکر:** وابستگی به `fin_accounts` / `fin_journal_lines` **پنهانِ درست** است، نه باگ.  
> آنچه ممنوع است وابستگی به **Accounts UI** و ساخت ledger نقدی جداگانه است.

### قانون

```text
Standalone Feature UI
        ↓
Feature Public API
        ↓
runAtomicFinancialOperation
        ↓
Domain ledger (ln_*, inv_*, …)
        ↓
CashSettlementPort → LocalSettlementAdapter
        ↓
همان fin_accounts + fin_journal_lines  (ژورنال واقعی Core — نه موقت)
```

| درست | غلط |
|------|-----|
| ژورنال محلی = **همان** جداول Core | «ژورنال موقت» جدا که بعداً migrate شود |
| ارتقای لایسنس = روشن شدن UI/capability | کپی/انتقال ردیف‌ها بین دو journal |
| کاربر debit/credit نمی‌بیند | Feature-owned cash balance به‌عنوان SoT |

### چرا migration ژورنال موقت ممنوع است

1. دو SoT موقت/نهایی → ریسک double-count و از دست رفتن فیلد.
2. `operationId` / `commandHash` / reversal باید از روز اول پایدار بمانند.
3. No-Field-Loss یعنی از **اولین** تراکنش Standalone، تاریخچه حسابداری کامل است.

### Acceptance (License edition)

| سناریو | انتظار |
|--------|--------|
| Loan-only: ایجاد وام + پرداخت قسط بدون صفحه Accounts | journal lines موجود و متوازن |
| Export/Backup | شامل domain + journal |
| فعال‌سازی Full Accounting UI | **بدون** migration داده؛ فقط query/UI جدید روی همان DB |
| غیرفعال کردن UI حسابداری | داده پاک **نمی‌شود** |


---

## Requirements Lock (MR-251 … MR-257) — 100% complete 2026-09-05

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| MR-251 | Loan-only | ✅ LOCKED | Loan package + Core engines usable without other feature UI |
| MR-252 | Fund-only | ✅ LOCKED | FIF package standalone |
| MR-253 | Crypto-only | ✅ LOCKED | Crypto package standalone |
| MR-254 | Stocks-only | ✅ LOCKED | Stocks-Iran package standalone |
| MR-255 | Metals-only | ✅ LOCKED | Metals package standalone |
| MR-256 | Accounting-only | ✅ LOCKED | Documented as possible future edition; Core journal + accounts + reports can run without investment packages |
| MR-257 | Feature UI independence ≠ remove Accounting Core | ✅ LOCKED | Every financial write still goes through Canonical Financial Operation + journal; UI may hide Core but Core remains |

Standalone editions share the same offline SQLite + Core accounting plane. No second ledger is allowed.
