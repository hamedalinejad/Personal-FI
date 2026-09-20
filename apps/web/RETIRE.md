# apps/web — RETIRE CANDIDATE

Official product UI is **apps/web-react**.

This tree currently contains only module scaffolds (`cheque`, `assets` index stubs).

## Delete gate
Before removal:
1. Repository-wide reference scan returns zero hits outside this folder and RETIRE.md
2. CI/package/docs do not reference apps/web paths
3. file-inventory.tsv updated
4. npm gates + tests green

Until then: do not import from apps/web in product code.
