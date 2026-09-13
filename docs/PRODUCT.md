# PRODUCT (sole product owner)

**Status:** CURRENT · Normative for product scope, editions, navigation.  
**Not normative for:** formulas, SQL, API envelopes (see FINANCIAL-CORE / DATA-MODEL / API).

## 1. Purpose
Offline-first personal accounting and investment management, Iran-aware, licensable by feature edition.

## 2. Users
Individuals managing personal cash, loans, and investments (crypto, Iran stocks, funds, metals, physical assets).

## 3. Scope (v1 product surface)
Accounts & banking · multi-currency display · income · expense · cheques · loans · investments (crypto, stocks Iran, funds, metals) · physical assets · budget · goals · bills · notifications · reports · dashboard · portfolio/wealth · tax · documents · settings · security · price observations.

## 4. Non-goals (v1)
Multi-entity enterprise · cloud sync as primary truth · futures/DeFi/NFT · hard-coded Iranian rates in Core (use versioned policies).

## 5. Editions / licensing
Standalone: Loan-only, Crypto-only, Stocks-only, Funds-only, Metals-only, Full.  
License gates capability/UI only — never deletes history.

## 6. Navigation (locked)
Max **6** primary destinations: `/` · `/money` · `/transactions` · `/investments` · `/loans` · `/more`.  
Feature ≠ Page. Create/edit = Sheet/Drawer. No top-level `/accounting`.

## 7. UX philosophy
Few deep pages; modular feature packages; Accounting Core always present (may be hidden in standalone).

## 8. Release boundary
Production **NO-GO** until RELEASE_PROVEN evidence (see OFFLINE-RELEASE / DEVELOPMENT).  
Documentation closed when owner map complete (DOCUMENTATION-STANDARD.md).

## 9. Pointers
Architecture → ARCHITECTURE.md · Finance → FINANCIAL-CORE.md · Schema → DATA-MODEL.md + schema.sql · Modules → modules/*.md

## 10. Supersedes (product-level)
Product-Map-EN/FA, Project-Blueprint product sections, Pages-IA (nav rules absorbed here). Those files become SEE/ARCHIVE in later cycles.
