# Financial Calculation Engines (P0)

هسته محاسباتی مشترک — Featureها rule می‌دهند، Engineها محاسبه می‌کنند.

```text
Financial Core
├── DecimalEngine
├── MoneyEngine
├── FXEngine
├── ValuationEngine
├── CostBasisEngine
├── LoanScheduleEngine
├── AccountingEngine
├── ReconciliationEngine
├── OperationEngine
└── AuditEngine
```

| Engine | مسئولیت |
|--------|----------|
| DecimalEngine | decimal string، precision، rounding policy |
| MoneyEngine | Money + Currency اجباری، جمع/تفریق هم‌ارز |
| FXEngine | Transaction / Historical / Current FX، asOf |
| ValuationEngine | qty × price، NAV، historical closest price |
| CostBasisEngine | weighted average / FIFO policy per asset class |
| LoanScheduleEngine | day count، declining/flat/custom، schedule versions |
| AccountingEngine | journal lines، trial projection |
| ReconciliationEngine | rebuild vs snapshot، گزارش drift |
| OperationEngine | `runAtomicFinancialOperation`، idempotency |
| AuditEngine | نوشتن `fin_audit_log` |

## Feature فقط rule می‌دهد

| Feature | Policy نمونه |
|---------|----------------|
| Crypto | weighted average (پیش‌فرض) |
| Stock | FIFO یا weighted average |
| Fund | NAV-based valuation |
| Loan | declining / flat / custom |
| Metal | quantity × market price |

**هدف:** جلوگیری از چهار محاسبه متناقض داخل CryptoService / StockService / LoanService / Reports.

پیاده‌سازی تدریجی مجاز است؛ **قرارداد و مرز از الان** قفل است.

مرجع: `Cost-Basis-Engine.md` · `Loan-Schedule-Engine.md` · `rounding/Rounding-Policy.md` · `Precision-Policy.md`
