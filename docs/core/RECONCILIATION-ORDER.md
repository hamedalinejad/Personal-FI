# Canonical Reconciliation Order (Gates 1–9)

**Authority:** implementation sequence. Do not skip gates.

| Gate | Name | Outcome |
|------|------|---------|
| 1 | Vocabulary | operation, status, account class, operational kind, provenance, side, line kind, instrument identity frozen |
| 2 | Schema | SQL names, constraints, nullability, indexes, migrations, manifest checksum |
| 3 | Operation kernel | normalization, hash, state model, journal validation, amountInBase |
| 4 | Cash | one cash SoT; no ghost cash tables |
| 5 | Loan | rate units, flat/qarz, residual, day counts, golden equal-principal |
| 6 | Investment | Crypto/Stocks/Funds/Metals ↔ Core cash/identity/cost basis |
| 7 | Tax + Reports | payTax-only paid transition; historical ValuationContext |
| 8 | Offline + Recovery | browser port + recovery proof |
| 9 | Release evidence | Golden + Recovery + Standalone + CI + No-Field-Loss + Rebuild |

Live status: `GO-NO-GO.md` · `OPEN-ISSUES-REGISTER.md`
