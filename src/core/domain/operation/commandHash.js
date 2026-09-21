/**
 * Canonical command hash — stable key order + decimal-safe JSON.
 * Browser: Web Crypto Subtle. Node: node:crypto.
 */

function sortedReplacer(_key, value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = value[k];
    return out;
  }
  return value;
}

export function stableStringify(obj) {
  return JSON.stringify(obj, sortedReplacer);
}

export async function sha256Hex(text) {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(text);
    const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  try {
    const { createHash } = await import("node:crypto");
    return createHash("sha256").update(text).digest("hex");
  } catch {
    throw new Error("HASH_UNAVAILABLE");
  }
}

/**
 * @param {{ commandId: string, payload: object }} input
 */
export async function computeCommandHash({ commandId, payload }) {
  const body = stableStringify({ commandId, payload: payload ?? null });
  return sha256Hex(body);
}
