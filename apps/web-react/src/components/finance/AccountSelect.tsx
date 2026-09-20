import React from "react";
import type { AccountListItemVM } from "../../viewModels/accountVm";
import { formatMoney } from "../../formatters";

type Props = {
  label: string;
  accounts: AccountListItemVM[];
  value: string;
  onChange: (id: string) => void;
  currencyFilter?: string;
  required?: boolean;
};

/** Account selector — name, kind, currency, balance; no free-typed IDs */
export function AccountSelect({ label, accounts, value, onChange, currencyFilter, required }: Props) {
  const options = accounts.filter(
    (a) => a.status !== "archived" && (!currencyFilter || a.balance.currency === currencyFilter),
  );
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">— انتخاب حساب —</option>
        {options.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} · {a.kindLabel} · {a.balance.currency}
            {a.balance.availability === "available" && a.balance.raw != null
              ? ` · ${formatMoney(a.balance.raw, a.balance.currency)}`
              : " · —"}
          </option>
        ))}
      </select>
    </label>
  );
}
