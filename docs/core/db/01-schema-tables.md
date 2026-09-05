# 01 schema tables

## لیست مرکزی همه‌ی جدول‌ها

> **تعداد tableها بد نیست.** مشکل = دو SoT برای یک مفهوم. مالکیت: `Canonical-Ownership-Matrix.md`.

| جدول | فیچر | توضیح |
|------|------|------|
| `acc_accounts` | Accounts & Banking | حساب‌های بانکی |
| `acc_transactions` | Accounts & Banking | **Bank/account event log + projection** (linked by operationId). **Cash balance SoT = journal lines, not this table.** |
| `fin_accounts` | Core Accounting | **Chart of accounts** — حساب واقعی (بانک ملت، هزینه خوراک، …) — **Must** |
| `db_meta` / schema_version store | Infrastructure | persistence state, schemaVersion, databaseId — **Must** |
| `fin_operations` | Core Accounting | عملیات کاربر (BUY/PAY/TRANSFER/…) — operationId, commandHash, status — **Must** |
| `fin_journal_entries` | Core Accounting | **سند حسابداری** (header) — معمولاً ۱ به ازای هر operation — **Must** |
| `fin_journal_lines` | Core Accounting | **خطوط بدهکار/بستانکار** با accountId اجباری — **Must** |
| `fin_reconcile_runs` | Core Accounting | خروجی اجرای reconcile — **Must** برای audit |
| `ref_instruments` | Core | **تنها** registry هویت همه assetها — **Must** (نه inv_crypto_assets موازی) |
| `inv_crypto_cash` | Crypto | CashPosition صرافی/ولت (جدا از asset holding) — **Must وقتی crypto cash داریم** |
| `ref_parties` | Core | طرف حساب / اشخاص (نه CRM) — **Must برای MVP وقتی Loan/Income شخص دارد** |
| `ln_schedule_snapshots` | Debt & Loan | برنامه اقساط نسخه‌دار — **Must** |
| `ln_loan_collateral` | Debt & Loan | وثیقه وام — **Must** |
| `inv_stocks_iran_instruments` | Investment Stocks Iran | ISIN, lotSize, priceTick, firmCode |
| `inv_stocks_iran_corporate_actions` | Investment Stocks Iran | **Must از مدل v1** (حتی اگر UI بعداً) — metadata/audit CA: split, reverse, bonus, capital_increase, rights, dividend cash leg ref, symbol/ISIN change, merger, spin-off, delisting |
| `tax_events` | Tax Management | رویداد مالیاتی مرکزی (linkedTaxEventId) |
| `inc_transactions` | Income | تراکنش‌های درآمد |
| `inc_recurring` | Income | درآمدهای تکرارشونده |
| `exp_transactions` | Expense | تراکنش‌های هزینه |
| `exp_recurring` | Expense | هزینه‌های تکرارشونده |
| `chk_cheques` | Cheque Management | چک‌ها |
| `ln_loans` | Debt & Loan | وام‌ها |
| `ln_loan_fees` | Debt & Loan | کارمزدهای وام (صدور، پیش‌پرداخت، ماهانه، پلکانی و ...) |
| `ln_loan_fee_tiers` | Debt & Loan | ردیف‌های پلکانی کارمزد وام (جایگزین فیلد قدیمی `tiers` در `ln_loan_fees`) |
| `ln_transactions` | Debt & Loan | تراکنش‌های وام |
| `ln_rate_history` | Debt & Loan | تاریخچه نرخ سود وام‌های Variable |
| `inv_crypto_exchanges` | Investment Crypto | صرافی‌ها و والت‌ها |
| `inv_crypto_wallet_networks` | Investment Crypto | شبکه‌های بلاکچین هر والت |
| `inv_crypto_wallet_addresses` | Investment Crypto | چند آدرس/derivation per شبکه |
| `inv_crypto_holdings` | Investment Crypto | دارایی‌های رمزارز |
| `inv_crypto_transactions` | Investment Crypto | تراکنش‌های رمزارز |
| `inv_crypto_exchange_transactions` | Investment Crypto | تراکنش‌های نقدی صرافی |
| `inv_stocks_iran_brokerages` | Investment Stocks Iran | کارگزاری‌ها |
| `inv_stocks_iran_holdings` | Investment Stocks Iran | دارایی‌های سهام |
| `inv_stocks_iran_transactions` | Investment Stocks Iran | تراکنش‌های سهام |
| `inv_stocks_iran_brokerage_transactions` | Investment Stocks Iran | تراکنش‌های نقدی کارگزاری |
| `inv_fif_funds` | Investment Fixed Income Funds | صندوق‌های درآمد ثابت |
| `inv_fif_holdings` | Investment Fixed Income Funds | دارایی‌های صندوق |
| `inv_fif_transactions` | Investment Fixed Income Funds | تراکنش‌های صندوق |
| `inv_metals_platforms` | Investment Metals | پلتفرم‌های فلزات |
| `inv_metals_holdings` | Investment Metals | دارایی‌های فلزات |
| `inv_metals_transactions` | Investment Metals | تراکنش‌های فلزات |
| `inv_metals_platform_transactions` | Investment Metals | تراکنش‌های نقدی پلتفرم |
| `inv_metals_physical_deliveries` | Investment Metals | تحویل فیزیکی فلزات |
| `pa_assets` | Physical Assets | دارایی‌های فیزیکی |
| `pa_valuations` | Physical Assets | ارزش‌گذاری‌های دارایی |
| `pa_transactions` | Physical Assets | تراکنش‌های دارایی |
| `bg_budgets` | Budget Management | بودجه‌ها |
| `bg_envelopes` | Budget Management | پاکت‌های بودجه |
| `bg_transaction_links` | Budget Management | لینک هزینه به پاکت |
| `bg_transfers` | Budget Management | انتقال بین پاکت‌ها |
| `fg_goals` | Financial Goals | اهداف مالی |
| `fg_contributions` | Financial Goals | کمک‌های اهداف |
| `br_items` | Bills & Recurring | آیتم‌های تکرارشونده |
| `br_occurrences` | Bills & Recurring | رخدادهای تکرارشونده |
| `notif_notifications` | Notification & Reminder | اعلان‌ها |
| `notif_settings` | Notification & Reminder | تنظیمات اعلان |
| `notif_custom_reminders` | Notification & Reminder | یادآوری‌های سفارشی |
| `rep_presets` | Reports & Analytics | پیش‌تنظیم گزارش |
| `rep_net_worth_snapshots` | Reports & Analytics | نمونه‌گیری Net Worth |
| `port_snapshots` | Portfolio & Wealth Overview | نمونه‌گیری پرتفوی |
| `port_settings` | Portfolio & Wealth Overview | تنظیمات پرتفوی |
| `dash_layouts` | Dashboard | چیدمان داشبورد |
| `dash_widget_configs` | Dashboard | تنظیمات ویجت‌ها |
| `tax_records` | Tax Management | رکوردهای مالیاتی |
| `tax_categories` | Tax Management | دسته‌بندی‌های مالیاتی |
| `docs_documents` | Document Management | اسناد |
| `docs_links` | Document Management | پیوندهای اسناد |
| `stg_settings` | Settings & Tools | تنظیمات برنامه |
| `stg_backup_logs` | Settings & Tools | لاگ‌های پشتیبان‌گیری |
| `cur_currencies` | Currency & Multi-Currency | ارزها |
| `cur_exchange_rates` | Currency & Multi-Currency | نرخ‌های تبدیل |
| `cur_currency_preferences` | Currency & Multi-Currency | تنظیمات ارز کاربر |
| `cat_categories` | Common Categories | دسته‌بندی‌های مشترک |
| `sec_settings` | Security & Privacy | تنظیمات امنیتی |
| `sec_session_logs` | Security & Privacy | لاگ‌های نشست (Should Have) |
| `price_sources` | Price Fetching | منابع/Providerهای قیمت |
| `price_history` | Price Fetching | تاریخچه قیمت دارایی‌ها (Append-Only؛ دستی یا از API) |
| `price_sync_settings` | Price Fetching | تنظیمات به‌روزرسانی خودکار (Auto-Sync) |
| `acc_transaction_links` | Accounts & Banking (مشترک) | لینک صریح polymorphic — **Must Have**؛ UNIQUE(transactionId, relatedFeature, relatedId) |
| `fin_audit_log` | Core (مشترک همه فیچرها) | ردپای عملیاتی void/reversal/repair/import/restore — **Must Have** |
| `ref_integrity_queue` | Core (مشترک همه فیچرها) | صف detect→quarantine→reconcile→repair — **Must Have** |

