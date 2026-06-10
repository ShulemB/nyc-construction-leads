import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/layout/AppShell";
import { listSyncLogs } from "@/lib/import.functions";
import { ingestFilingBatch, ingestPermitBatch, getImportStatus } from "@/lib/properties.functions";
import { ingestLicenseBatch } from "@/lib/license.functions";
import { ingestSwoBatch } from "@/lib/swo.functions";
import {
  normalizeFilingRow, normalizePermitRow, normalizePropertyFromFiling, normalizePropertyFromPermit,
} from "@/lib/ingest/normalize";
import { normalizeLicense } from "@/lib/ingest/normalizeLicense";
import { normalizeSwoRow } from "@/lib/ingest/normalizeSwo";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Building2, FileSearch, IdCard, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fmtNumber } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({ meta: [{ title: "Import — PermitLeads" }] }),
  component: ImportPage,
});

const BATCH_SIZE = 250;
type Mode = "filings" | "permits" | "license" | "swo";

interface Stats { processed: number; added: number; updated: number; errored: number; skipped: number; }
const emptyStats = (): Stats => ({ processed: 0, added: 0, updated: 0, errored: 0, skipped: 0 });

function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("filings");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<Stats>(emptyStats());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const ingestFilings = useServerFn(ingestFilingBatch);
  const ingestPermits = useServerFn(ingestPermitBatch);
  const ingestLicense = useServerFn(ingestLicenseBatch);
  const ingestSwo = useServerFn(ingestSwoBatch);
  const logsFn = useServerFn(listSyncLogs);
  const statusFn = useServerFn(getImportStatus);
  const qc = useQueryClient();
  const { data: logsData } = useSuspenseQuery({ queryKey: ["sync-logs"], queryFn: () => logsFn() });
  const { data: statusData } = useSuspenseQuery({ queryKey: ["import-status"], queryFn: () => statusFn() });

  const switchMode = (m: Mode) => { setMode(m); setFile(null); setDone(false); setStats(emptyStats()); setProgress(0); };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setDone(false); setStats(emptyStats()); setProgress(0); }
  };

  const start = async () => {
    if (!file) return;
    setBusy(true); setDone(false);

    const isXlsx = /\.xlsx?$/i.test(file.name);
    const totalBytes = file.size;
    let syncLogId: string | null = null;
    let isFirst = true;
    let buffer: Array<Record<string, unknown>> = [];
    const acc = emptyStats();

    const callBatch = async (rows: Record<string, unknown>[], last: boolean) => {
      const base = { syncLogId, filename: file.name, isFirstBatch: isFirst, isLastBatch: last };
      if (mode === "filings") return ingestFilings({ data: { ...base, rows: rows as never } });
      if (mode === "permits") return ingestPermits({ data: { ...base, rows: rows as never } });
      if (mode === "swo") return ingestSwo({ data: { ...base, rows: rows as never } });
      return ingestLicense({ data: { ...base, rows: rows as never } });
    };

    const flush = async (last: boolean) => {
      if (buffer.length === 0 && !last) return;
      try {
        const res = await callBatch(buffer, last);
        syncLogId = res.syncLogId;
        acc.added += res.added; acc.updated += res.updated; acc.errored += res.errored;
        const r = res as Partial<Stats>;
        if (typeof r.skipped === "number") acc.skipped += r.skipped;
        acc.processed += buffer.length;
        setStats({ ...acc });
        isFirst = false;
        buffer = [];
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Batch failed");
        acc.errored += buffer.length; buffer = [];
      }
    };

    const normalize = (raw: Record<string, unknown>): Record<string, unknown> | null => {
      if (mode === "filings") {
        const property = normalizePropertyFromFiling(raw);
        const filing = normalizeFilingRow(raw);
        if (!property || !filing) return null;
        return { property, filing };
      }
      if (mode === "permits") {
        const property = normalizePropertyFromPermit(raw);
        const permit = normalizePermitRow(raw);
        if (!property || !permit) return null;
        return { property, permit };
      }
      if (mode === "swo") {
        return normalizeSwoRow(raw as Record<string, string>) as unknown as Record<string, unknown> | null;
      }
      return normalizeLicense(raw) as unknown as Record<string, unknown> | null;
    };

    if (isXlsx) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      for (let i = 0; i < rows.length; i++) {
        const n = normalize(rows[i]);
        if (n) buffer.push(n);
        if (buffer.length >= BATCH_SIZE) await flush(false);
        if (i % 100 === 0) setProgress(Math.min(99, Math.round((i / rows.length) * 100)));
      }
      await flush(true);
      setProgress(100);
    } else {
      await new Promise<void>((resolve, reject) => {
        Papa.parse<Record<string, unknown>>(file, {
          header: true, skipEmptyLines: true, worker: false,
          chunk: async (chunkResult, parser) => {
            parser.pause();
            for (const raw of chunkResult.data) {
              const n = normalize(raw);
              if (n) buffer.push(n);
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

    setBusy(false); setDone(true);
    qc.invalidateQueries();
    toast.success(`Import complete — ${acc.added} new, ${acc.updated} updated`);
  };

  return (
    <AppShell>
      <div className="border-b border-border bg-card/30 px-8 py-6">
        <h1 className="font-display text-2xl font-bold">Import</h1>
        <p className="text-sm text-muted-foreground">Upload NYC DOB data — properties are auto-populated from filings and permits</p>
      </div>

      <div className="grid gap-4 p-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard icon={Building2} label="Properties" total={statusData.properties.total} subtitle="auto-built from imports" />
        <StatusCard icon={FileSearch} label="Job Filings" total={statusData.filings.total} subtitle={statusData.filings.lastUpdated ? `updated ${new Date(statusData.filings.lastUpdated).toLocaleDateString()}` : "no imports yet"} />
        <StatusCard icon={FileSearch} label="Approved Permits" total={statusData.permits.total} subtitle={statusData.permits.lastUpdated ? `updated ${new Date(statusData.permits.lastUpdated).toLocaleDateString()}` : "no imports yet"} />
        <StatusCard icon={IdCard} label="License Info" total={statusData.licenses.total} subtitle={statusData.licenses.lastImportedAt ? `imported ${new Date(statusData.licenses.lastImportedAt).toLocaleDateString()}` : "no imports yet"} />
      </div>

      <div className="grid gap-6 px-8 pb-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex gap-2 rounded-lg bg-muted p-1">
            <ModeButton active={mode === "filings"} onClick={() => switchMode("filings")} disabled={busy}>Job Filings</ModeButton>
            <ModeButton active={mode === "permits"} onClick={() => switchMode("permits")} disabled={busy}>Approved Permits</ModeButton>
            <ModeButton active={mode === "license"} onClick={() => switchMode("license")} disabled={busy}>DOB License Info</ModeButton>
          </div>

          <h2 className="mt-5 font-display text-lg font-semibold">
            {mode === "filings" ? "Upload Job Application Filings" : mode === "permits" ? "Upload Approved Permits (.csv or .xlsx)" : "Upload DOB License Info"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "filings" ? (
              <>Export from <a href="https://data.cityofnewyork.us/Housing-Development/DOB-Job-Application-Filings/ic3t-wcy2" target="_blank" rel="noreferrer" className="text-brand hover:underline">NYC Open Data — Job Application Filings</a>. Property records are created and updated automatically.</>
            ) : mode === "permits" ? (
              <>Export from <a href="https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4" target="_blank" rel="noreferrer" className="text-brand hover:underline">NYC Open Data — DOB NOW Approved Permits</a>. Linked to properties by BIN.</>
            ) : (
              <>Export from <a href="https://data.cityofnewyork.us/Housing-Development/DOB-License-Info/t8hj-ruu2/data_preview" target="_blank" rel="noreferrer" className="text-brand hover:underline">NYC Open Data — DOB License Info</a>. Joined to filings/permits via license number.</>
            )}
          </p>

          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-background py-10 text-center transition-colors hover:border-brand hover:bg-brand-soft/30">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="font-medium">{file ? file.name : "Drop file here or click to browse"}</div>
              <div className="text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : mode === "permits" ? ".csv or .xlsx" : ".csv"}</div>
            </div>
            <input ref={inputRef} type="file" accept={mode === "permits" ? ".csv,.xlsx,text/csv" : ".csv,text/csv"} onChange={onPick} className="hidden" />
          </label>

          {file && !done && (
            <Button onClick={start} disabled={busy} className="mt-4 w-full">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : <>Start import</>}
            </Button>
          )}

          {(busy || done) && (
            <div className="mt-6 space-y-2">
              <Progress value={progress} />
              <div className="grid grid-cols-5 gap-2 text-center text-sm">
                <Mini label="Processed" value={fmtNumber(stats.processed)} />
                <Mini label="New" value={fmtNumber(stats.added)} accent="brand" />
                <Mini label="Updated" value={fmtNumber(stats.updated)} />
                <Mini label="Skipped" value={fmtNumber(stats.skipped)} />
                <Mini label="Errored" value={fmtNumber(stats.errored)} accent={stats.errored ? "destructive" : undefined} />
              </div>
            </div>
          )}

          {done && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-brand-soft p-3 text-sm text-brand">
              <CheckCircle2 className="h-4 w-4" /> Import complete. Head to <a href="/properties" className="ml-1 font-medium underline">Properties</a>.
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
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs uppercase">
                      {l.source === "permits_csv_upload" ? "permits" : l.source === "license_csv_upload" ? "license" : "filings"}
                    </span>
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

function ModeButton({ active, onClick, disabled, children }: { active: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
      {children}
    </button>
  );
}

function StatusCard({ icon: Icon, label, total, subtitle }: { icon: React.ComponentType<{ className?: string }>; label: string; total: number; subtitle: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span></div>
      <div className="mt-2 font-display text-2xl font-bold">{fmtNumber(total)}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
    </div>
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
