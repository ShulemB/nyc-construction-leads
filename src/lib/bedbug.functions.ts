import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const bedbugRow = z.object({
  id: z.string().min(1).max(500),
  bin: z.string().min(1).max(50),
  building_id: z.string().max(100).nullable(),
  registration_id: z.string().max(100).nullable(),
  borough: z.string().max(100).nullable(),
  house_number: z.string().max(100).nullable(),
  street_name: z.string().max(255).nullable(),
  postcode: z.string().max(20).nullable(),
  dwelling_units: z.number().int().nullable(),
  infested_unit_count: z.number().int().nullable(),
  eradicated_unit_count: z.number().int().nullable(),
  re_infested_unit_count: z.number().int().nullable(),
  filing_date: z.string().nullable(),
  filing_period_start_date: z.string().nullable(),
  filing_period_end_date: z.string().nullable(),
  latitude: z.string().max(50).nullable(),
  longitude: z.string().max(50).nullable(),
  community_board: z.string().max(100).nullable(),
  council_district: z.string().max(100).nullable(),
  census_tract_2010: z.string().max(100).nullable(),
  bbl: z.string().max(50).nullable(),
  nta: z.string().max(100).nullable(),
});

const batchSchema = z.object({
  rows: z.array(bedbugRow).max(1000),
  syncLogId: z.string().uuid().nullable(),
  filename: z.string().max(255).optional(),
  isFirstBatch: z.boolean().default(false),
  isLastBatch: z.boolean().default(false),
});

export const ingestBedbugBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => batchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let syncLogId = data.syncLogId;
    if (data.isFirstBatch) {
      const { data: log, error } = await supabaseAdmin
        .from("sync_log")
        .insert({
          user_id: context.userId,
          source: "bedbug_xlsx_upload",
          filename: data.filename ?? null,
          status: "running",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      syncLogId = log.id as string;
    }

    // Dedupe within batch by deterministic id
    const seen = new Set<string>();
    const deduped = data.rows.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    let added = 0, updated = 0, errored = 0;
    if (deduped.length) {
      const ids = deduped.map((r) => r.id);
      const { data: existing } = await supabaseAdmin
        .from("bed_bug_reports")
        .select("id")
        .in("id", ids);
      const existingSet = new Set((existing ?? []).map((e) => e.id as string));
      for (const r of deduped) (existingSet.has(r.id) ? updated++ : added++);

      const { error } = await supabaseAdmin
        .from("bed_bug_reports")
        .upsert(deduped as never, { onConflict: "id" });
      if (error) {
        errored = deduped.length;
        added = 0;
        updated = 0;
        console.error("[ingest bedbug]", error);
      }
    }

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

    return { syncLogId, added, updated, errored, skipped: data.rows.length - deduped.length };
  });

export const listBedbugByBin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ bin: z.string().min(1).max(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("bed_bug_reports")
      .select("*")
      .eq("bin", data.bin)
      .order("filing_date", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return { reports: rows ?? [] };
  });
