# Open Issues — LIVE

## Completed this pass

| Item | Evidence |
|------|----------|
| FX multi-hop BFS | `src/core/domain/fx/crossRate.js` + tests |
| Crypto.buy vertical | `src/features/crypto` + tests |
| Fund.subscribe vertical | `src/features/funds` + tests |
| Stocks.buy vertical | `src/features/stocks` + tests |
| Metals.buy vertical | `src/features/metals` + tests |
| CI uses `npm ci` + full gates | `.github/workflows/ci.yml` |
| Persistence Port surface | `src/core/persistence/port.js` |

## Remaining (non-blocking for continued coding)

| Item | Note |
|------|------|
| PWA sql.js adapter body | Port interface exists; implement adapter when UI shell lands |
| Full sell/swap/CA/reinvest suites | Extend each vertical with same pattern |
| GitHub Actions run confirmation | After push, verify Actions tab |

## Production ship

Still requires green Actions on `main` + product recovery checklist.
