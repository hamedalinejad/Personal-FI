# Field-Level Data Ownership Matrix

**وضعیت:** اجباری برای هر برنامه‌نویس آینده. حدس زدن مالک فیلد ممنوع است.

این سند مکمل `Source-of-Truth-Matrix.md` و `Field-Level-SoT.md` است و مالکیت را در **سطح فیلد** قفل می‌کند.

## قرارداد ستون‌ها

| ستون | معنی |
|------|------|
| Field | نام فیلد (جدول.فیلد یا مفهوم منطقی) |
| Kind | `RAW` \| `DERIVED` \| `SNAPSHOT` \| `EXTERNAL_REPORTED` \| `LABEL` |
| Owner | Feature / Engine که حق write دارد |
| Editable | آیا کاربر/API می‌تواند مستقیم ویرایش کند؟ |
| Source | منبع ورود داده |
| Derived From | اگر DERIVED/SNAPSHOT از چه چیزی rebuild می‌شود |
| Migration | `Preserve` (نگه دار) \| `Rebuild` (از ledger دوباره بساز) \| `Map` |

**قوانین کلی**
1. فقط فیلد `RAW` می‌تواند توسط ورودی کاربر در عملیات atomic نوشته شود (به‌جز mappingهای سیستم).
2. `DERIVED` و `SNAPSHOT` هرگز SoT نیستند؛ بعد از هر mutation مرتبط باید از منبع RAW rebuild شوند.
3. `LABEL` (مثل symbol نمایشی) هویت نیست.
4. هویت Canonical همه دارایی‌ها فقط `ref_instruments.id` است — ببین `Instrument-Identity.md`.

---

## ۱) هویت و کاتالوگ دارایی

| Field | Kind | Owner | Editable | Source | Derived From | Migration |
|-------|------|-------|----------|--------|--------------|-----------|
| `ref_instruments.id` | RAW | Core / Instrument Registry | No (immutable) | System on create | — | Preserve |
| `ref_instruments.assetCategory` | RAW | Core | No after create | User/System | — | Preserve |
| `ref_instruments.displaySymbol` | LABEL | Core | Yes | User | — | Preserve |
| `ref_instruments.name` | LABEL | Core | Yes | User | — | Preserve |
| `ref_instruments.externalRef.assetKey` | LABEL / INDEX | Core | No (system-derived) | System from chain+contract | chainId + contract/native | Preserve + rebuild index |
| `inv_crypto_instrument_meta.instrumentId` | RAW (FK) | Crypto meta | No | System | — | Preserve |
| `inv_crypto_instrument_meta.chainId` | RAW | Crypto meta | No after create | User/Provider | — | Preserve |
| `inv_crypto_instrument_meta.contractAddress` | RAW | Crypto meta | No after create | User/Provider | — | Preserve |
| `inv_crypto_instrument_meta.decimals` | RAW | Crypto meta | Limited | User/Provider | — | Preserve |
| `inv_*_holdings.instrumentId` | RAW (FK) | Domain Holding | No (set on create) | System resolve | ref_instruments | Preserve |
| `inv_*_transactions.instrumentId` | RAW (FK) | Domain Ledger | No | System resolve | ref_instruments | Preserve |
| `symbol` روی holding/tx | LABEL | Domain | Yes (display) | User | — | Preserve |
| `assetKey` روی holding/tx | LABEL / INDEX | Domain | No | System | instrument + meta | Map از instrumentId |
| `contractAddress` / `networkId` روی holding | RAW context | Domain | No after create | User | — | Preserve (location context) |
| `price_history.instrumentId` | RAW (FK) | Price Engine | No | System | — | Preserve |
| `providerSymbol` / `providerInstrumentId` | EXTERNAL mapping | Adapter | Yes (mapping) | Provider | — | Preserve |

**Invariant هویت**
```text
Canonical identity = ref_instruments.id
assetKey / symbol / ISIN / ticker / contractAddress = attributes or convenience keys
هرگز دو registry موازی (مثلاً inv_crypto_assets به‌عنوان SoT هویت)
```

USDT روی شبکه‌های مختلف = **چند instrument جدا** (هر کدام یک `ref_instruments.id`):
- USDT / Ethereum (chain + contract)
- USDT / Tron
- USDT / BSC

