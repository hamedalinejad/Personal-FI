/** P0-CODE-001 — canonical decimal string boundary */
export function canonicalDecimalString(input) {
  if (typeof input !== "string") {
    throw new Error("DECIMAL_NOT_STRING");
  }
  const s = input.trim();
  if (s === "" || s === "NaN" || s === "Infinity" || s === "-Infinity") {
    throw new Error("DECIMAL_NON_FINITE");
  }
  if (!/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) {
    throw new Error("DECIMAL_INVALID");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) {
    throw new Error("DECIMAL_NON_FINITE");
  }
  // normalize -0
  if (Object.is(n, -0) || s === "-0" || s === "-0.0") {
    return "0";
  }
  // keep string form without forcing float reformatting for large ints
  if (s.includes("e") || s.includes("E")) {
    return n.toString();
  }
  // strip leading zeros carefully
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s.replace(/^\+/, "");
  const [i, f] = body.split(".");
  const intPart = i.replace(/^0+(?=\d)/, "") || "0";
  const out = f != null ? `${intPart}.${f}` : intPart;
  return neg && out !== "0" ? `-${out}` : out;
}
