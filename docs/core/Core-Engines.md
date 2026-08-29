# Core Engines (ضد Logic تکراری)

تعداد جداول Domain زیاد قابل قبول است؛ **تکرار منطق** نه.

| Engine | نقش |
|--------|-----|
| Transaction / Financial Operation | atomic op |
| Journal | double-entry + fin_accounts |
| Cost Basis | acquisition/disposal |
| FX | convert as-of |
| Rounding / Precision | scale per domain |
| Reconciliation | ledger vs snapshot |
| Audit | fin_audit_log |
| Corporate Action | structural qty/cost |
| Import | normalize pipeline |

Featureها adapter می‌دهند؛ engine را کپی نمی‌کنند.
