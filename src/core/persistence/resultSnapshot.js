import { createHash } from "node:crypto";

export const RESULT_SCHEMA_VERSION = "1.0.0";

/** PRES-002 — result_json is non-authoritative diagnostic/replay snapshot only. */
export function buildResultSnapshot(domainResult, { engineVersions = null } = {}) {
  const payload = {
    result_schema_version: RESULT_SCHEMA_VERSION,
    engine_versions: engineVersions,
    domain: domainResult ?? null,
  };
  const canonical = JSON.stringify(payload);
  const result_hash = createHash("sha256").update(canonical).digest("hex");
  return {
    result_json: canonical,
    result_schema_version: RESULT_SCHEMA_VERSION,
    result_hash,
    engine_versions: engineVersions,
  };
}
