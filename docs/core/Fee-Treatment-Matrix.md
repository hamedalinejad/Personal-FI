# Fee Treatment Matrix (سراسری)

| Field | |
|-------|--|
| feeAsset | |
| feeAmount | |
| feeTreatment | accounting (expense, cost_basis_in, proceeds_reduction, fee_burn, capitalize, …) |
| feeIncludedInQuantity | bool — آیا qty دریافتی net است؟ |
| feeIncludedInCost | bool |
| feeIncludedInCash | bool |

## Quantity modes (crypto و mapپذیر)

| Mode | Received qty | Fee |
|------|--------------|-----|
| fee_from_received | gross − fee | same asset |
| fee_from_base_asset | gross full | از موجودی پایه جدا |
| fee_in_quote | full base qty | quote currency |
| fee_external | full | خارج از trade |

Feature invent نمی‌کند — CanonicalFeeEvent + این ماتریس.
