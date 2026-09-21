import React from "react";
<<<<<<< HEAD
import { useAppState, useAppDispatch } from "../app/AppProviders";
import { BackupSheet } from "./BackupSheet";
import { MoneySheets } from "./MoneySheets";
import { LoanCreateSheet } from "./LoanCreateSheet";
import { LicenseSheet } from "./LicenseSheet";
import { ImportSheet } from "./ImportSheet";
=======
import { useAppDispatch, useAppState } from "../app/AppProviders";
import { AccountCreateSheet } from "./AccountCreateSheet";
import { TransferSheet } from "./TransferSheet";
import { MoneyMoveSheet } from "./MoneyMoveSheet";
import { TxQuickSheet } from "./TxQuickSheet";
import { LoanCreateSheet } from "./LoanCreateSheet";
import { LoanPaymentSheet } from "./LoanPaymentSheet";
import { LoanReverseSheet } from "./LoanReverseSheet";
import { BackupSheet } from "./BackupSheet";
import { ImportExportSheet } from "./ImportExportSheet";
import {
  CryptoBuySheet,
  CryptoSellSheet,
  CryptoTransferSheet,
  StocksBuySheet,
  StocksSellSheet,
  StocksDividendSheet,
  FundsSubscribeSheet,
  FundsRedeemSheet,
  MetalsBuySheet,
  MetalsDeliverySheet,
} from "./InvestmentSheets";
>>>>>>> origin/main

export function SheetHost() {
  const { sheet } = useAppState();
  const dispatch = useAppDispatch();
  if (!sheet) return null;

  function close() {
    dispatch({ type: "CLOSE_SHEET" });
  }

  return (
<<<<<<< HEAD
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <div className="sheet-panel">
        <button type="button" className="sheet-close" onClick={close} aria-label="بستن">
          ×
        </button>
        {sheet === "backup" ? <BackupSheet onClose={close} /> : null}
        {sheet === "deposit" || sheet === "account.create" || sheet === "withdraw" ? (
          <MoneySheets kind={sheet} onClose={close} />
        ) : null}
        {sheet === "loan.create" ? <LoanCreateSheet onClose={close} /> : null}
        {sheet === "license" ? <LicenseSheet onClose={close} /> : null}
        {sheet === "import" ? <ImportSheet onClose={close} /> : null}
=======
    <div className="sheet-backdrop" role="presentation" onClick={close}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      >
        {sheet === "account-create" && <AccountCreateSheet onClose={close} />}
        {sheet === "transfer" && <TransferSheet onClose={close} />}
        {sheet === "deposit" && <MoneyMoveSheet kind="deposit" onClose={close} />}
        {sheet === "withdraw" && <MoneyMoveSheet kind="withdraw" onClose={close} />}
        {sheet === "tx-quick" && <TxQuickSheet onClose={close} />}
        {sheet === "loan-create" && <LoanCreateSheet onClose={close} />}
        {sheet === "loan-payment" && <LoanPaymentSheet onClose={close} />}
        {sheet === "loan-reverse" && <LoanReverseSheet onClose={close} />}
        {sheet === "backup" && <BackupSheet onClose={close} />}
        {sheet === "crypto-buy" && <CryptoBuySheet onClose={close} />}
        {sheet === "crypto-sell" && <CryptoSellSheet onClose={close} />}
        {sheet === "crypto-transfer" && <CryptoTransferSheet onClose={close} />}
        {sheet === "stocks-buy" && <StocksBuySheet onClose={close} />}
        {sheet === "stocks-sell" && <StocksSellSheet onClose={close} />}
        {sheet === "stocks-dividend" && <StocksDividendSheet onClose={close} />}
        {sheet === "funds-subscribe" && <FundsSubscribeSheet onClose={close} />}
        {sheet === "funds-redeem" && <FundsRedeemSheet onClose={close} />}
        {sheet === "metals-buy" && <MetalsBuySheet onClose={close} />}
        {sheet === "metals-delivery" && <MetalsDeliverySheet onClose={close} />}
        {sheet === "import-export" && <ImportExportSheet onClose={close} />}
>>>>>>> origin/main
      </div>
    </div>
  );
}
