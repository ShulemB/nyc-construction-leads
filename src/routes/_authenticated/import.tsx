import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import Papa from "papaparse";
import { AppShell } from "@/components/layout/AppShell";
import { ingestBatch, listSyncLogs } from "@/lib/import.functions";
import { normalizeFiling } from "@/lib/ingest/normalize";
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

function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ processed: 0, added: 0, updated: 0, errored: 0 });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const ingestFn = useServerFn(ingestBatch);
  const logsFn = useServerFn(listSyncLogs);
  const qc = useQueryClient();
  const { data: logsData } = useSuspenseQuery({ queryKey: ["sync-logs"], queryFn: () => logsFn() });

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setDone(false);
      setStats({ processed: 0, added: 0, updated: 0, errored: 0 });
      setProgress(0);
    }
  };

  const start = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);

    const totalBytes = file.size;
    let syncLogId: string | null = null;
    let isFirst = true;
    let buffer: Array<Record<string, unknown>> = [];
    let processed = 0;
    let added = 0, updated = 0, errored = 0;

    const flush = async (last: boolean) => {
      if (buffer.length === 0 && !last) return;
      try {
        const res = await ingestFn({
          data: {
            rows: buffer as never,
            syncLogId,
            filename: file.name,
            isFirstBatch: isFirst,
            isLastBatch: last,
          },
        });
        syncLogId = res.syncLogId;
        added += res.added; updated += res.updated; errored += res.errored;
        processed += buffer.length;
        setStats({ processed, added, updated, errored });
        isFirst = false;
        buffer = [];
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Batch failed");
        errored += buffer.length;
        buffer = [];
      }
    };

    await new Promise<void>((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        worker: false,
        chunk: async (chunkResult, parser) => {
          parser.pause();
          for (const raw of chunkResult.data) {
            const normalized = normalizeFiling(raw);
            if (normalized) buffer.push(normalized as unknown as Record<string, unknown>);
            if (buffer.length >= BATCH_SIZE) {
              await flush(false);
            }
          }
          if (chunkResult.meta.cursor && totalBytes > 0) {
            setProgress(Math.min(99, Math.round((chunkResult.meta.cursor / totalBytes) * 100)));
          }
          parser.resume();
        },
        complete: async () => {
          await flush(true);
          setProgress(100);
          resolve();
        },
        error: (err) => reject(err),
      });
    });

    setBusy(false);
    setDone(true);
    qc.invalidateQueries();
    toast.success(`Import complete — ${added} new, ${updated} updated`);
  };

  return (
    <AppShell>
      <div className="border-b border-border bg-card/30 px-8 py-6">
        <h1 className="font-display text-2xl font-bold">Import</h1>
        <p className="text-sm text-muted-foreground">Upload an NYC DOB Job Application export (CSV)</p>
      </div>

      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Upload CSV</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get the export from{" "}
            <a href="https://data.cityofnewyork.us/Housing-Development/DOB-Job-Application-Filings/ic3t-wcy2" target="_blank" rel="noreferrer" className="text-brand hover:underline">
              NYC Open Data — DOB Job Application Filings
            </a>
            . Export → CSV.
          </p>

          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-background py-10 text-center transition-colors hover:border-brand hover:bg-brand-soft/30">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="font-medium">{file ? file.name : "Drop CSV here or click to browse"}</div>
              <div className="text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "Up to ~500 MB"}</div>
            </div>
            <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onPick} className="hidden" />
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
                  <div className="truncate">{l.filename ?? l.source}</div>
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
