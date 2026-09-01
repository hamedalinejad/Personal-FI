# سه لایه هویت مالی (جداسازی اجباری)

| مفهوم | جدول / مدل | مثال | نقش |
|--------|------------|------|-----|
| **Financial Account** | `acc_accounts` (+ نقد کارگزاری/صرافی) | بانک ملت، کیف پول نقدی | محل نگهداری پول واقعی کاربر |
| **Accounting Account** | `fin_accounts` | هزینه خوراک، حقوق، opening equity | دفتر حسابداری؛ بدهکار/بستانکار journal |
| **Party** | `ref_parties` | علی، موجر، کارفرما | طرف حساب / شخص — نه حساب بانکی، نه دسته هزینه |

```text
پرداخت اجاره به موجر از بانک ملت:
  Financial:  acc_accounts «بانک ملت» ↓
  Accounting: Dr fin_accounts «هزینه اجاره»
              Cr fin_accounts «بانک ملت» (linked به acc)
  Party:      ref_parties «موجر» روی exp_transactions.partyId
```

**ممنوع:**
- ذخیره «علی» فقط در description بدون party وقتی طلب/بدهی است
- استفاده از `fin_accounts` به‌جای `acc_accounts` برای موجودی قابل‌برداشت بانکی
- مخلوط کردن party با bank account

پیوند: `fin_accounts.linkedEntityType/Id` می‌تواند به `acc_accounts` یا `ref_parties` اشاره کند.
جزئیات journal: `Accounting-Core.md` · parties: `Parties.md`

---

## Financial Account در Journal (یک مفهوم)

Feature می‌تواند مالکیت داده را جدا نگه دارد:

| مالک Feature | مثال |
|--------------|------|
| Accounts | بانک واقعی (`acc_accounts`) |
| Crypto | cash داخلی صرافی / holding |
| Stocks | صندوق نقد کارگزاری |
| FIF/Metals | در صورت نقد پلتفرم |

**Accounting Core** همه را از طریق `fin_accounts` می‌شناسد:

```text
fin_accounts.type = asset|…
fin_accounts.systemRole = bank_link | broker_cash | exchange_cash | crypto_holding | …
fin_accounts.linkedEntityId = …
```

کاربر در UX ساده «حساب‌ها / سرمایه‌گذاری» می‌بیند؛ در Journal همه **Financial (accounting) Account** اند با نوع مشخص — نه چهار جهان جدا بدون COA.

## Operational Account types (acc_*)

Bank · Cash · Card · Wallet · Brokerage Cash · Crypto Cash · External — نه فقط «بانک».

`fin_accounts` = Chart of Accounts حسابداری.


---

## Account در Core ≠ فقط Bank Account (P0)

در Accounting Core، **Account** یک Financial Account عام است. زیر‌انواع مفهومی:

```text
Bank
Brokerage
Exchange
Wallet
Cashbox
Liability
Equity
Income
Expense
Investment
```

UI می‌تواند فقط زیرمجموعهٔ کاربرپسند را نشان دهد:

- Bank Accounts
- Cash
- Brokerages
- Exchanges

ولی مدل Core نباید به «فقط بانک» محدود شود تا journal و chart of accounts تمیز بماند.

تفکیک اجباری قبلی برقرار است:

| لایه | جدول |
|------|------|
| Financial Account (نقد واقعی کاربر) | `acc_accounts` + cash صرافی/کارگزاری |
| Accounting Account (دفتر) | `fin_accounts` |
| Party | `ref_parties` — مستقل از Account |
