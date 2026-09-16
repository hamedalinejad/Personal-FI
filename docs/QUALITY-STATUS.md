# QUALITY-STATUS

**Live only.** History = Git. No BUG/AUDIT Markdown.

## Gates
| Gate | Value |
|------|-------|
| **SEMANTIC_CODING_READY** | **true** |
| FREEZE_PROVEN | false (shipping freeze still needs browser E2E if browser ships + official TSE holiday bulletin) |
| RELEASE_PROVEN | false |
| PRODUCTION | NO-GO |
| UI | WAIT |

## Closed since last audit
| Finding | Status |
|---------|--------|
| P0-01 Fee taxonomy / `reduce_proceeds` | **CLOSED** — single enum in FINANCIAL-CORE + feeEngine; journal legs documented; golden tests |

## What “complete for coding” means
All owner docs, dual-mode (standalone + full API composition), Financial Core invariants, 42 command cards, field-preservation matrix, fixtures for investment/loan/core families, recovery core scenarios, rebuild + backup metadata, Iran **structure** policies — are locked.

You may implement Core → Loan → investments → remaining modules against this tree without inventing economics.

## Still not production / not freeze-shipping
| Item | Why |
|------|-----|
| Real browser tab sql.js+IDB E2E | Needs browser environment |
| Official TSE holiday **bulletin** replace seed dates | External data source |
| Official broker fee **rate tables** | Explicit feeAmount on commands is the v1 path |
| TWR/MWR | Explicitly DEFERRED |
| Corporate actions / crypto deposit-swap | Explicitly DEFERRED |
| Accounts/cheque/tax/budget full goldens | Commands catalogued; implementation scaffold next |

## Dual mode (locked product rule)
| Edition | Accounts UI | How |
|---------|-------------|-----|
| loan-only, funds-only, metals-only, crypto-only, stocks-only | **Not required** | Feature `public-api` only |
| full | Optional | `src/api/publicRegistry` · **one shared journal** |

## Proof
`npm test` · `npm run gates` · `docs/core/registry/*` · `data/policy/iran/*`
