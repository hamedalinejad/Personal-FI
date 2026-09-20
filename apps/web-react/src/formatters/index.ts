/** Display-only formatters. Never mutate command / stored decimal strings. */

export function formatMoney(raw: string | null | undefined, currency: string, _locale = "fa-IR"): string {
  if (raw == null || raw === "") return `— ${currency}`;
  const neg = raw.startsWith("-");
  const body = neg ? raw.slice(1) : raw;
  const [w, f] = body.split(".");
  const grouped = w.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const shown = f != null && f !== "" ? `${grouped}.${f}` : grouped;
  return `${neg ? "-" : ""}${shown} ${currency}`;
}

export function formatQuantity(raw: string | null | undefined, unit?: string): string {
  if (raw == null || raw === "") return "—";
  return unit ? `${raw} ${unit}` : raw;
}

export function formatRate(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "—";
  return raw;
}

export function formatPrice(raw: string | null | undefined, currency: string): string {
  return formatMoney(raw, currency);
}

export function formatBusinessDate(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  return iso;
}

export function formatRelativeStatus(status: string | null | undefined): string {
  if (!status) return "—";
  const map: Record<string, string> = {
    active: "فعال",
    paid_off: "تسویه",
    archived: "بایگانی",
    posted: "ثبت‌شده",
    reversed: "برگشت‌خورده",
  };
  return map[status] || status;
}