## فراهم کردن دسترسی یکپارچه به داده‌ها

این فایل (`db.md`) نقش **فهرست مرکزی همه‌ی جدول‌ها** را دارد:
- همه جداول تمام فیچرها در اینجا لیست شده‌اند
- هر جدول با نام یکپارچه و پیشوند معین آمده
- برای جزئیات فیلدها، به فایل فیچر مربوطه مراجعه شود

---

## نمونه مفهومی Schema (ساده)

```typescript
// db/models.ts
export interface AccAccount {
 id: string;
 name: string;
 accountNumber: string;
 iban: string;
 currency: string;
 currentBalance: string /* DecimalString */; // استفاده از decimal.js
 isArchived: boolean;
}

export interface AccTransaction {
 id: string;
 date: string;
 type: string;
 amount: string /* DecimalString */; // استفاده از decimal.js — صفاف و دقیق
 feeAmount?: string /* DecimalString */;
 feeCurrency?: string;
 exchangeRateToBase?: string /* DecimalString */; // نرخ تبدیل نسبت به baseCurrency تنظیم‌شده در cur_currency_preferences (مثال: اگر baseCurrency=IRR باشد، ریال به ازای ۱ واحد ارز تراکنش)
 balanceAfterTransaction: string /* DecimalString */; // derived snapshot only — ledger authoritative
 accountId: string;
 isVoided: boolean;
}

// --- نمونه مفهومی صندوق درآمد ثابت (تمایز NAV و قیمت معامله — ) ---
export interface InvFifHolding {
 id: string;
 fundId: string;
 brokerageId?: string;
 units: string /* DecimalString */;
 averageBuyPrice: string /* DecimalString */; // میانگین قیمت خرید/صدور (بر اساس transactionPrice)
 totalInvested: string /* DecimalString */;
 totalFeesPaidBase: string /* DecimalString */;
 currentNAV: string /* DecimalString */; // فقط NAV — برای Unrealized P&L و ارزش پرتفوی
 lastSubscriptionPrice?: string /* DecimalString */;
 lastRedemptionPrice?: string /* DecimalString */;
}

export interface InvFifTransaction {
 id: string;
 fundId: string;
 brokerageId?: string;
 type: 'buy' | 'sell' | 'dividend' | 'reinvest' | 'nav_update';
 units?: string /* DecimalString */;
 nav?: string /* DecimalString */; // NAV در تاریخ تراکنش
 transactionPrice?: string /* DecimalString */; // قیمت واقعی معامله (صدور در buy، ابطال در sell)
 amount?: string /* DecimalString */;
 feeAmount?: string /* DecimalString */;
 feeCurrency?: string;
 exchangeRateToBase?: string /* DecimalString */;
 predictedProfit?: string /* DecimalString */;
 actualProfit?: string /* DecimalString */;
 accountId?: string;
 accountTransactionId?: string;
 description?: string;
 date: string;
}
```

