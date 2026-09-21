import React from "react";
import { Button } from "../components/common/Button";

/** UI scaffold: sheet exists in IA even when command is not wired yet. */
export function StubSheet({
  title,
  sheetId,
  description,
  onClose,
}: {
  title: string;
  sheetId: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <div className="stack" dir="rtl">
      <h2>{title}</h2>
      <p className="muted">{description || "این عملیات در معماری محصول تعریف شده است."}</p>
      <p className="muted" style={{ fontSize: "0.8rem" }}>
        شناسه: <code>{sheetId}</code>
      </p>
      <p className="error" style={{ margin: 0 }}>
        فرمان هنوز در این نسخه متصل نیست — UI برای جلوگیری از گم‌شدن قابلیت نمایش داده می‌شود.
      </p>
      <Button type="button" variant="ghost" onClick={onClose}>
        بستن
      </Button>
    </div>
  );
}
