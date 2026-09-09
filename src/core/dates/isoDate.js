/** Gregorian ISO date only — no locale parsing in Core. */
const RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertIsoDate(value, field = "date") {
  if (typeof value !== "string" || !RE.test(value)) {
    throw new Error(`DATE_NOT_ISO:${field}`);
  }
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error(`DATE_INVALID:${field}`);
  }
  return value;
}

export function assertDateFields(obj, fields) {
  for (const f of fields) {
    if (obj[f] != null) assertIsoDate(obj[f], f);
  }
  return true;
}
