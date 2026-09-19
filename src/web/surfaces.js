/** Phase 10 common surfaces — UI components consume public APIs only */
export const SURFACES = Object.freeze({
  search: { id: "search", route: "*" },
  quickAdd: { id: "quick-add", route: "*" },
  detailSheet: { id: "detail-sheet", route: "*" },
  transactionEditor: { id: "transaction-editor", route: "/transactions" },
  accountSelector: { id: "account-selector", route: "/money" },
  currencyFxSelector: { id: "currency-fx-selector", route: "*" },
  reportFilters: { id: "report-filters", route: "/more/reports" },
  backupRestore: { id: "backup-restore", route: "/more/backup" },
});
