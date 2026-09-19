/**
 * Phase 12 — Mobile platform adapter contract.
 * Business logic stays in Core/Features; platforms only supply host capabilities.
 *
 * Official wrapper: UNSPECIFIED until POC scores Capacitor vs Tauri.
 */
export const MOBILE_WRAPPER_STATUS = "POC_PENDING"; // CAPACITOR | TAURI after POC

/** Capability surface every mobile host must implement */
export const MOBILE_ADAPTER_CAPABILITIES = Object.freeze([
  "startup",
  "sqliteAccess",
  "filesystem",
  "biometric",
  "shareExport",
  "filePicker",
  "offlineLifecycle",
  "updateMechanism",
]);

/**
 * @typedef {object} MobilePlatformAdapter
 * @property {string} id
 * @property {() => Promise<{ coldMs: number, warmMs: number }>} measureStartup
 * @property {() => Promise<{ open: boolean, path: string }>} openSqlite
 * @property {(rel: string, data: Uint8Array) => Promise<void>} writeFile
 * @property {(rel: string) => Promise<Uint8Array|null>} readFile
 * @property {() => Promise<{ available: boolean, unlocked?: boolean }>} biometric
 * @property {(payload: { title: string, path?: string }) => Promise<void>} share
 * @property {() => Promise<{ path: string, bytes?: Uint8Array }|null>} pickFile
 * @property {() => Promise<{ state: 'active'|'background'|'terminated' }>} offlineLifecycle
 * @property {() => Promise<{ channel: string, version: string }>} updateChannel
 */

/** Node harness stand-in used in CI (not a shipping mobile binary) */
export function createNodeMobileHarness(label = "node-harness") {
  const store = new Map();
  return {
    id: label,
    async measureStartup() {
      const t0 = Date.now();
      await Promise.resolve();
      return { coldMs: Date.now() - t0, warmMs: 0 };
    },
    async openSqlite() {
      return { open: true, path: `memory://${label}.sqlite` };
    },
    async writeFile(rel, data) {
      store.set(rel, data);
    },
    async readFile(rel) {
      return store.has(rel) ? store.get(rel) : null;
    },
    async biometric() {
      return { available: false, unlocked: false };
    },
    async share() {
      return;
    },
    async pickFile() {
      return null;
    },
    async offlineLifecycle() {
      return { state: "active" };
    },
    async updateChannel() {
      return { channel: "none", version: "0.0.0-harness" };
    },
  };
}

/**
 * POC scorecard — fill after real Capacitor vs Tauri runs.
 * Higher is better for each axis (0–5).
 */
export function emptyPocScorecard() {
  return {
    capacitor: Object.fromEntries(MOBILE_ADAPTER_CAPABILITIES.map((k) => [k, null])),
    tauri: Object.fromEntries(MOBILE_ADAPTER_CAPABILITIES.map((k) => [k, null])),
    decision: null,
    rule: "Choose ONE official wrapper; never fork Financial Core.",
  };
}

export function assertAdapterSurface(adapter) {
  for (const k of [
    "measureStartup",
    "openSqlite",
    "writeFile",
    "readFile",
    "biometric",
    "share",
    "pickFile",
    "offlineLifecycle",
    "updateChannel",
  ]) {
    if (typeof adapter[k] !== "function") {
      throw new Error("ADAPTER_MISSING:" + k);
    }
  }
  return true;
}
