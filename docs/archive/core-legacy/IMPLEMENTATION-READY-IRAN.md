> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Implementation-Ready — Iran runtime

| ID | Rule | Implementation |
|----|------|----------------|
| R-020 | IRR store / Toman UI | Store IRR strings; convert on input/display with metadata |
| R-021 | Bank interest | accrueInterest operation + journal |
| R-022 | Broker fees | versioned schedule → CanonicalFeeEvent |
| R-029 | AR/AP | recognize/settle ops + party |
| R-031 | Loan templates | mehr/housing/qarz as data/config |
| R-032 | Penalty | separate component, never mixed into interest |
| R-033 | Holidays | IranBusinessCalendarPort |
| R-047 | Jalali display | UI only; storage Gregorian DATE |
| R-050 | Import | unknownFields preserved |
| R-051 | Encryption | persistence boundary |

## Acceptance

| ID | Test |
|----|------|
| IR1 | Toman → IRR store → Toman display |
| IR2 | qarz template zero interest |
| IR3 | penalty ≠ interest field |
| IR4 | due date shifts on holiday |
| IR5 | import unknownFields kept |
