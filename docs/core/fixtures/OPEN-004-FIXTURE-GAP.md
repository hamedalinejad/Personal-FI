# OPEN-004 — Golden Fixture CI Gap

**Status:** Documented plan (implementation branch executes)

## Families

| Family | Glob | CI job (target) |
|--------|------|-----------------|
| CORE | GOLDEN-CORE-*.md | vitest fixtures/core |
| CRYPTO | GOLDEN-CRYPTO-*.md + GOLDEN-STANDALONE-CRYPTO.md | vitest fixtures/crypto |
| LOAN | GOLDEN-LOAN-*.md + GOLDEN-STANDALONE-LOAN.md | vitest fixtures/loan |
| FUND | GOLDEN-FUND-*.md + GOLDEN-STANDALONE-FUND.md | vitest fixtures/fund |
| STOCK | GOLDEN-STOCK-*.md + GOLDEN-STANDALONE-STOCKS.md | vitest fixtures/stock |
| METAL | GOLDEN-STANDALONE-METALS.md (+ metals golden) | vitest fixtures/metal |
| RECOVERY | GOLDEN-CORE-REVERSAL*.md + CORRECTION | vitest fixtures/recovery |

## Gate

Release financial = all family jobs green.  
`scripts/schema-drift-test.js` must also pass (OPEN-001).

## Residual fixtures to author

- GOLDEN-LOAN-RESIDUAL.md (BUG-018 last installment rounding)
