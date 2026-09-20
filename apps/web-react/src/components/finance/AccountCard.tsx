import React from "react";
import type { AccountListItemVM } from "../../viewModels/accountVm";
import { MoneyAmount } from "./MoneyAmount";

export function AccountCard({ account }: { account: AccountListItemVM }) {
  return (
    <li className="account-card">
      <strong>{account.name}</strong>
      <span className="muted"> {account.kindLabel}</span>{" "}
      <MoneyAmount value={account.balance} />
      <span className="muted"> · {account.status}</span>
    </li>
  );
}
