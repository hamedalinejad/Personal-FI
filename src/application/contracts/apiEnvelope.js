/**
 * Canonical API response shape (§25).
 * Success: { ok: true, data, invalidated }
 * Failure: { ok: false, code, message }
 *
 * Compatibility: also sets success boolean for older UI callers.
 */

/**
 * @param {any} data
 * @param {string[]} [invalidated]
 */
export function ok(data, invalidated = []) {
  return {
    ok: true,
    success: true,
    data: data ?? null,
    invalidated: Array.isArray(invalidated) ? invalidated : [],
    errors: [],
    meta: { api_version: "1", schema_version: "1" },
  };
}

/**
 * @param {string} code
 * @param {string} [message]
 */
export function fail(code, message) {
  const msg = message || code || "COMMAND_FAILED";
  return {
    ok: false,
    success: false,
    data: null,
    code: code || "COMMAND_FAILED",
    message: msg,
    invalidated: [],
    errors: [{ code: code || "COMMAND_FAILED", message: msg }],
    meta: { api_version: "1", schema_version: "1" },
  };
}

/**
 * Normalize handler results into §25 shape.
 * Handlers may return { success, data }, { ok, data }, or bare data.
 * @param {any} result
 * @param {{ requestId?: string, skipPersist?: boolean }} [meta]
 */
export function normalizeResult(result, meta = {}) {
  if (result == null) return ok(null);

  if (typeof result.ok === "boolean") {
    if (result.ok) {
      return {
        ...ok(result.data, result.invalidated),
        meta: {
          api_version: "1",
          schema_version: "1",
          request_id: meta.requestId || null,
          operation_id: result.data?.operationId || null,
        },
      };
    }
    return fail(result.code || "COMMAND_FAILED", result.message);
  }

  if (typeof result.success === "boolean") {
    if (result.success === false) {
      const err = result.errors?.[0];
      return fail(err?.code || result.code || "COMMAND_FAILED", err?.message || result.message);
    }
    return {
      ...ok(result.data, result.invalidated),
      meta: {
        api_version: "1",
        schema_version: "1",
        request_id: meta.requestId || null,
        operation_id: result.data?.operationId || result.operationId || null,
        ...(result.meta || {}),
      },
    };
  }

  return ok(result);
}
