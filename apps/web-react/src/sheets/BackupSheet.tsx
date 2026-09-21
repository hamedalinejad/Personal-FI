/**
 * Backup / restore — browser bytes contract only (BUG-P0-07).
 * Never filesystem paths in UI.
 * Corrupt restore must be rejected without touching live data (BUG-P0-08).
 */
import React, { useRef, useState } from "react";
import { useGateway } from "../app/AppProviders";

type BackupPackage = {
  bytes: number[];
  checksum: string;
  formatVersion: string;
  schemaVersion?: string;
  bookId?: string | null;
  label?: string | null;
  createdAt?: string;
  magic?: string;
};

export function BackupSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function doBackup() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const host = (gateway as unknown as { backup?: (label?: string) => Promise<unknown> });
      // Prefer dedicated backup on host if present; else execute command
      let res: { ok?: boolean; success?: boolean; data?: BackupPackage; code?: string; message?: string; errors?: { code: string }[] };
      if (typeof (host as { backup?: Function }).backup === "function") {
        res = (await (host as { backup: Function }).backup("manual")) as typeof res;
      } else {
        res = (await gateway.execute("backup.create", { label: "manual" })) as typeof res;
      }
      const ok = res.ok === true || res.success === true;
      const pkg = res.data;
      if (!ok || !pkg?.bytes) {
        setError(res.code || res.errors?.[0]?.code || res.message || "BACKUP_FAILED");
        return;
      }
      // Download as JSON package (bytes + checksum)
      const blob = new Blob([JSON.stringify(pkg)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `personal-fi-backup-${pkg.createdAt || Date.now()}.pfi.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(`پشتیبان گرفته شد — checksum ${pkg.checksum}`);
    } catch (e) {
      setError(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function doRestore(file: File) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const text = await file.text();
      let pkg: BackupPackage;
      try {
        pkg = JSON.parse(text);
      } catch {
        setError("BACKUP_PARSE_FAILED");
        return;
      }
      if (!pkg.bytes || !Array.isArray(pkg.bytes)) {
        setError("BACKUP_INVALID: missing bytes array");
        return;
      }
      const res = (await gateway.execute("backup.restore", pkg)) as {
        ok?: boolean;
        success?: boolean;
        code?: string;
        message?: string;
        errors?: { code: string; message?: string }[];
      };
      const ok = res.ok === true || res.success === true;
      if (!ok) {
        // Live DB must remain untouched
        setError(
          res.code ||
            res.errors?.[0]?.code ||
            res.message ||
            "RESTORE_REJECTED"
        );
        return;
      }
      setStatus("بازیابی موفق — لطفاً صفحه را یک‌بار رفرش کنید");
    } catch (e) {
      setError(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form sheet-backup" dir="rtl" lang="fa" onSubmit={(e) => e.preventDefault()}>
      <h2 id="sheet-title">پشتیبان و بازیابی</h2>
      <p className="muted">قرارداد مرورگر: فقط bytes + checksum — بدون مسیر فایل‌سیستم</p>

      <div className="actions">
        <button type="button" disabled={busy} onClick={() => void doBackup()}>
          دانلود پشتیبان
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          بازیابی از فایل
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.pfi.json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doRestore(f);
          }}
        />
        <button type="button" onClick={onClose}>
          بستن
        </button>
      </div>

      {status ? (
        <p role="status" className="ok">
          {status}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export default BackupSheet;
