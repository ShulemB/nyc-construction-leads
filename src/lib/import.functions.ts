import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const filingSchema = z.object({
  job_number: z.string().min(1),
}).passthrough();

const batchSchema = z.object({
  rows: z.array(filingSchema).min(1).max(1000),
  syncLogId: z.string().uuid().nullable(),
  filename: z.string().max(255).optional(),
  isFirstBatch: z.boolean().default(false),
  isLastBatch: z.boolean().default(false),
});

export const ingestBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => batchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context;

    let syncLogId = data.syncLogId;

    // On first batch: reset is_new_this_sync flag and create a sync log entry
    if (data.isFirstBatch) {
      await supabaseAdmin.from("filings").update({ is_new_this_sync: false }).eq("is_new_this_sync", true);

      const { data: log, error: logErr } = await supabaseAdmin
        .from("sync_log")
        .insert({
          user_id: userId,
          source: "csv_upload",
          filename: data.filename ?? null,
          status: "running",
        })
        .select("id")
        .single();
      if (logErr) throw new Error(logErr.message);
      syncLogId = log.id;
    }

    // Mark all incoming rows as new (will be reset on existing duplicates via merge)
    const rowsToUpsert = data.rows.map((r) => ({ ...r, is_new_this_sync: true })) as Array<Record<string, unknown> & { job_number: string; doc_number?: string | null }>;

    // Detect which job_number+doc_number combos already exist to count added vs updated
    const keys = rowsToUpsert.map((r) => ({
      job_number: r.job_number as string,
      doc_number: (r.doc_number as string | null) ?? null,
    }));
    const jobNums = [...new Set(keys.map((k) => k.job_number))];
    const { data: existing } = await supabaseAdmin
      .from("filings")
      .select("job_number,doc_number")
      .in("job_number", jobNums);

    const existingSet = new Set((existing ?? []).map((e) => `${e.job_number}|${e.doc_number ?? ""}`));
    let added = 0;
    let updated = 0;
    for (const k of keys) {
      if (existingSet.has(`${k.job_number}|${k.doc_number ?? ""}`)) updated++;
      else added++;
    }

    // For updates we don't want to flip is_new_this_sync to true. Insert new ones with true; update existing with false.
    const newRows = rowsToUpsert.filter((r) =>
      !existingSet.has(`${r.job_number}|${(r.doc_number as string | null) ?? ""}`)
    );
    const updRows = rowsToUpsert
      .filter((r) => existingSet.has(`${r.job_number}|${(r.doc_number as string | null) ?? ""}`))
      .map((r) => ({ ...r, is_new_this_sync: false }));

    let errored = 0;
    if (newRows.length) {
      const { error } = await supabaseAdmin.from("filings").upsert(newRows as never, { onConflict: "job_number,doc_number" });
      if (error) { errored += newRows.length; console.error("[ingest new]", error); }
    }
    if (updRows.length) {
      const { error } = await supabaseAdmin.from("filings").upsert(updRows as never, { onConflict: "job_number,doc_number" });
      if (error) { errored += updRows.length; console.error("[ingest upd]", error); }
    }

    // Update sync log running totals
    if (syncLogId) {
      const { data: current } = await supabaseAdmin
        .from("sync_log").select("rows_added,rows_updated,rows_errored").eq("id", syncLogId).single();
      await supabaseAdmin.from("sync_log").update({
        rows_added: (current?.rows_added ?? 0) + added - (errored ? Math.min(errored, added) : 0),
        rows_updated: (current?.rows_updated ?? 0) + updated,
        rows_errored: (current?.rows_errored ?? 0) + errored,
        ...(data.isLastBatch
          ? { status: errored ? "completed_with_errors" : "success", completed_at: new Date().toISOString() }
          : {}),
      }).eq("id", syncLogId);
    }

    return { syncLogId, added, updated, errored };
  });

export const listSyncLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sync_log")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return { logs: data ?? [] };
  });
