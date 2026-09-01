# Feature Audit — 2026-09-01

Scope: `docs/features/*`
Status: documentation audit; implementation has not started.

## Executive result

ساختار Featureها از نظر modularization مناسب است، اما چند قرارداد در متن‌ها هنوز با Core یا بخش‌های دیگر Featureها متناقض است. این موارد باید قبل از implementation قفل شوند.

## P0 findings

### FEAT-P0-001 — Standalone dependency leakage
برخی Feature specs در توضیح عمومی standalone هستند ولی در مدل بعضی entityها FK/account linkage را required معرفی می‌کنند. Canonical rule: cash linkage باید nullable/adapter-based باشد و correctness Feature به Accounts وابسته نباشد.

### FEAT-P0-002 — Snapshot vs ledger ambiguity
در چند Feature، holding/balance fields به‌عنوان cache معرفی شده‌اند اما بعضی APIها هنوز update مستقیم snapshot را به‌صورت primary flow نشان می‌دهند. Canonical rule: ledger/domain events SoT و snapshot projection است؛ mutation باید ledger + journal + settlement را اتمیک ثبت کند و سپس projection را rebuild/update کند.

### FEAT-P0-003 — Identity drift in Crypto
Crypto document در بخش‌های مختلف هم `instrumentId` و هم `assetKey` را به‌عنوان identity canonical معرفی می‌کند و حتی API rebuild را گاهی با symbol/assetKey نمونه می‌زند. Canonical contract: `ref_instruments.id` = identity؛ `assetKey` = convenience/mapping؛ `symbol` = label. APIهای جدید باید instrumentId/holdingId را بگیرند و mapping provider از Core انجام شود.

### FEAT-P0-004 — Crypto cash/asset mixing
Crypto spec در بخش‌هایی `IRR/USDT` را داخل `inv_crypto_holdings` نگه می‌دارد و در بخش‌های جدید `inv_crypto_cash` را SoT معرفی می‌کند. این دو مدل نباید هم‌زمان SoT باشند. Canonical: exchange/wallet cash = `inv_crypto_cash`; token/investment position = holdings. اگر legacy symbol holdings وجود دارد فقط migration/compatibility است.

### FEAT-P0-005 — Fee quantity contradiction
Crypto spec نمونه‌هایی دارد که BUY با fee از asset را گاهی quantity=1 و گاهی netQuantity=0.999 می‌داند. Canonical rule: اگر fee از base/received asset کسر شود، gross/fee/net ذخیره و holding با net تغییر می‌کند؛ اگر fee از quote باشد، net=gross. این باید یک قرارداد واحد باشد.

### FEAT-P0-006 — Loan field contract drift
Loan spec از `ln_transactions.accountTransactionId` و `isVoided` در الگوریتم‌ها استفاده می‌کند ولی این فیلدها در تعریف اولیه entity کامل و یکنواخت نیستند. همچنین `accountId`/`accountTransactionId` در entity به‌صورت required آمده‌اند ولی پایین‌تر standalone آن‌ها را nullable می‌کند. Canonical schema باید این را صریح کند: disbursement header link optional; each cash-bearing loan event links through its own transaction/operation.

### FEAT-P0-007 — Loan fee treatment enum drift
در `ln_loan_fees` دو enum مختلف دیده می‌شود: `reduction_of_carrying_amount` در یک بخش و `reduction_of_liability` در بخش دیگر. فقط یک canonical enum مجاز است؛ carrying amount/accounting classification نباید با contractual principal reduction یکی فرض شود.

### FEAT-P0-008 — Loan schedule snapshot incompleteness
در invariant تاریخی، `effectiveDate` و version metadata برای snapshot لازم دانسته شده، اما جدول snapshot کامل و یکنواخت این metadata را ندارد. Snapshot باید حداقل `generatedAt`, `effectiveFrom`, `reason`, `operationId`, `calculationVersion`, `roundingVersion`, `rateVersion`, `inputHash` و payload کامل schedule را نگه دارد.

## P1 findings

