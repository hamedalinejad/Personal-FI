import React, { useRef, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { Button } from "../components/common/Button";
import { InlineError } from "../components/common/InlineError";

type Phase =
  | "select"
  | "preview"
  | "map"
  | "validate"
  | "commit"
  | "done";

/** Customer import flow — raw preserved; commit via public API only */
export function ImportExportSheet({ onClose }: { onClose: () => void }) {
  const gateway = useGateway();
  const [phase, setPhase] = useState<Phase>("select");
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<unknown[]>([]);
  const [unknownFields, setUnknownFields] = useState<string[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [counts, setCounts] = useState({ imported: 0, rejected: 0, deduped: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setError(null);
    const text = await file.text();
    setRawText(text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // CSV lines as raw records
      parsed = text.split(/\r?\n/).filter(Boolean).map((line, i) => ({ line, _row: i }));
    }
    const list = Array.isArray(parsed) ? parsed : [parsed];
    setRows(list);
    const keys = new Set<string>();
    for (const r of list) {
      if (r && typeof r === "object") Object.keys(r as object).forEach((k) => keys.add(k));
    }
    setUnknownFields([...keys]);
    setPhase("preview");
  }

  async function onCommit() {
    setError(null);
    setPhase("commit");
    // Host may expose import.ingest; fallback status
    const res = await gateway.execute("import.ingestBatch", {
      payload: {
        sourceProvider: "ui_file",
        sourceType: "json",
        records: rows,
        rawText,
      },
    });
    if (!res.ok) {
      // soft path: mark as staged preview only
      setError(
        res.code === "COMMAND_NOT_WIRED"
          ? "Import commit از طریق pipeline Core هنوز در gateway سیمی نشده — raw در UI نگه داشته شد."
          : res.message || res.code,
      );
      setPhase("preview");
      return;
    }
    const data = res.data as { batchId?: string; imported?: number; rejected?: number; deduped?: number };
    setBatchId(data.batchId || null);
    setCounts({
      imported: data.imported || 0,
      rejected: data.rejected || 0,
      deduped: data.deduped || 0,
    });
    setPhase("done");
  }

  return (
    <div className="form">
      <h2 id="sheet-title">Import / Export</h2>
      <p className="muted">phase: {phase}</p>
      {phase === "select" ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <p className="muted">raw · hash · unknown fields · map · dedupe · commit via API</p>
        </>
      ) : null}
      {phase === "preview" || phase === "map" || phase === "validate" ? (
        <>
          <p>rows: {rows.length}</p>
          <p className="muted">fields: {unknownFields.join(", ") || "—"}</p>
          <pre style={{ maxHeight: 120, overflow: "auto", fontSize: 11 }}>
            {JSON.stringify(rows.slice(0, 3), null, 2)}
          </pre>
          <Button type="button" onClick={() => void onCommit()}>
            Commit (public API)
          </Button>
        </>
      ) : null}
      {phase === "done" ? (
        <p>
          batch {batchId} · imported {counts.imported} · rejected {counts.rejected} · deduped{" "}
          {counts.deduped}
        </p>
      ) : null}
      {error ? <InlineError message={error} /> : null}
      <Button type="button" variant="ghost" onClick={onClose}>
        بستن
      </Button>
    </div>
  );
}
