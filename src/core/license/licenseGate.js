/**
 * P1-MOD-003 — License gates capability/UI only. Never deletes history.
 */
export function applyLicenseCapabilities(license, { previouslyWritten = [] } = {}) {
  const features = new Set(license?.enabledFeatures || []);
  const caps = {
    ui: {
      showAccounts: features.has("full") || features.has("accounts"),
      showLoan: features.has("full") || features.has("loan"),
      showCrypto: features.has("full") || features.has("crypto"),
      showFunds: features.has("full") || features.has("funds"),
      showStocks: features.has("full") || features.has("stocks"),
      showMetals: features.has("full") || features.has("metals"),
    },
    exportAllowed: true, // always — license must not block export of history
    historyIntact: true,
  };
  // Explicit: do not mutate or filter previouslyWritten rows
  return {
    ...caps,
    retainedRecordCount: previouslyWritten.length,
    retainedIds: previouslyWritten.map((r) => r.id),
  };
}

export function assertNoHistoryDeletion(beforeIds, afterIds) {
  for (const id of beforeIds) {
    if (!afterIds.includes(id)) {
      throw new Error("LICENSE_MUST_NOT_DELETE_HISTORY");
    }
  }
  return true;
}