### FEAT-P1-001 — Schedule vs payment event
Loan explicitly distinguishes schedule and payment event، ولی بعضی APIهای overdue هنوز schedule را مستقیم به transaction comparison نزدیک می‌کنند. وضعیت هر installment باید از allocation/payment events derived شود؛ schedule row به‌تنهایی پرداخت نیست.

### FEAT-P1-002 — Partial payment
برای Loan باید partial payment first-class باشد: allocation به penalty/fee/interest/principal و مانده هر component حفظ شود. یک `paid/unpaid` ساده کافی نیست.

### FEAT-P1-003 — External vs internal transfer
Crypto برای internal transfer، external send/receive و bridge مدل‌های مختلف دارد، ولی باید در همه موارد `transferScope/economicKind` صریح باشد تا external outflow اشتباهاً transfer داخلی یا sell تلقی نشود.

### FEAT-P1-004 — Historical valuation provenance
Investment transactionها باید original quote amount، quote currency، FX rate و price reference را در لحظه transaction نگه دارند. Rebuild نباید از latest market price برای بازسازی transaction تاریخی استفاده کند.

### FEAT-P1-005 — Corporate action boundary
Stocks باید corporate actions را operation مستقل با اثر quantity/cost basis/journal و provenance نگه دارد؛ نباید با transaction buy/sell شبیه‌سازی شود مگر action contract صریحاً چنین کند.

### FEAT-P1-006 — Fixed-income fund distinction
صندوق درآمد ثابت باید NAV، transaction price، accrued/distributed income و liquidation value را از هم جدا نگه دارد. گزارش سود نباید صرفاً از price delta ساخته شود.

### FEAT-P1-007 — Metals unit normalization
فلزات ایران نیاز به تفکیک نوع دارایی/واحد، وزن، عیار، اجرت، مالیات/کارمزد و قیمت مرجع دارند. quantity خام بدون unit/quality provenance برای rebuild کافی نیست.

## P2 findings

### FEAT-P2-001 — Duplicate spec files
برخی زیرفیچرها علاوه بر سند اصلی `spec.md` کوتاه دارند. `spec.md` باید فقط pointer/index باشد و نباید contract مستقل تولید کند.

### FEAT-P2-002 — Naming normalization
در Featureها نام‌هایی مثل `tradeId`/`tradeGroupId`، `symbol`/`assetKey` و `accountId`/`settlementAccountId` در متن‌های مختلف دیده می‌شود. canonical naming باید در یک dictionary قفل و legacy aliases فقط در migration باقی بمانند.

### FEAT-P2-003 — API payload type consistency
بعضی API examples از `Decimal` object استفاده می‌کنند در حالی که public API contract باید DecimalString/ISO date و primitive serializable باشد.

## Feature inventory reviewed structurally

- 00 Accounts & Banking
- 01 Income
- 02 Expense
- 03 Cheque Management
- 04 Debt & Loan Management
- 05 Investment + Crypto / Stocks Iran / Fixed-Income Funds / Metals
- 06 Physical Assets
- 07 Budget Management
- 08 Financial Goals
- 09 Bills & Recurring Transactions
- 10 Notification & Reminder System
- 11 Reports & Analytics
- 12 Dashboard
- 13 Portfolio & Wealth Overview
- 14 Tax Management

## What was changed in this audit commit

1. `docs/features/FEATURE-CANONICAL-CONTRACT.md` added as the cross-feature boundary contract.
2. `docs/features/05-Investment/README.md` updated with canonical identity, operation, cash-independence, cost-basis, reversal, offline and UI rules.
3. The findings above are recorded before implementation so developers do not resolve contradictions independently.

## Important limitation

Because the repository is documentation-only, this audit can detect specification contradictions and missing contracts but cannot claim runtime/SQL/UI bugs. Runtime correctness requires implementation plus golden fixtures and reconciliation tests.

## Next mandatory pass

Before writing code, reconcile each Feature's field table against:

`Data-Dictionary → Relationship Matrix → Canonical Operation → Feature API → Feature schema → UI form fields`.

No field should be removed during reconciliation; deprecated fields must have explicit migration mapping.
