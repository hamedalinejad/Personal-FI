# Fixture Harness (P0-FINAL-AUD-001)

## Executable now

```bash
npm install
npx vitest run src/core/fixtures
```

| Layer | Path |
|-------|------|
| JSON fixtures | `/fixtures/*.json` |
| Harness | `src/core/fixtures/harness.ts` |
| Tests | `src/core/fixtures/criticalFixtures.test.ts` |
| CI | `.github/workflows/ci.yml` |

## Rules

- money/qty/rate = **string**
- `canonicalDecimalString` before compare
- missing expected field → fail
- JSON numbers for money in fixture files → **forbidden** (use strings)

## Green today (critical math)

- CRITICAL-TOMAN-INPUT
- CRITICAL-TRANSFER-FEE
- CRITICAL-C2C-SWAP
- CRYPTO-BTC-USDT-IRR-PNL

## Not green yet

Full Core/Loan/Stock/Recovery operation graphs — require Domain/Operation implementation.

**Gate C full = BLOCKED** until those exist. Critical subset = **executable**.
