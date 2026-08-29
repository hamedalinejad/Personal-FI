# License Domain (خارج از Accounting — Offline-first)

## مرز

```text
Application
  → License Validator (مستقل)
  → در صورت مجاز: باز کردن Database File کاربر
  → All financial data داخل SQLite آن کاربر
```

- **یک SQLite per user/tenant** — بدون `userId`/`tenantId` روی هر ردیف مالی
- License **هرگز** داخل جداول حسابداری/تراکنش embed نمی‌شود
- شکست license ≠ invalidate کردن history مالی روی دیسک

## مدل Offline (پیشنهادی محصول)

**نه:** هر startup → license server (نقض offline).

**بله:**

```text
Signed License File
  → verify با Public Key embed در اپ
  → edition / features / expiry
```

| فیلد license | |
|--------------|--|
| `licenseId` | |
| `edition` | personal / pro / … |
| `issuedAt` / `expiresAt` | |
| `features[]` | |
| `deviceBinding?` | اختیاری |
| `customerId?` | |
| `signature` | |

- **Private key هیچ‌وقت داخل برنامه نیست**
- Validation آینده (آنلاین) فقط opt-in / renewal — نه شرط هر خواندن DB
- Feature flags از license؛ داده مالی مستقل می‌ماند

Domain جدا: `docs` این فایل؛ implementation در ماژول `license/` نه داخل `features/04-Debt-...`.
