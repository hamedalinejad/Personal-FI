/**
 * Browser persistence wave status (A–C).
 * Wave-1 tracking.
 */

export const BROWSER_PERSISTENCE_WAVES = Object.freeze({
  A: {
    name: "IDB byte store + single writer",
    status: "IMPLEMENTED",
    files: [
      "src/core/persistence/browser/idbByteStore.js",
      "src/core/persistence/browser/singleWriter.js",
    ],
  },
  B: {
    name: "sql.js adapter + schema apply + durable persist",
    status: "IMPLEMENTED",
    files: [
      "src/core/persistence/browser/browserSqlAdapter.js",
    ],
  },
  C: {
    name: "FinancialHost bind + license gate + query catalog",
    status: "IMPLEMENTED",
    files: [
      "src/platform/web/financialHost.js",
      "src/application/queryCatalog.js",
      "src/core/license/capabilityGate.js",
    ],
  },
});

export function allWavesImplemented() {
  return Object.values(BROWSER_PERSISTENCE_WAVES).every((w) => w.status === "IMPLEMENTED");
}
