> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Personal-FI Product Principle (P0)

```text
The system may be internally sophisticated,
but every user-facing operation must remain simple,
direct, and understandable.

Complexity belongs to the Domain,
not to the User Interface.
```

**فارسی:** سیستم از داخل می‌تواند بسیار دقیق و حرفه‌ای باشد؛ کاربر نباید مجبور باشد پیچیدگی داخلی (journal, operation, cost pool, adapter, snapshot) را بفهمد.

## پیامدها

| لایه | قانون |
|------|--------|
| UI | فرم ساده؛ Advanced اختیاری |
| Domain | کامل، دقیق، multi-engine |
| Pages | حداکثر ۹؛ نه انفجار route |
| Feature flags | Navigation Visibility جدا از پیچیدگی داخلی |

### مثال Crypto

کاربر می‌بیند: صرافی، رمزارز، مقدار، قیمت، کارمزد، منبع پرداخت، تاریخ، یادداشت.  
سیستم می‌سازد: Operation · Domain event · Cash settlement · Journal · Cost basis · Audit · Snapshot.

### مثال Loan

فرم پایه: نوع، طرف، مبلغ، نرخ، روش، اقساط، تاریخ‌ها، کارمزد، حساب.  
Advanced: Day Count، Allocation، Early Payment، Variable Rate، Fee Policies.

---

## Iran accounting preservation (LOCKED 2026-09-08)

**Rule:** Accounting Core is the heart. Investment domains are specialized ledgers **on top of** the same Core (journal + cash SoT). User sees simple flows; system stays double-entry and reconcilable.

| Domain | Fields that must never be dropped | Critical rule |
|--------|-----------------------------------|---------------|
| Money | amount, currency, base amount, historical FX, fxAsOf, precision/scale | No JS Number for money — decimal string |
| Transaction | gross/net/fee, fee role, operationId, commandHash, source, document | raw immutable; derived rebuildable |
| Crypto | instrumentId, exchange, network, wallet/address, fee mode, acquisition basis | identity ≠ symbol |
| Stocks Iran | ISIN, broker, market/trade/settlement dates, T+2, fees, CA provenance | CA engine sole mutation owner |
| Funds | fund instrumentId, NAV, transactionPrice, subscription/redemption, reinvest | NAV ≠ tx price |
| Loans | principal, rate, rate history, schedule version, components, fees, penalties, payment date | principal/interest/fee/penalty separate |
| Metals | metal type, purity, purityRatio, quantityMg, fineWeight, premium, delivery | unit + purity explicit |
| Cheque | Sayadi/IBAN normalized, issue/due/clear/bounce, counterparty | event history preserve |
| Documents | source document, import batch, checksum, lineage | backup retains evidence |
| Reports | valuationContext, priceAsOf, fxAsOf, engineVersions, calculationContextHash | rebuild determinism |

## UX — few pages, deep domains

**Feature = domain boundary · Page = UX boundary.**  
Primary nav **≤6** (or ≤9 mapped into ≤6 + More). Create/edit = **Sheets**, not new routes.

| Destination | Content |
|-------------|---------|
| Dashboard | Net Worth, Cash, Alerts, recent events |
| Accounts / Money | accounts, balances, transfer, reconcile |
| Transactions | all txs; Income/Expense/Transfer/Cheque/Adjustment as Sheets |
| Investments | one page, tabs: Crypto / Stocks / Funds / Metals |
| Loans | loans, schedule, payment, fees |
| Assets / Planning | Physical Assets + Budget + Goals |
| Reports / Wealth | accounting + investment + tax reports |
| Documents / Imports | documents, import, provenance |
| Settings / Tools | currency, price, backup, security, license |

Optional compression to **6 roots:** Dashboard · Money · Transactions · Invest+Loans · Reports · Settings (Assets/Docs under More or tabs).

See `ARCHITECTURE-LOCKED.md` § UX, `docs/00-Product/Pages-IA.md`.
