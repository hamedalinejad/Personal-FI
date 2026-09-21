import { formatMoney } from "../formatters";

export type MoneyAvailability = "available" | "missing" | "unavailable";

export type MoneyVM = {
  raw: string | null;
  display: string;
  currency: string;
  availability: MoneyAvailability;
};

export type AccountListItemVM = {
  id: string;
  name: string;
  kindLabel: string;
  balance: MoneyVM;
  status: string;
};

/** Domain list row → presentation. No economic recalculation. */
export function toAccountListItem(row: {
  id: string;
  name: string;
  accountKind?: string;
  currency: string;
  balance?: string | null;
  balanceSource?: string;
  status?: string;
}): AccountListItemVM {
  const raw = row.balance == null || row.balance === "" ? null : String(row.balance);
  const availability: MoneyAvailability =
    raw == null ? "unavailable" : row.balanceSource === "journal" ? "available" : "available";
  return {
    id: row.id,
    name: row.name,
    kindLabel: row.accountKind || "account",
    balance: {
      raw,
      display: formatMoney(raw, row.currency),
      currency: row.currency,
      availability,
    },
    status: row.status || "active",
  };
}
