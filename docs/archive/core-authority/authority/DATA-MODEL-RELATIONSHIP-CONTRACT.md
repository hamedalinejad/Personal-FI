---
id: DOC-AUTH-DM-REL
title: Data Model and Relationship Rules
status: approved
version: 1.0
updated: 2026-09-12
authority: binding
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# Scope

Semantics the implementation **must** preserve.  
Exact table names: only from `docs/core/db/schema.sql`. This document is **not** a second schema.

# Relationship contract

| Layer | Owner / SoT | References | Rule |
|-------|-------------|------------|------|
| **Operation** | Financial operation envelope (`fin_operations`) | journal, domain result, source lineage | Operation is the orchestration identity and **idempotency** boundary. `result_json` is a **replay snapshot**, not the accounting SoT. |
| **Accounting** | Journal entries + lines (`fin_journal_*`) | `fin_operations` + `fin_accounts` | All financial effects that affect statements are **journalized**. Lines carry currency and conversion evidence. |
| **Account** | `fin_accounts` | parent / role / currency / reconciliation | Hierarchy is classification. **Balance comes from journal**, never hand-maintained totals. |
| **Instrument** | `ref_instruments` | holdings, trades, prices | **Symbol is not identity.** Identity needs asset class plus stronger identifiers when available. |
| **Price** | price history / valuation context | instrument + currency + as-of / market date | Include source, date, quote basis/type, stale/degraded provenance. |
| **Cost basis** | cost-basis engine / lots or equivalent | instrument transactions + fees + transfers + corporate actions | Historical acquisition cost is **separate** from current valuation. |
| **Loan** | loan + schedule + payment/allocation + fees | operations + journal | Schedule is a **projection/snapshot**. Posted payment and reversal are accounting events linked to operations. |
| **Import** | raw payload + lineage | canonical records / operations | Normalization creates canonical rows **without deleting** source evidence. |
| **Feature API** | module `public-api` | domain commands/queries | External callers only use public-api; **private imports across features are forbidden**. |
| **Persistence** | persistence port | Node / browser adapter | Domain code is storage-agnostic; adapter owns physical DB lifecycle and durability. |

# Forbidden

- Using `result_json` as ledger truth
- Cross-feature private imports
- Domain code opening SQLite bypassing the persistence port
- Symbol-only instrument identity for historical rebuild