> **تمایز حیاتی در FIF**: `nav` / `currentNAV` هرگز با `transactionPrice` یکی فرض نمی‌شوند. جزئیات کامل و قوانین پر کردن در `Fixed-Income-Funds.md`.

```typescript
// --- نمونه مفهومی فلزات (تمایز واحد / عیار / وزن خالص — ) ---
export interface InvMetalsHolding {
 id: string;
 platformId: string;
 metalType: 'gold' | 'silver' | 'copper' | 'gold_coin';
 purity: string; // کد استاندارد: 18k, 24k, 999, emami, ...
 purityRatio: string /* DecimalString */; // 0..1 — fineWeightMg = quantityMg × purityRatio
 quantityMg: string /* DecimalString */; // وزن ناخالص به میلی‌گرم (هرگز گرم/اونس)
 averageBuyPricePerMg: string /* DecimalString */; // میانگین همان purity (نه طلای خالص)
 totalInvested: string /* DecimalString */;
 totalFeesPaidBase: string /* DecimalString */;
}

export interface InvMetalsTransaction {
 id: string;
 platformId: string;
 metalType: 'gold' | 'silver' | 'copper' | 'gold_coin';
 purity: string; // اجباری
 purityRatio: string /* DecimalString */; // snapshot
 type: 'buy' | 'sell' | 'physical_delivery';
 quantityMg: string /* DecimalString */; // وزن ناخالص
 pricePerMg: string /* DecimalString */; // قیمت همان purity
 totalAmount?: string /* DecimalString */;
 feeAmount?: string /* DecimalString */;
 feeCurrency?: string;
 exchangeRateToBase?: string /* DecimalString */;
 deliveryFee?: string /* DecimalString */;
 date: string;
}
```