---

## ۲) موجودی و Quantity

| Field | Kind | Owner | Editable | Source | Derived From | Migration |
|-------|------|-------|----------|--------|--------------|-----------|
| `inv_crypto_transactions.quantity` (و gross/net) | RAW | Crypto Ledger | No (void+reverse) | User tx | — | Preserve |
| `inv_crypto_transactions.feeAmount` | RAW | Crypto Ledger | No | User | — | Preserve |
| `inv_crypto_transactions.feeCurrency` / fee asset instrument | RAW | Crypto Ledger | No | User | — | Preserve |
| `inv_crypto_holdings.quantity` | DERIVED | Holding Engine | No | — | sum(net effects of txs) | Rebuild |
| `inv_stocks_iran_transactions.quantity` | RAW | Stocks Ledger | No | User | — | Preserve |
| `inv_stocks_iran_holdings.quantity` | DERIVED | Holding Engine | No | — | txs | Rebuild |
| `inv_fif_transactions.units` | RAW | FIF Ledger | No | User | — | Preserve |
| `inv_fif_holdings.units` | DERIVED | Holding Engine | No | — | txs | Rebuild |
| `inv_metals_transactions.quantity` | RAW | Metals Ledger | No | User | — | Preserve |
| `inv_metals_holdings.quantity` | DERIVED | Holding Engine | No | — | txs | Rebuild |
| `acc_transactions.amount` | RAW | Banking Ledger | No | User | — | Preserve |
| bank / exchange / broker `currentBalance` | SNAPSHOT | Accounting cache | No | — | **fin_journal_lines** همان fin_accounts | Rebuild |
| `inv_crypto_cash.balance` | SNAPSHOT (اختیاری) | Projection only | No | — | **همان finAccountId journal** | Rebuild یا حذف ستون |
| `fin_journal_lines.debit/credit` (نقد) | RAW | Accounting Core | No | Atomic op | — | Preserve |
| `ln_transactions.*` amounts | RAW | Loan Ledger | No | User | — | Preserve |
| loan `remainingBalance` | DERIVED | Loan Engine | No | — | ln_transactions | Rebuild |

---

## ۳) هزینه، کارمزد، P&L

| Field | Kind | Owner | Editable | Source | Derived From | Migration |
|-------|------|-------|----------|--------|--------------|-----------|
| `feeAmount` / `feeCurrency` روی tx | RAW | Domain tx | No | User | — | Preserve |
| `feeAssetPriceToBase` | RAW | Domain tx | No | User/Provider at post | — | Preserve |
| `exchangeRateToBase` | RAW | Domain tx | No | User/Provider at post | — | Preserve |
| `totalFeesPaidBase` روی holding | DERIVED | Holding Engine | No | — | txs feeBase | Rebuild |
| `averageBuyPrice` / `averageCostBase` | DERIVED | CostBasisEngine | No | — | txs converted to costCurrency | Rebuild |
| `totalCostBase` / `totalInvested` | DERIVED | CostBasisEngine | No | — | txs in base | Rebuild |
| `originalAmount` / `originalCurrency` / `quoteCurrency` / `exchangeRateToBase` | RAW | Domain tx | No | User/Provider at post | — | Preserve |
| `grossQuantity` / `netQuantity` / `feeQuantity` | RAW | Domain tx | No | User | — | Preserve |
| `totalInvested` | DERIVED | CostBasisEngine | No | — | txs | Rebuild |
| `realizedPL` | DERIVED | CostBasisEngine | No | — | sell lots + cost | Rebuild |
| `unrealizedPL` | DERIVED | Valuation + CostBasis | No | — | qty × price − book | Rebuild |
| fund `externalReportedProfit` | EXTERNAL_REPORTED | FIF Domain | Yes (import) | Statement | — | Preserve |
| `calculatedProfit` سیستم | DERIVED | Engine | No | — | internal rules | Rebuild |

**قانون:** `EXTERNAL_REPORTED` هرگز silent overwrite روی `calculatedProfit` نمی‌شود.

---

## ۴) قیمت و ارزش‌گذاری

