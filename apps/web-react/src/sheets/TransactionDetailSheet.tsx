import React, { useRef, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { userMessageForError } from "../i18n/errorUx";
import { formatMoney, formatBusinessDate } from "../formatters";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

export type TxRow = {
  id: string;
  operationId: string;
  businessDate: string;
  amount: string;
  currency: string;
  direction: string;
  memo?: string | null;
  type?: string;
};

/** Detail + reversal: original stays posted; new reverse operation */
export function TransactionDetailSheet({
  row,
  onClose,
  onReversed,
}: {
  row: TxRow;
  onClose: () => void;
  onReversed?: () => void;
}) {
  const gateway = useGateway();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const opRef = useRef(crypto.randomUUID());

  const reverseCmd =
    row.direction === "out" || row.type === "expense"
      ? "expense.reverse"
      : row.direction === "in" || row.type === "income"
        ? "income.reverse"
        : null;

  async function onReverse() {
    if (!reverseCmd) {
      setError("این نوع تراکنش از UI قابل برگشت نیست.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await gateway.execute(reverseCmd, {
      operationId: opRef.current,
      payload: {
        originalOperationId: row.operationId,
        businessDate: new Date().toISOString().slice(0, 10),
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(userMessageForError(res.code, res.message));
      return;
    }
    onReversed?.();
    onClose();
  }

  return (
    <div className="form">
      <h2 id="sheet-title">جزئیات تراکنش</h2>
      <dl className="detail">
        <dt>تاریخ</dt>
        <dd>{formatBusinessDate(row.businessDate)}</dd>
        <dt>مبلغ</dt>
        <dd>{formatMoney(row.amount, row.currency)}</dd>
        <dt>جهت</dt>
        <dd>{row.direction}</dd>
        <dt>operationId</dt>
        <dd className="mono">{row.operationId}</dd>
        <dt>وضعیت</dt>
        <dd>posted (immutable)</dd>
        {row.memo ? (
          <>
            <dt>یادداشت</dt>
            <dd>{row.memo}</dd>
          </>
        ) : null}
      </dl>
      <p className="muted">برگشت = operation جدید · اصل تغییر نمی‌کند</p>
      {error ? <InlineError message={error} /> : null}
      <div className="actions">
        {reverseCmd ? (
          <Button type="button" onClick={() => void onReverse()} disabled={submitting}>
            {submitting ? "…" : "برگشت"}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onClose}>
          بستن
        </Button>
      </div>
    </div>
  );
}
