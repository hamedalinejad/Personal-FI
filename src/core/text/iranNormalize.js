/**
 * Iran banking / identity text normalize — before unique/store.
 */

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toAsciiDigits(input) {
  if (input == null) return "";
  let s = String(input);
  for (let i = 0; i < 10; i++) {
    s = s.split(PERSIAN_DIGITS[i]).join(String(i));
    s = s.split(ARABIC_DIGITS[i]).join(String(i));
  }
  return s;
}

export function stripZwAndSpace(input) {
  return toAsciiDigits(input)
    .replace(/[\u200c\u200d\u200b\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeIban(input) {
  return toAsciiDigits(input)
    .replace(/[\u200c\u200d\u200b\ufeff\s\-]/g, "")
    .toUpperCase();
}

export function normalizeAccountNumber(input) {
  return toAsciiDigits(input).replace(/[^\d]/g, "");
}
