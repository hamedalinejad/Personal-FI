# Iran Business Calendar (R-033)

**Status:** Spec lock

- Holidays: official Jalali calendar + TSE non-trading days
- Loan due dates / cheque due: shift to next business day when policy says so
- Settlement (stocks T+N): may move off trade_date
- Adapter: `IranBusinessCalendarPort` — injectable for tests

See Loan-Schedule-Engine, Cheque-Management, Stocks-Iran.
