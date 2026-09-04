# Cross-Feature Interactions

مکانیسم ارتباط فیچرها، اعتبارسنجی، و cascade.

مرتبط: `Domain-Dependency-Matrix.md` · `db/05-constraints-polymorphic.md` · `acc_transaction_links`

---

## ۱. Matrix وابستگی (خلاصه)

| From \ needs | Accounts | Income/Exp | Cheque | Loan | Crypto | Stocks | FIF | Metals | Price | Currency | Tax | Docs |
|--------------|----------|------------|--------|------|--------|--------|-----|--------|-------|----------|-----|------|
| Income | cash write via Core | — | | | | | | | | read FX | | opt |
| Expense | cash via Core | | | | | | | | | FX | | opt |
| Cheque | cash via Core | | — | | | | | | | | | |
| Loan | cash via Core | | | — | | | | | | FX | | |
| Crypto | bank↔exchange cash | | | | — | | | | **query** | FX | tax evt | |
| Stocks | / brokerage cash | | | | | — | ETF cash shared | | **query** | | tax | |
| FIF | bank or brokerage | | | | | ETF path | — | | NAV query | | | |
| Metals | | | | | | | | — | query | | | |
| Price | | | | | **read by inv** | read | read | read | — | | | |
| Reports/Dash | **query only** all | | | | | | | | | | | |

- **writes** به جدول فیچر دیگر: **ممنوع**
- **reads** از public Query API یا Core: مجاز
- Price → Investment: فقط enrichment valuation؛ صحت tx وابسته نیست

---

## ۲. لینک Cash ↔ Domain

### Canonical

جدول **`acc_transaction_links`**:

```text
UNIQUE(accTransactionId, relatedFeature, relatedId)
```

| relatedFeature (مثال) | relatedId هدف |
|----------------------|---------------|
| `loan` | `ln_transactions.id` یا loan payment op |
| `crypto_exchange` | `inv_crypto_exchange_transactions.id` |
| `stocks_iran` | stock domain tx id |
| `fif` | fif tx id |
| `cheque` | cheque id |
| `income` / `expense` | domain tx id |

`acc_transactions.relatedFeature` + `relatedId` = denormalized cache؛ **SoT رابطه = links**. هر دو باید هم‌نویس شوند.

### Validation قبل از COMMIT (اجباری)

```text
1. relatedFeature ∈ enum بسته (types)
2. SELECT وجود relatedId در جدول map[relatedFeature]
3. اگر وجود ندارد → abort transaction (نه orphan)
4. INSERT/UPSERT acc_transaction_links
```

SQLite **نمی‌تواند** polymorphic FK واقعی بزند → Domain validation + reconcile orphan.

### FK واقعی (ترجیح برای روابط حساس)

| رابطه | استراتژی |
|--------|-----------|
| journal line → fin_accounts | FK واقعی |
| holding → ref_instruments | FK واقعی |
| loan → partyId | FK واقعی |
| stock tx → instrumentId | FK واقعی |
| bank tx ↔ multi domain | links + validate |

---

## ۳. Cascade / حذف

**قانون مالی:** DELETE سخت parent که child مالی دارد ≈ **ممنوع**.

| سناریو | رفتار |
|--------|--------|
| حذف/بایگانی وام | RESTRICT اگر payment/ledger دارد؛ یا archive؛ **هرگز** cascade delete روی `acc_transactions` / journal |
| void وام | reverseOperation — childها void/reverse می‌شوند نه DELETE |
| حذف instrument | RESTRICT اگر holding/tx دارد |
| حذف حساب بانکی | RESTRICT اگر tx دارد |
| Price source حذف | قیمت‌های history حفظ؛ source nullable یا soft |

```text
ON DELETE برای FKهای مالی: تقریباً همیشه RESTRICT
CASCADE فقط برای داده کاملاً وابسته غیرمالی (مثلاً tag rows)
```

---

## ۴. Investment ↔ Price-Fetching

```text
Price API (query): getLatestPrice({ instrumentId, quoteCurrency, asOf? })
Investment valuation: holding × lastKnownPrice — offline OK
Buy/Sell: قیمت در خود transaction RAW ذخیره می‌شود — منتظر API نیست
```

وابستگی: Investment **می‌خواند** Price؛ Price **نمی‌نویسد** در investment tables.

---

## ۵. Validation Hooks (خلاصه pipeline)

```text
runAtomicFinancialOperation
  → validate domain
  → validate all relatedId targets exist
  → write domain + cash + journal + links
  → COMMIT
  → persist
```

Reconcile دوره‌ای: orphan links → integrity queue.

## Write path (historical batch-5 §8; see host LOCK)

Cross-feature state changes go through operation + port/adapter only. Direct cross-feature repository calls are forbidden.

