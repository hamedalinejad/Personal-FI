import React, { useEffect, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { Button } from "../components/common/Button";

export function LicenseSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    void gateway.execute("meta.license", {}).then((r) => {
      if (r.ok) setInfo(r.data);
    });
  }, [gateway]);

  return (
    <div className="stack" dir="rtl">
      <h2>مجوز</h2>
      {info ? (
        <pre className="code-block">{JSON.stringify(info, null, 2)}</pre>
      ) : (
        <p className="muted">در حال بارگذاری…</p>
      )}
      <Button type="button" onClick={onClose}>
        بستن
      </Button>
    </div>
  );
}