| Field | Kind | Owner | Editable | Source | Derived From | Migration |
|-------|------|-------|----------|--------|--------------|-----------|
| `price_history.price` | RAW | Price Engine | No (append) | Provider/manual | — | Preserve |
| `price_history.instrumentId` | RAW (FK) | Price Engine | No | System | — | Preserve |
| holding `currentPrice` | DERIVED | Valuation Engine | No | — | latest price_history | Rebuild |
| `portfolioValue` / Net Worth | DERIVED | Portfolio Engine | No | — | holdings + prices + cash − liabilities | Rebuild |
| `port_*` snapshots | SNAPSHOT | Portfolio | No | — | engines | Rebuild |

---

## ۵) حسابداری (Journal)

| Field | Kind | Owner | Editable | Source | Derived From | Migration |
|-------|------|-------|----------|--------|--------------|-----------|
| `fin_journal_entries.*` | RAW | Accounting Core | No (void only) | Atomic op | — | Preserve |
| `fin_journal_lines.debit/credit` | RAW | Accounting Core | No | Atomic op | — | Preserve |
| `fin_accounts.balance` | DERIVED/SNAPSHOT | Accounting | No | — | journal lines | Rebuild |
| Trial Balance | DERIVED | Reporting | No | — | fin_journal_lines | Rebuild |

Domain ledger برای qty/موجودی تخصصی؛ Journal برای گزارش حساب‌به‌حساب و میان‌فیچری. هر دو باید reconcile شوند؛ drift = باگ یکپارچگی.

---

## ۶) وام

| Field | Kind | Owner | Editable | Source | Derived From | Migration |
|-------|------|-------|----------|--------|--------------|-----------|
| `ln_loans` terms (principal, rate, dayCount, graceMode, schedule rules) | RAW | Loan Domain | Limited | User | — | Preserve |
| `dayCountConvention` / grace dates/periods | RAW | Loan Domain | Limited | User | — | Preserve |
| schedule rows in `ln_schedule_snapshots` | DERIVED | **Schedule Engine** | No | — | terms + events | Rebuild |
| `ln_transactions` (disburse, payment, fee, interest) | RAW | Loan Ledger | No | User | — | Preserve |
| `remainingBalance` / portions | DERIVED | Loan Engine | No | — | ln_transactions | Rebuild |
| schedule snapshot | SNAPSHOT | Loan Engine | No | — | terms + payments | Rebuild |

---

## ۷) قوانین برنامه‌نویس (اجباری)

1. قبل از اضافه کردن فیلد مالی جدید، یک ردیف به این ماتریس اضافه کن.
2. اگر Kind = DERIVED یا SNAPSHOT است، API ویرایش مستقیم ننویس.
3. برای کریپتو/سهام/صندوق/فلز: FK اجباری `instrumentId`؛ `assetKey` فقط index/label مشتق.
4. `symbol` تنها برای UI و جستجو؛ uniqueness و rebuild با `instrumentId` (+ location: exchangeId/networkId).
5. Migration: RAW → Preserve؛ DERIVED/SNAPSHOT → Rebuild از ledger.

---

## ارتباط اسناد

| سند | نقش |
|-----|-----|
| `Source-of-Truth-Matrix.md` | Entity / concept level |
| `Field-Level-SoT.md` | خلاصه نوع فیلد |
| **این فایل** | مالکیت فیلد به فیلد + editable + migration |
| `Instrument-Identity.md` | فقط `ref_instruments.id` |
| `Raw-vs-Derived-Data.md` | فلسفه RAW vs DERIVED |
| `Data-Preservation-Contract.md` | حفظ داده در migration |

---

## Standard row columns (P0) — هیچ فیلدی خاموش پاک نشود

برای جداول دامنه مالی (حداقل ledgerها)، الگوی ستونی:

| فیلد | نقش |
|------|-----|
| `id` | ULID/UUID |
| `createdAt` | |
| `updatedAt` | |
| `deletedAt` | soft delete |
| `archivedAt` | اختیاری |
| `importId` / `importBatchId` | lineage |
| `source` / `sourceType` | provenance |
| `note` | |
| `tagsJson` | اختیاری support |
| `metaJson` | گسترش آینده — **نه** license entitlement |

Hard DELETE فیزیکی فقط پس از archive policy + backup.  
`metaJson` جایگزین ستون‌های پولی typed نمی‌شود (`JSON-Policy.md`).
