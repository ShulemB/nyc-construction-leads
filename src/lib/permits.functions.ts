import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const permitSchema = z.object({}).passthrough();

const batchSchema = z.object({
  rows: z.array(permitSchema).max(1000),
  syncLogId: z.string().uuid().nullable(),
  filename: z.string().max(255).optional(),
  isFirstBatch: z.boolean().default(false),
  isLastBatch: z.boolean().default(false),
});

interface PermitRow {
  work_permit: string | null;
  sequence_number: string | null;
  tracking_number: string | null;
  job_filing_number: string | null;
  bin?: string | null;
  bbl?: string | null;
  [k: string]: unknown;
}

export const ingestPermitBatch = createServerFn({ method: "POST" })
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
          source: "permits_csv_upload",
          filename: data.filename ?? null,
          status: "running",
        })
        .select("id")
        .single();
      if (logErr) throw new Error(logErr.message);
      syncLogId = log.id;
    }

    const rows = data.rows as unknown as PermitRow[];
    let added = 0, updated = 0, errored = 0, matched = 0, unmatched = 0, ambiguous = 0, duplicates = 0;

    // Dedup within batch: keep last occurrence per key
    const byWorkSeq = new Map<string, PermitRow>();
    const byTracking = new Map<string, PermitRow>();
    for (const r of rows) {
      if (r.work_permit && r.sequence_number) {
        const k = `${r.work_permit}|${r.sequence_number}`;
        if (byWorkSeq.has(k)) duplicates++;
        byWorkSeq.set(k, r);
      } else if (r.tracking_number) {
        const k = r.tracking_number;
        if (byTracking.has(k)) duplicates++;
        byTracking.set(k, r);
      } else {
        errored++;
      }
    }

    // Resolve matches for all rows in 3 bulk queries (job_number, bin, bbl)
    const candidates = [...byWorkSeq.values(), ...byTracking.values()];
    const jobNums = [...new Set(candidates.map((r) => r.job_filing_number).filter(Boolean) as string[])];
    const bins = [...new Set(candidates.map((r) => r.bin).filter(Boolean) as string[])];
    const bbls = [...new Set(candidates.map((r) => r.bbl).filter(Boolean) as string[])];

    const [jobRes, binRes, bblRes] = await Promise.all([
      jobNums.length
        ? supabaseAdmin.from("filings").select("job_number").in("job_number", jobNums)
        : Promise.resolve({ data: [] as { job_number: string }[] }),
      bins.length
        ? supabaseAdmin.from("filings").select("job_number,bin_number").in("bin_number", bins)
        : Promise.resolve({ data: [] as { job_number: string; bin_number: string }[] }),
      bbls.length
        ? supabaseAdmin.from("filings").select("job_number,bbl").in("bbl", bbls)
        : Promise.resolve({ data: [] as { job_number: string; bbl: string }[] }),
    ]);

    const jobSet = new Set((jobRes.data ?? []).map((d) => d.job_number));
    const binMap = new Map<string, Set<string>>();
    for (const d of (binRes.data ?? []) as { job_number: string; bin_number: string }[]) {
      if (!d.bin_number || !d.job_number) continue;
      if (!binMap.has(d.bin_number)) binMap.set(d.bin_number, new Set());
      binMap.get(d.bin_number)!.add(d.job_number);
    }
    const bblMap = new Map<string, Set<string>>();
    for (const d of (bblRes.data ?? []) as { job_number: string; bbl: string }[]) {
      if (!d.bbl || !d.job_number) continue;
      if (!bblMap.has(d.bbl)) bblMap.set(d.bbl, new Set());
      bblMap.get(d.bbl)!.add(d.job_number);
    }

    const enriched: PermitRow[] = [];
    for (const r of candidates) {
      let match: { matched_job_number: string | null; match_status: string; match_method: string | null; match_candidates: unknown } =
        { matched_job_number: null, match_status: "unmatched", match_method: null, match_candidates: null };
      if (r.job_filing_number && jobSet.has(r.job_filing_number)) {
        match = { matched_job_number: r.job_filing_number, match_status: "matched", match_method: "job_filing_number", match_candidates: null };
      } else if (r.bin && binMap.has(r.bin)) {
        const set = binMap.get(r.bin)!;
        if (set.size === 1) match = { matched_job_number: [...set][0], match_status: "matched", match_method: "bin", match_candidates: null };
        else match = { matched_job_number: null, match_status: "ambiguous", match_method: "bin", match_candidates: [...set] };
      } else if (r.bbl && bblMap.has(r.bbl)) {
        const set = bblMap.get(r.bbl)!;
        if (set.size === 1) match = { matched_job_number: [...set][0], match_status: "matched", match_method: "bbl", match_candidates: null };
        else match = { matched_job_number: null, match_status: "ambiguous", match_method: "bbl", match_candidates: [...set] };
      }
      enriched.push({ ...r, ...match });
      if (match.match_status === "matched") matched++;
      else if (match.match_status === "ambiguous") ambiguous++;
      else unmatched++;
    }

    // Detect existing for added/updated counts
    const workSeqRows = enriched.filter((r) => r.work_permit && r.sequence_number);
    const trackingRows = enriched.filter((r) => !(r.work_permit && r.sequence_number) && r.tracking_number);

    if (workSeqRows.length) {
      const workPermits = [...new Set(workSeqRows.map((r) => r.work_permit as string))];
      const { data: existing } = await supabaseAdmin
        .from("approved_permits")
        .select("work_permit,sequence_number")
        .in("work_permit", workPermits);
      const existingSet = new Set((existing ?? []).map((e) => `${e.work_permit}|${e.sequence_number}`));
      for (const r of workSeqRows) {
        if (existingSet.has(`${r.work_permit}|${r.sequence_number}`)) updated++;
        else added++;
      }
      const { error } = await supabaseAdmin
        .from("approved_permits")
        .upsert(workSeqRows as never, { onConflict: "work_permit,sequence_number" });
      if (error) { console.error("[permits upsert ws]", error); errored += workSeqRows.length; }
    }

    if (trackingRows.length) {
      const trackings = [...new Set(trackingRows.map((r) => r.tracking_number as string))];
      const { data: existing } = await supabaseAdmin
        .from("approved_permits")
        .select("tracking_number")
        .in("tracking_number", trackings);
      const existingSet = new Set((existing ?? []).map((e) => e.tracking_number));
      for (const r of trackingRows) {
        if (existingSet.has(r.tracking_number)) updated++;
        else added++;
      }
      const { error } = await supabaseAdmin
        .from("approved_permits")
        .upsert(trackingRows as never, { onConflict: "tracking_number" });
      if (error) { console.error("[permits upsert tr]", error); errored += trackingRows.length; }
    }

    if (syncLogId) {
      const { data: current } = await supabaseAdmin
        .from("sync_log").select("rows_added,rows_updated,rows_errored").eq("id", syncLogId).single();
      await supabaseAdmin.from("sync_log").update({
        rows_added: (current?.rows_added ?? 0) + added,
        rows_updated: (current?.rows_updated ?? 0) + updated,
        rows_errored: (current?.rows_errored ?? 0) + errored,
        ...(data.isLastBatch
          ? { status: errored ? "completed_with_errors" : "success", completed_at: new Date().toISOString() }
          : {}),
      }).eq("id", syncLogId);
    }

    return { syncLogId, added, updated, errored, matched, unmatched, ambiguous, duplicates };
  });

