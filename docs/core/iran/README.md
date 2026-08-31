# Iran Core (`docs/core/iran/`)

قواعد ایران **Core** است نه Feature جدا.

| ماژول مفهومی | نقش |
|--------------|-----|
| IranCalendar | تعطیلات، هفته کاری |
| IranMarketDate | جلسه بورس، business day |
| IranSettlement | T+n سهام |
| IranCurrency | IRR + تومان نمایش |
| IranTaxRules | (تدریجی) |
| IranBankRules | چک، کارمزد بانکی |
| IranLoanRules | conventions |
| IranSecurityIdentifiers | ISIN, firmCode |

Featureها (Stocks, Cheque, Loan, Tax, Metals) از این لایه import می‌کنند.
