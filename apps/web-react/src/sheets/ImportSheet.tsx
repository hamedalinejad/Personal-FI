import React, { useState } from "react";
import { useGateway } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

export function ImportSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createOnly() {
    setError(null);
    const res = await gateway.execute("import.createBatch", {
      sourceProvider: "manual_json",
      label: "user-batch",
    });
    if (!res.ok) {
      setError(res.message || res.code);
      return;
    }
    setStatus(`batch created: ${(res.data as any)?.batchId} — هنوز commit کسب‌وکار نیست`);
  }

  return (
    <div className="stack" dir="rtl">
      <h2>ورود داده</h2>
      <p className="muted">
        فقط مرحلهٔ batch باز می‌شود. commit بدون mapping معتبر انجام نمی‌شود (جلوگیری از false-green).
      </p>
      {status ? <p>{status}</p> : null}
      {error ? <InlineError message={error} /> : null}
      <Button type="button" onClick={() => void createOnly()}>
        ایجاد batch
      </Button>
      <Button type="button" variant="ghost" onClick={onClose}>
        بستن
      </Button>
    </div>
  );
}
