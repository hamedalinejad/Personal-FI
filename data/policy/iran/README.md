# Iran policy packages (machine-only)

## Files
| File | Role |
|------|------|
| `iran-equity-calendar-v1.json` | Weekend + T+n structure + holiday seed |
| `iran-equity-fees-v1.json` | Fee structure; rates null → caller supplies explicit feeAmount |
| `*-v0-sample.json` | Historical samples; do not use as production authority |

## Rules
- Core code must **not** hard-code holiday dates or commission rates.
- Trades persist `settlement_policy_version` (and fee amounts as explicit inputs).
- Official TSE bulletin may replace holiday seed before RELEASE_PROVEN for holiday-aware settlement.
- Weekend-only mode remains valid if `holidays[]` is empty or ignored.
