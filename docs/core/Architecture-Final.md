# معماری نهایی (خلاصه قفل)

```text
                ┌──────────────────────┐
                │     Presentation     │
                └──────────┬───────────┘
                           │
                ┌──────────▼───────────┐
                │    Feature Public    │
                │        APIs          │
                └──────────┬───────────┘
                           │
        ┌──────────────────┼───────────────────┐
        │                  │                   │
        ▼                  ▼                   ▼
     Loan Core        Investment Core      Accounting UI
        │                  │
        └──────────┬───────┘
                   ▼
           Capability APIs
                   │
       ┌───────────┼────────────┐
       ▼           ▼            ▼
   Accounting    Pricing      Currency
   Settlement    CostBasis    Fee
       │           │            │
       └───────────┼────────────┘
                   ▼
                  DB
```

**UI (۹):** Dashboard · Accounts · Transactions · Investments · Loans · Assets · Planning · Reports · Settings

## لایه‌ها

- Feature API → Capability API → Domain → Persistence
- Persistence State Machine: CLEAN…RECOVERING (فقط Storage Layer)
- License خارج از Core مالی؛ Domain از License بی‌خبر
- acc_transactions = **فقط cash**
- Snapshot derived؛ Rebuild + Reconcile بدون silent repair
- Reports/Dashboard = consumer of Valuation، نه SQL خام
- UX: Simple by default؛ journal/operation از چشم کاربر پنهان

## اصل محصول

`Product-Principle.md` — Complexity in Domain, not UI.

## اولویت

`Implementation-Priority.md`

## اسناد کلیدی این بسته

- `Capability-API.md`
- `Persistence-State-Machine.md`
- `Import-Lineage.md`
- `Rebuild-API-Contract.md`
- `Product-Principle.md`

Gate docs: `P0-Risk-Register.md` · `P1-Risk-Register.md` · `Fiscal-Period-Lock.md`

---

## مدل سه‌لایه محصول

```text
Operational Data
        ↓
Module Sub-ledger
        ↓
Optional Main Accounting Integration
```

مستندات تکمیلی الزامات:

- `API-Requirements.md`
- `Offline-Requirements.md`
- `Essential-Reports.md`
- `Mandatory-Test-Vectors.md`
- `Documentation-Roadmap.md`

---

## Forbidden (از همین حالا)

- direct DB access from UI
- Feature-to-Feature table writes
- mutable financial history / overwrite posted
- balance as independent truth
- duplicate SoT
- FLOAT / JS number for money math
- hardcoded tax or FX rates
- snapshot-based historical reports as SoT
- auto-delete data on import
- license blocking financial data access
- feature activation requiring unrelated modules
- current price changing historical report
- generic polymorphic FK everywhere
- DB row = Domain entity

## v1 پیشنهادی (محدود)

Foundation + Accounting Core + Money/FX + Operation + Reversal + Audit + Reconciliation + Opening + Party + Document + Instrument + Migration + Backup + Offline  
+ Accounts + Income + Expense + Loans + Crypto + Dashboard + Reports + Settings  

v1.1 Stocks/Funds/Metals/Cheque · v1.2 Tax/Budget/Goals/Price · v2 advanced/cloud
