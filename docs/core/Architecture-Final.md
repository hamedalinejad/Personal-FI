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
