/**
 * API-001 / API-002 — single canonical response envelope.
 *
 * errors[].code is the only error code field (not errorCode).
 * engine_versions present on financial mutations / rebuild results.
 */
export function ok(data, {
  requestId = null,
  operationId = null,
  apiVersion = "1",
  schemaVersion = "1",
  engineVersions = null,
  metaExtra = {},
} = {}) {
  const body = {
    success: true,
    data: data ?? null,
    errors: [],
    meta: {
      request_id: requestId,
      operation_id: operationId,
      api_version: apiVersion,
      schema_version: schemaVersion,
      ...metaExtra,
    },
  };
  if (engineVersions != null) body.engine_versions = engineVersions;
  return body;
}

export function fail(errors, {
  requestId = null,
  operationId = null,
  apiVersion = "1",
  schemaVersion = "1",
  data = null,
} = {}) {
  const list = Array.isArray(errors) ? errors : [errors];
  return {
    success: false,
    data,
    errors: list.map((e) => {
      if (typeof e === "string") return { code: e, message: e };
      return {
        code: e.code || e.errorCode || "UNKNOWN",
        message: e.message || String(e.code || e),
        details: e.details || (e.featureCode ? { featureCode: e.featureCode } : undefined),
      };
    }),
    meta: {
      request_id: requestId,
      operation_id: operationId,
      api_version: apiVersion,
      schema_version: schemaVersion,
    },
  };
}
