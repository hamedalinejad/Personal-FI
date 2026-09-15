# Iran equity policy packages (machine data)

Holiday calendars and fee tables live here as versioned JSON, e.g.:
`iran-equity-calendar-1404-v1.json`

Financial Core must **not** hard-code annual holidays.
Operations persist `settlement_policy_version` / policy package id used.

## Current samples
- `iran-equity-calendar-v0-sample.json` — structure only; **not** official holidays
- `iran-equity-fees-v0-sample.json` — structure only; rates null

Replace samples with verified packages before RELEASE_PROVEN. Operations must persist `policyVersion` used.
