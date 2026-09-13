> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Storage ↔ API Field Mapping (BUG-CUR-026)

| Concept | API / TS | SQL |
|---------|----------|-----|
| Debit/credit side | side | side |
| Base currency of op | baseCurrency | base_currency |
| Account class (COA) | accountKind on fin_accounts | account_kind (asset\|liability\|…) |
| Operational cash kind | accountKind on acc_accounts | account_kind (cash\|bank_account\|…) |
| Business status | status | status (draft\|posted\|voided\|failed) |
| Journal post cache | postState | post_state (derived) |
| Settlement date | settlementDate | settlement_date |
| Event timestamp | eventAt | event_at |

**Normative pages must not use:** direction (for journal side), accountClass, baseCurrencyAtOperation.
