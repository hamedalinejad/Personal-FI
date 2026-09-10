---
id: DOC-AUTH-IMPL-ORDER
title: Exact Implementation Order
status: approved
version: 1.0
updated: 2026-09-10
---

# Implementation order (do not start by adding UI)

## Phase 0 — Documentation authority cleanup

1. Align IMPLEMENTATION-READY-INDEX  
2. Align IMPLEMENTATION-READY-FEATURES  
3. Docs consistency gate  
4. Single live status vocabulary  
5. Phase declaration: scaffold vs production  

**PARTIAL** — consistency gate + vocabulary exist; continue alignment.

## Phase 1 — Persistence foundation

Port → Node adapter → migration manager → schema version → checksum → one open path → backup/restore → crash/recovery  

**PARTIAL** — port, open path, migration ensure present; recovery matrix incomplete.

## Phase 2 — Financial operation kernel

normalize → hash → operationId conflict → atomic txn → journal → domain → cash settlement → result snapshot → error propagation  

**PARTIAL** — core path exists for Loan + feature buys/subscribe.

## Phase 3 — Data preservation

Field coverage matrix; request↔schema/result; raw↔canonical; export/migration roundtrip. Gate H green.

**PARTIAL** — matrix + payload envelope; full Gate H not green.

## Phase 4 — Accounting core

COA, journal, opening, reversal, correction, reconciliation, period lock, GL, TB, BS, P&L, CF  

**PARTIAL** — COA helpers + journal posting; reports incomplete.

## Phase 5 — Loan as reference vertical

create, schedule, payment, allocation, reverse, fees, penalty, multi-currency, standalone, recovery, golden  

**Strongest current vertical — still not RELEASE-PROVEN for full matrix.**

## Phase 6 — Feature verticals

Crypto → Funds → Stocks Iran → Metals → Cheques → Accounts UI  

Each: `IMPLEMENTED → INTEGRATED → GOLDEN-GREEN → RECOVERY-GREEN → RELEASE-PROVEN`