async function resolveMatch(
  db: typeof import("@/integrations/supabase/client.server").supabaseAdmin,
  r: PermitRow,
): Promise<{ matched_job_number: string | null; match_status: string; match_method: string | null; match_candidates: unknown }> {
  // Priority 1: job_filing_number → filings.job_number
  if (r.job_filing_number) {
    const { data } = await db.from("filings").select("job_number").eq("job_number", r.job_filing_number).limit(2);
    if (data && data.length >= 1) {
      return { matched_job_number: r.job_filing_number, match_status: "matched", match_method: "job_filing_number", match_candidates: null };
    }
  }
  // Priority 2: bin
  if (r.bin) {
    const { data } = await db.from("filings").select("job_number").eq("bin_number", r.bin).limit(50);
    const unique = [...new Set((data ?? []).map((d) => d.job_number).filter(Boolean))] as string[];
    if (unique.length === 1) {
      return { matched_job_number: unique[0], match_status: "matched", match_method: "bin", match_candidates: null };
    }
    if (unique.length > 1) {
      return { matched_job_number: null, match_status: "ambiguous", match_method: "bin", match_candidates: unique };
    }
  }
  // Priority 3: bbl
  if (r.bbl) {
    const { data } = await db.from("filings").select("job_number").eq("bbl", r.bbl).limit(50);
    const unique = [...new Set((data ?? []).map((d) => d.job_number).filter(Boolean))] as string[];
    if (unique.length === 1) {
      return { matched_job_number: unique[0], match_status: "matched", match_method: "bbl", match_candidates: null };
    }
    if (unique.length > 1) {
      return { matched_job_number: null, match_status: "ambiguous", match_method: "bbl", match_candidates: unique };
    }
  }
  return { matched_job_number: null, match_status: "unmatched", match_method: null, match_candidates: null };
}

export const listPermitsByJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobNumber: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("approved_permits")
      .select("*")
      .eq("matched_job_number", data.jobNumber)
      .order("issued_date", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return { permits: rows ?? [] };
  });
