import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const rowSchema = z.object({
  license_number: z.number().int(),
}).passthrough();

const batchSchema = z.object({
  rows: z.array(rowSchema).max(1000),
  syncLogId: z.string().uuid().nullable(),
  filename: z.string().max(255).optional(),
  isFirstBatch: z.boolean().default(false),
  isLastBatch: z.boolean().default(false),
});

export const ingestLicenseBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => batchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context;

    let syncLogId = data.syncLogId;

    if (data.isFirstBatch) {
      const { data: log, error: logErr } = await supabaseAdmin
        .from("sync_log")
        .insert({
          user_id: userId,
          source: "license_csv_upload",
          filename: data.filename ?? null,
          status: "running",
        })
        .select("id")
        .single();
      if (logErr) throw new Error(logErr.message);
      syncLogId = log.id;
    }

    // Detect existing license_sl_no values to count added vs updated.
    const slNos = data.rows
      .map((r) => (r as Record<string, unknown>).license_sl_no as number | null)
      .filter((v): v is number => typeof v === "number");

    let existingSet = new Set<number>();
    if (slNos.length) {
      const { data: existing } = await supabaseAdmin
        .from("dob_license_info")
        .select("license_sl_no")
        .in("license_sl_no", slNos);
      existingSet = new Set((existing ?? []).map((e: { license_sl_no: number | null }) => e.license_sl_no!).filter(Boolean));
    }

    let added = 0;
    let updated = 0;
    for (const r of data.rows) {
      const sl = (r as Record<string, unknown>).license_sl_no as number | null;
      if (sl != null && existingSet.has(sl)) updated++;
      else added++;
    }

    let errored = 0;
    const { error } = await supabaseAdmin
      .from("dob_license_info")
      .upsert(data.rows as never, { onConflict: "license_sl_no" });
    if (error) {
      errored = data.rows.length;
      console.error("[ingest license]", error);
    }

    if (syncLogId) {
      const { data: current } = await supabaseAdmin
        .from("sync_log").select("rows_added,rows_updated,rows_errored").eq("id", syncLogId).single();
      await supabaseAdmin.from("sync_log").update({
        rows_added: (current?.rows_added ?? 0) + added - Math.min(errored, added),
        rows_updated: (current?.rows_updated ?? 0) + updated,
        rows_errored: (current?.rows_errored ?? 0) + errored,
        ...(data.isLastBatch
          ? { status: errored ? "completed_with_errors" : "success", completed_at: new Date().toISOString() }
          : {}),
      }).eq("id", syncLogId);
    }

    return { syncLogId, added, updated, errored };
  });

export const getLicenseByNumber = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ licenseNumber: z.union([z.string(), z.number()]) }).parse(d))
  .handler(async ({ data, context }) => {
    const n = typeof data.licenseNumber === "number"
      ? data.licenseNumber
      : parseInt(String(data.licenseNumber).replace(/[^0-9-]/g, ""), 10);
    if (!Number.isFinite(n)) return { license: null };

    const { data: rows, error } = await context.supabase
      .from("dob_license_info")
      .select("*")
      .eq("license_number", n)
      .order("imported_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    return { license: rows?.[0] ?? null };
  });

export const getLicenseStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await context.supabase
      .from("dob_license_info")
      .select("*", { count: "exact", head: true });
    const { data: latest } = await context.supabase
      .from("dob_license_info")
      .select("imported_at")
      .order("imported_at", { ascending: false })
      .limit(1);
    return {
      totalRecords: count ?? 0,
      lastImportedAt: latest?.[0]?.imported_at ?? null,
    };
  });
