import React from "react";
import { useAppState, useAppDispatch } from "../app/AppProviders";
import { BackupSheet } from "./BackupSheet";
import { MoneySheets } from "./MoneySheets";
import { LoanCreateSheet } from "./LoanCreateSheet";
import { LicenseSheet } from "./LicenseSheet";
import { ImportSheet } from "./ImportSheet";

export function SheetHost() {
  const { sheet } = useAppState();
  const dispatch = useAppDispatch();
  if (!sheet) return null;

  function close() {
    dispatch({ type: "CLOSE_SHEET" });
  }

  return (
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
      </div>
    </div>
  );
}
