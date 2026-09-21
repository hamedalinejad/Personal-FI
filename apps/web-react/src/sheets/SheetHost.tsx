import React from "react";
import { useAppState, useAppDispatch } from "../app/AppProviders";
import { BackupSheet } from "./BackupSheet";
import { MoneySheets } from "./MoneySheets";
import { LoanCreateSheet } from "./LoanCreateSheet";
import { LicenseSheet } from "./LicenseSheet";
import { ImportSheet } from "./ImportSheet";
import { StubSheet } from "./StubSheet";
import { SHEET_TITLES, WIRED_SHEETS } from "./sheetRegistry";

const MONEY_KINDS = new Set(["account.create", "deposit", "withdraw"]);

export function SheetHost() {
  const { sheet } = useAppState();
  const dispatch = useAppDispatch();
  if (!sheet) return null;

  function close() {
    dispatch({ type: "CLOSE_SHEET" });
  }

  let body: React.ReactNode = null;
  if (sheet === "backup") body = <BackupSheet onClose={close} />;
  else if (MONEY_KINDS.has(sheet)) body = <MoneySheets kind={sheet} onClose={close} />;
  else if (sheet === "loan.create") body = <LoanCreateSheet onClose={close} />;
  else if (sheet === "license") body = <LicenseSheet onClose={close} />;
  else if (sheet === "import") body = <ImportSheet onClose={close} />;
  else {
    const title = SHEET_TITLES[sheet] || sheet;
    body = (
      <StubSheet
        title={title}
        sheetId={sheet}
        description={
          WIRED_SHEETS.has(sheet)
            ? undefined
            : "این آیتم در معماری IA ثبت شده و در UI موجود است تا منو کامل بماند."
        }
        onClose={close}
      />
    );
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
        {body}
      </div>
    </div>
  );
}
