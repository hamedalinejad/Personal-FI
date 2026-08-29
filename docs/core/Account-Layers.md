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
