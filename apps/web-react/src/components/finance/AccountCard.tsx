import React from "react";
<<<<<<< HEAD
import { MoneyAmount } from "./MoneyAmount";
import { formatMoney } from "../../formatters";

type Props = {
  name: string;
  currency: string;
  balance: string;
  kindLabel?: string;
};

export function AccountCard({ name, currency, balance, kindLabel }: Props) {
  return (
    <div className="account-card">
      <strong>{name}</strong>
      {kindLabel ? <span className="muted"> {kindLabel}</span> : null}
      <div>
        <MoneyAmount value={formatMoney(balance, currency)} />
      </div>
    </div>
=======
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
>>>>>>> origin/main
  );
}
