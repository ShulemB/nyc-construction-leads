import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const swoRow = z.object({
  complaint_number: z.string().min(1).max(100),
  bin: z.string().min(1).max(50),
  borough_name: z.string().max(100).nullable(),
  disposition_code: z.string().max(100).nullable(),
  disposition_code_desc: z.string().max(500).nullable(),
  disposition_category: z.string().max(200).nullable(),
  last_disposition_date: z.string().nullable(),
  last_disposition_year: z.number().int().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  address: z.string().max(500).nullable(),
  community_board: z.string().max(100).nullable(),
});

const batchSchema = z.object({
  rows: z.array(swoRow).max(1000),
  syncLogId: z.string().uuid().nullable(),
  filename: z.string().max(255).optional(),
  isFirstBatch: z.boolean().default(false),
  isLastBatch: z.boolean().default(false),
});

export const ingestSwoBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => batchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // sync_log
    let syncLogId = data.syncLogId;
    if (data.isFirstBatch) {
      const { data: log, error } = await supabaseAdmin
        .from("sync_log")
        .insert({
          user_id: context.userId,
          source: "swo_xlsx_upload",
          filename: data.filename ?? null,
          status: "running",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      syncLogId = log.id as string;
    }

    // Dedupe by complaint_number within the batch
    const seen = new Set<string>();
    const deduped = data.rows.filter((r) => {
      if (seen.has(r.complaint_number)) return false;
      seen.add(r.complaint_number);
      return true;
    });

    // Pre-filter: only keep rows whose bin exists in properties
    const bins = Array.from(new Set(deduped.map((r) => r.bin)));
    let validBins = new Set<string>();
    if (bins.length) {
      const { data: existing, error } = await supabaseAdmin
        .from("properties")
        .select("bin")
        .in("bin", bins);
      if (error) throw new Error(error.message);
      validBins = new Set((existing ?? []).map((e) => e.bin as string));
    }
    const eligible = deduped.filter((r) => validBins.has(r.bin));
    const skipped = data.rows.length - eligible.length;

    // Determine added vs updated
    let added = 0, updated = 0, errored = 0;
    if (eligible.length) {
      const cnums = eligible.map((r) => r.complaint_number);
      const { data: existing } = await supabaseAdmin
        .from("stop_work_orders")
        .select("complaint_number")
        .in("complaint_number", cnums);
      const existingSet = new Set((existing ?? []).map((e) => e.complaint_number as string));
      for (const r of eligible) (existingSet.has(r.complaint_number) ? updated++ : added++);

      const { error } = await supabaseAdmin
        .from("stop_work_orders")
        .upsert(eligible as never, { onConflict: "complaint_number" });
      if (error) { errored = eligible.length; added = 0; updated = 0; console.error("[ingest swo]", error); }
    }

    // bump sync_log
    if (syncLogId) {
      const { data: current } = await supabaseAdmin
        .from("sync_log")
        .select("rows_added,rows_updated,rows_errored")
        .eq("id", syncLogId)
        .single();
      await supabaseAdmin.from("sync_log").update({
        rows_added: (current?.rows_added ?? 0) + added,
        rows_updated: (current?.rows_updated ?? 0) + updated,
        rows_errored: (current?.rows_errored ?? 0) + errored,
        ...(data.isLastBatch
          ? { status: errored ? "completed_with_errors" : "success", completed_at: new Date().toISOString() }
          : {}),
      }).eq("id", syncLogId);
    }

    return { syncLogId, added, updated, errored, skipped };
  });

export const listSwosByBin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ bin: z.string().min(1).max(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("stop_work_orders")
      .select("*")
      .eq("bin", data.bin)
      .order("last_disposition_date", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return { swos: rows ?? [] };
  });