> **تمایز حیاتی در Metals**: `quantityMg` = وزن ناخالص؛ وزن خالص (`fineWeightMg`) محاسبه می‌شود و ذخیره نمی‌شود؛ `purity` و `purityRatio` مستقل‌اند. `1g Gold 18K ≠ 1g pure gold`. جزئیات کامل در `Metals.md`.

## P0-FINAL-017 — Persist/API money types

All persisted and public API financial fields are **decimal strings**:

```text
amount: string
quantity: string
rate: string
price: string
```

`Decimal` (decimal.js) is **only** inside domain engines after parse at boundary. TypeScript examples in this file that still show objects are non-authoritative — use string.

## P0-FIX-002 — acc_transactions terminology

```text
acc_transactions = operational event log / UX projection
cash balance     = fin_accounts + fin_journal_lines ONLY
```

**Forbidden for one pocket:** `SUM(acc_transactions) + SUM(journal)`.

Use one: journal (authoritative) or a single projection rebuilt from journal — never both summed.

## BUG-D03 — `ref_instruments` و شبکه (ERC20/TRC20/…)

**مشکل:** دو USDT روی دو شبکه نباید یک instrument شوند.

**Fix (هم‌راستا با Instrument-Identity — نه PK بر اساس symbol):**

```text
ref_instruments.id              = UUID  (ONLY primary key / canonical identity)
ref_instruments.symbol          = LABEL (mutable display; not unique alone)
ref_instruments.network_identifier  NULLABLE TEXT
  // e.g. "TRC20" | "ERC20" | "BEP20" | chainId string | null for non-chain assets
ref_instruments.assetClass      = crypto | stock | fund | metal | …

// Optional uniqueness for on-chain fungible tokens:
UNIQUE(network_identifier, contract_address) WHERE contract_address IS NOT NULL
// یا برای native: UNIQUE(network_identifier, symbol) WHERE contract_address IS NULL AND assetClass=crypto

inv_crypto_instrument_meta (if used): chainId, contractAddress, decimals — FK instrumentId
```

**ممنوع (رد اتاق فکر):** Primary Key = `(symbol, network)` — symbol ناپایدار است و با ISIN/سهام تداخل دارد.

## R-001

Target physical schema: `docs/core/db/schema.sql` (expand until every table in this list is represented). OPEN-001 closes when drift = 0.

## P0-DOC-002 — acc_transactions

```text
acc_transactions = bank operational event log + UX projection (operationId link)
Cash balance SoT = fin_journal_lines only

FORBIDDEN: SUM(acc_transactions) + SUM(journal) for the same economic cash movement
FORBIDDEN: describing acc_transactions as «دفتر کل نقد» / cash ledger of record
```

---

## Naming freeze (2026-09-05)

| Concept | Canonical prefix in schema.sql |
|---------|--------------------------------|
| Notifications | `not_` |
| Reports | `rpt_` |
| Budget links | `bg_transaction_links` (no `bg_transfers` table) |
| Settings | `stg_` |
| Documents | `docs_` |
| Security | `sec_` |
| Portfolio UI | `port_` |
| Dashboard UI | `dash_` |

Docs that still say `notif_` / `rep_` are legacy aliases; implementation must use the canonical prefixes above.

Cash projection tables (`inv_*_exchange/brokerage/platform_transactions`, `bg_transfers`) are **intentionally not created** — cash SoT is Core journal only.
