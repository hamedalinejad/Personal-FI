import React from "react";
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
  );
}
