# PRODUCT (sole product owner)

**Status:** CURRENT

## 1. Vision
Offline-first personal accounting and investments for individuals, with Iran-aware policies and licensable feature editions.

## 2. Target users
Individuals tracking cash, income/expense, cheques, loans, and investments (crypto, Iran stocks, funds, metals, physical assets).

## 3. Product principles
* Accounting Core always present (may be hidden in standalone).
* Feature ≠ Page; max 6 navigation destinations.
* Decimal-string money; journal is cash truth.
* License gates capability only — never deletes history.
* Documentation: one owner per concept (DOCUMENTATION-STANDARD.md).

## 4. Scope v1
Accounts · multi-currency display · income · expense · cheques · loans · investments (crypto, stocks Iran, funds, metals) · physical assets · budget · goals · bills · notifications · reports · dashboard · portfolio · tax · documents · settings · security · price observations.

## 5. Explicit exclusions
Enterprise multi-entity · cloud as primary truth · futures/DeFi/NFT · hard-coded Iran rates in Core (use versioned policies).

## 6. Editions / licensing
Loan-only · Crypto-only · Stocks-only · Funds-only · Metals-only · Full.  
Disable = UI/capability only; export/history remain.

## 7. Navigation (locked)
`/` · `/money` · `/transactions` · `/investments` · `/loans` · `/more`  
Sheets for create/edit. No top-level `/accounting`.

## 8. Offline philosophy
Local SQLite (Node path); browser adapter OPEN until RELEASE_PROVEN.

## 9. Import/export philosophy
Preserve raw lineage; no silent field loss.

## 10. Release boundaries
Production NO-GO until RELEASE_PROVEN evidence (OFFLINE-RELEASE.md).

## 11. Terminology
Canonical names in FINANCIAL-CORE / DATA-MODEL / API; product language here only for UX labels.

## 12. Supersedes
Product-Map-EN/FA · Project-Blueprint product sections · Pages-IA nav rules (absorbed).
