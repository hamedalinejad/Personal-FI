# Audit Trail vs Financial Event

این دو یکی نیستند.

| | Financial Event | Audit |
|--|-----------------|-------|
| معنی | چه اتفاق اقتصادی/حسابداری افتاد | چه کسی/چه سیستمی چه تغییری اعمال کرد |
| مثال | Operation X posted; Y reversed | User approved repair; User corrected X |
| ذخیره | `fin_operations` + domain + journal | `fin_audit_log` |
| SoT مالی | بله (به‌همراه ledger) | خیر — observability و compliance |

```text
Audit: "User corrected transaction X"
Financial: "Operation X voided/reversed; Operation Y posted"
```
