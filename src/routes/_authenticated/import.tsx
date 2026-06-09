import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/layout/AppShell";
import { ingestBatch, listSyncLogs } from "@/lib/import.functions";
import { ingestPermitBatch } from "@/lib/permits.functions";
import { ingestLicenseBatch } from "@/lib/license.functions";
import { normalizeFiling } from "@/lib/ingest/normalize";
import { normalizePermit } from "@/lib/ingest/normalizePermit";
import { normalizeLicense } from "@/lib/ingest/normalizeLicense";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fmtNumber } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({ meta: [{ title: "Import — PermitLeads" }] }),
  component: ImportPage,
});

const BATCH_SIZE = 250;
type Mode = "jobs" | "permits" | "license";

interface Stats {
  processed: number;
  added: number;
  updated: number;
  errored: number;
  matched: number;
  unmatched: number;
  ambiguous: number;
  duplicates: number;
}

function emptyStats(): Stats {
  return { processed: 0, added: 0, updated: 0, errored: 0, matched: 0, unmatched: 0, ambiguous: 0, duplicates: 0 };
}

function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("jobs");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<Stats>(emptyStats());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const ingestJobsFn = useServerFn(ingestBatch);
  const ingestPermitsFn = useServerFn(ingestPermitBatch);
  const ingestLicenseFn = useServerFn(ingestLicenseBatch);
  const logsFn = useServerFn(listSyncLogs);
  const qc = useQueryClient();
  const { data: logsData } = useSuspenseQuery({ queryKey: ["sync-logs"], queryFn: () => logsFn() });

  const switchMode = (m: Mode) => {
    setMode(m);
    setFile(null);
    setDone(false);
    setStats(emptyStats());
    setProgress(0);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setDone(false);
      setStats(emptyStats());
      setProgress(0);
    }
  };

  const start = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);

    const isXlsx = /\.xlsx?$/i.test(file.name);
    const totalBytes = file.size;
    let syncLogId: string | null = null;
    let isFirst = true;
    let buffer: Array<Record<string, unknown>> = [];
    const acc: Stats = emptyStats();

    const callBatch = async (rows: Record<string, unknown>[], last: boolean) => {
      if (mode === "jobs") {
        return ingestJobsFn({
          data: { rows: rows as never, syncLogId, filename: file.name, isFirstBatch: isFirst, isLastBatch: last },
        });
      }
      if (mode === "license") {
        return ingestLicenseFn({
          data: { rows: rows as never, syncLogId, filename: file.name, isFirstBatch: isFirst, isLastBatch: last },
        });
      }
      return ingestPermitsFn({
        data: { rows: rows as never, syncLogId, filename: file.name, isFirstBatch: isFirst, isLastBatch: last },
      });
    };

    const flush = async (last: boolean) => {
      if (buffer.length === 0 && !last) return;
      try {
        const res = await callBatch(buffer, last);
        syncLogId = res.syncLogId;
        acc.added += res.added; acc.updated += res.updated; acc.errored += res.errored;
        const r = res as Partial<Stats>;
        if (typeof r.matched === "number") acc.matched += r.matched;
        if (typeof r.unmatched === "number") acc.unmatched += r.unmatched;
        if (typeof r.ambiguous === "number") acc.ambiguous += r.ambiguous;
        if (typeof r.duplicates === "number") acc.duplicates += r.duplicates;
        acc.processed += buffer.length;
        setStats({ ...acc });
        isFirst = false;
        buffer = [];
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Batch failed");
        acc.errored += buffer.length;
        buffer = [];
      }
    };

    const normalize = mode === "jobs" ? normalizeFiling : mode === "license" ? normalizeLicense : normalizePermit;

    if (isXlsx) {
      // XLSX: read whole file, parse first sheet, batch in chunks
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      for (let i = 0; i < rows.length; i++) {
        const n = normalize(rows[i]);
        if (n) buffer.push(n as unknown as Record<string, unknown>);
        if (buffer.length >= BATCH_SIZE) await flush(false);
        if (i % 100 === 0) setProgress(Math.min(99, Math.round((i / rows.length) * 100)));
      }
      await flush(true);
      setProgress(100);
    } else {
      await new Promise<void>((resolve, reject) => {
        Papa.parse<Record<string, unknown>>(file, {
          header: true,
          skipEmptyLines: true,
          worker: false,
          chunk: async (chunkResult, parser) => {
            parser.pause();
            for (const raw of chunkResult.data) {
              const normalized = normalize(raw);
              if (normalized) buffer.push(normalized as unknown as Record<string, unknown>);
              if (buffer.length >= BATCH_SIZE) await flush(false);
            }
            if (chunkResult.meta.cursor && totalBytes > 0) {
              setProgress(Math.min(99, Math.round((chunkResult.meta.cursor / totalBytes) * 100)));
            }
            parser.resume();
          },
          complete: async () => { await flush(true); setProgress(100); resolve(); },
          error: (err) => reject(err),
        });
      });
    }

    setBusy(false);
    setDone(true);
    qc.invalidateQueries();
    toast.success(`Import complete — ${acc.added} new, ${acc.updated} updated`);
  };

  return (
    <AppShell>
      <div className="border-b border-border bg-card/30 px-8 py-6">
        <h1 className="font-display text-2xl font-bold">Import</h1>
        <p className="text-sm text-muted-foreground">Upload NYC DOB data — Job Application Filing or Approved Permits</p>
      </div>

      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex gap-2 rounded-lg bg-muted p-1">
            <button
              onClick={() => switchMode("jobs")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === "jobs" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              disabled={busy}
            >
              Job Filings
            </button>
            <button
              onClick={() => switchMode("permits")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === "permits" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              disabled={busy}
            >
              Approved Permits
            </button>
            <button
              onClick={() => switchMode("license")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === "license" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              disabled={busy}
            >
              DOB License Info
            </button>
          </div>

          <h2 className="mt-5 font-display text-lg font-semibold">
            {mode === "jobs" ? "Upload Job Application Filing CSV" : mode === "license" ? "Upload DOB License Info CSV" : "Upload Approved Permits (.csv or .xlsx)"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "jobs" ? (
              <>Export from{" "}
                <a href="https://data.cityofnewyork.us/Housing-Development/DOB-Job-Application-Filings/ic3t-wcy2" target="_blank" rel="noreferrer" className="text-brand hover:underline">
                  NYC Open Data — DOB Job Application Filings
                </a>.
              </>
            ) : mode === "license" ? (
              <>Enrich leads with licensee contact details — name, business, address, phone, and email. Export from{" "}
                <a href="https://data.cityofnewyork.us/Housing-Development/DOB-License-Info/t8hj-ruu2/data_preview" target="_blank" rel="noreferrer" className="text-brand hover:underline">
                  NYC Open Data — DOB License Info
                </a>.
              </>
            ) : (
              <>Export from{" "}
                <a href="https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4" target="_blank" rel="noreferrer" className="text-brand hover:underline">
                  NYC Open Data — DOB NOW Build Approved Permits
                </a>. Permits are linked to filings by Job Filing Number, then BIN, then BBL.
              </>
            )}
          </p>

          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-background py-10 text-center transition-colors hover:border-brand hover:bg-brand-soft/30">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="font-medium">{file ? file.name : "Drop file here or click to browse"}</div>
              <div className="text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : mode === "permits" ? ".csv or .xlsx" : ".csv"}</div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={mode === "permits" ? ".csv,.xlsx,text/csv" : ".csv,text/csv"}
              onChange={onPick}
              className="hidden"
            />
          </label>

          {file && !done && (
            <Button onClick={start} disabled={busy} className="mt-4 w-full">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : <>Start import</>}
            </Button>
          )}

          {(busy || done) && (
            <div className="mt-6 space-y-2">
              <Progress value={progress} />
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <Mini label="Processed" value={fmtNumber(stats.processed)} />
                <Mini label="New" value={fmtNumber(stats.added)} accent="brand" />
                <Mini label="Updated" value={fmtNumber(stats.updated)} />
                <Mini label="Errored" value={fmtNumber(stats.errored)} accent={stats.errored ? "destructive" : undefined} />
                {mode === "permits" && (
                  <>
                    <Mini label="Matched" value={fmtNumber(stats.matched)} accent="brand" />
                    <Mini label="Unmatched" value={fmtNumber(stats.unmatched)} />
                    <Mini label="Ambiguous" value={fmtNumber(stats.ambiguous)} />
                    <Mini label="Duplicates" value={fmtNumber(stats.duplicates)} />
                  </>
                )}
              </div>
            </div>
          )}

          {done && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-brand-soft p-3 text-sm text-brand">
              <CheckCircle2 className="h-4 w-4" /> Import complete. Head to <a href="/filings" className="ml-1 font-medium underline">Filings</a>.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Recent imports</h2>
          <ul className="mt-4 divide-y divide-border">
            {logsData.logs.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No imports yet.</li>}
            {logsData.logs.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-3 text-sm">
                {l.status === "success" || l.status === "completed_with_errors" ? (
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${l.rows_errored > 0 ? "text-score-warm" : "text-brand"}`} />
                ) : l.status === "running" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs uppercase">{l.source === "permits_csv_upload" ? "permits" : "jobs"}</span>
                    {l.filename ?? l.source}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(l.started_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    {" · "}{fmtNumber(l.rows_added)} new · {fmtNumber(l.rows_updated)} updated
                    {l.rows_errored > 0 && ` · ${l.rows_errored} errors`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: "brand" | "destructive" }) {
  const color = accent === "brand" ? "text-brand" : accent === "destructive" ? "text-destructive" : "";
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <div className={`font-mono text-sm font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
