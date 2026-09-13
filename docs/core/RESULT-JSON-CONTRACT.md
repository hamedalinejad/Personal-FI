> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# result_json Contract (BUG-CUR-028)

1. Written **only after** journal lines + domain writes in the same SQLite transaction.
2. `loadOperation` rebuilds **journalLines from relational tables**; snapshot fields are replay metadata.
3. `result_json` is **not** accounting SoT.
4. `result_schema_version` + `result_hash` optional integrity.
