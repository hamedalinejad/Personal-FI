import { toDecimal } from "../../core/money/canonicalDecimal.js";

export function requireOperationId(input) {
  if (!input || typeof input !== "object") throw new Error("VALIDATION_ERROR");
  if (!input.operationId || typeof input.operationId !== "string") {
    throw new Error("OP_OPERATION_ID_REQUIRED");
  }
  return input.operationId;
}

export function requirePayload(input) {
  return input.payload || input;
}

export function requirePositiveMoney(v, code = "VALIDATION_ERROR:amount") {
  if (v == null || v === "") throw new Error(code);
  const d = toDecimal(String(v));
  if (d.lte(0)) throw new Error(code);
  return d;
}

export function requireDate(v, code = "OP_BUSINESS_DATE_REQUIRED") {
  if (!v || typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(code);
  return v;
}

export function requireCurrency(v) {
  if (!v || typeof v !== "string") throw new Error("VALIDATION_ERROR:currency");
  return v;
}
