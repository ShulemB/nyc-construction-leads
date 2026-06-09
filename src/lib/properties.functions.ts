import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Ingest: filings ─────────────────────────────────────────────────────────

const filingRowSchema = z.object({ bin: z.string().min(1) }).passthrough();
const permitRowSchema = z.object({ bin: z.string().min(1) }).passthrough();

const batchSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).max(1000),
  syncLogId: z.string().uuid().nullable(),
  filename: z.string().max(255).optional(),
  isFirstBatch: z.boolean().default(false),
  isLastBatch: z.boolean().default(false),
});

type AnyRow = Record<string, unknown>;

function splitPropertyAndChild<K extends "filing" | "permit">(
  rows: AnyRow[],
  kind: K,
): { properties: AnyRow[]; children: AnyRow[] } {
  // Each row has been pre-normalized by client. We separate: property data is everything in propertyFields,
  // child data is the rest (with bin retained as FK).
  // To keep this generic, the client sends rows already split — but here we just pass them through.
  void kind;
  return { properties: [], children: rows };
}
void splitPropertyAndChild;

async function ensureSyncLog(opts: {
  isFirst: boolean;
  syncLogId: string | null;
  userId: string;
  filename?: string;
  source: string;
}) {
  if (!opts.isFirst) return opts.syncLogId;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: log, error } = await supabaseAdmin
    .from("sync_log")
    .insert({
      user_id: opts.userId,
      source: opts.source,
      filename: opts.filename ?? null,
      status: "running",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return log.id as string;
}

async function bumpSyncLog(
  syncLogId: string | null,
  delta: { added: number; updated: number; errored: number },
  isLast: boolean,
) {
  if (!syncLogId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: current } = await supabaseAdmin
    .from("sync_log")
    .select("rows_added,rows_updated,rows_errored")
    .eq("id", syncLogId)
    .single();
  await supabaseAdmin.from("sync_log").update({
    rows_added: (current?.rows_added ?? 0) + delta.added,
    rows_updated: (current?.rows_updated ?? 0) + delta.updated,
    rows_errored: (current?.rows_errored ?? 0) + delta.errored,
    ...(isLast
      ? { status: delta.errored ? "completed_with_errors" : "success", completed_at: new Date().toISOString() }
      : {}),
  }).eq("id", syncLogId);
}

// Input shape: each row is { property: {...}, filing: {...} } or { property: {...}, permit: {...} }
const filingPayloadRow = z.object({
  property: z.record(z.string(), z.unknown()),
  filing: z.record(z.string(), z.unknown()),
});
const permitPayloadRow = z.object({
  property: z.record(z.string(), z.unknown()),
  permit: z.record(z.string(), z.unknown()),
});

const filingBatchSchema = z.object({
  rows: z.array(filingPayloadRow).max(1000),
  syncLogId: z.string().uuid().nullable(),
  filename: z.string().max(255).optional(),
  isFirstBatch: z.boolean().default(false),
  isLastBatch: z.boolean().default(false),
});

const permitBatchSchema = z.object({
  rows: z.array(permitPayloadRow).max(1000),
  syncLogId: z.string().uuid().nullable(),
  filename: z.string().max(255).optional(),
  isFirstBatch: z.boolean().default(false),
  isLastBatch: z.boolean().default(false),
});

export const ingestFilingBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filingBatchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let syncLogId = await ensureSyncLog({
      isFirst: data.isFirstBatch,
      syncLogId: data.syncLogId,
      userId: context.userId,
      filename: data.filename,
      source: "filings_csv_upload",
    });

    // Dedupe by bin in this batch — most recent filing wins for property write
    const propsByBin = new Map<string, AnyRow>();
    for (const r of data.rows) {
      const p = r.property as AnyRow;
      const bin = p.bin as string;
      if (bin) propsByBin.set(bin, p);
    }
    const properties = Array.from(propsByBin.values());

    // Upsert properties (full overwrite — most recent filing wins)
    if (properties.length) {
      const { error } = await supabaseAdmin.from("properties").upsert(properties as never, { onConflict: "bin" });
      if (error) console.error("[ingest filing: properties]", error);
    }

    // Dedupe filings by job_number
    const seen = new Set<string>();
    const filings: AnyRow[] = [];
    let skipped = 0;
    for (const r of data.rows) {
      const f = { ...(r.filing as AnyRow), bin: (r.property as AnyRow).bin };
      const jn = f.job_number as string | null;
      if (!jn) { skipped++; continue; }
      if (seen.has(jn)) continue;
      seen.add(jn);
      filings.push(f);
    }

    // Detect existing for added/updated counting
    const jns = filings.map((f) => f.job_number as string);
    const { data: existing } = jns.length
      ? await supabaseAdmin.from("job_application_filings").select("job_number").in("job_number", jns)
      : { data: [] };
    const existingSet = new Set((existing ?? []).map((e) => e.job_number as string));
    let added = 0, updated = 0;
    for (const f of filings) (existingSet.has(f.job_number as string) ? updated++ : added++);

    let errored = 0;
    if (filings.length) {
      const { error } = await supabaseAdmin
        .from("job_application_filings")
        .upsert(filings as never, { onConflict: "job_number" });
      if (error) { errored = filings.length; console.error("[ingest filings]", error); }
    }

    await bumpSyncLog(syncLogId, { added: added - Math.min(errored, added), updated, errored }, data.isLastBatch);
    return { syncLogId, added, updated, errored, skipped };
  });

export const ingestPermitBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => permitBatchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let syncLogId = await ensureSyncLog({
      isFirst: data.isFirstBatch,
      syncLogId: data.syncLogId,
      userId: context.userId,
      filename: data.filename,
      source: "permits_csv_upload",
    });

    // Dedupe properties by bin
    const propsByBin = new Map<string, AnyRow>();
    for (const r of data.rows) {
      const p = r.property as AnyRow;
      const bin = p.bin as string;
      if (bin && !propsByBin.has(bin)) propsByBin.set(bin, p);
    }
    const bins = Array.from(propsByBin.keys());

    // Property upsert from permit must NOT overwrite building characteristics.
    // Strategy: find existing bins; insert new ones; for existing ones, update only address/geo via separate UPDATE.
    if (bins.length) {
      const { data: existing } = await supabaseAdmin.from("properties").select("bin").in("bin", bins);
      const existingBins = new Set((existing ?? []).map((e) => e.bin as string));
      const toInsert = bins.filter((b) => !existingBins.has(b)).map((b) => propsByBin.get(b)!);
      const toUpdate = bins.filter((b) => existingBins.has(b)).map((b) => propsByBin.get(b)!);

      if (toInsert.length) {
        const { error } = await supabaseAdmin.from("properties").insert(toInsert as never);
        if (error) console.error("[permit: property insert]", error);
      }
      // Update each existing property's address/geo only (other cols untouched).
      for (const p of toUpdate) {
        const { bin, ...rest } = p as { bin: string; [k: string]: unknown };
        const { error } = await supabaseAdmin.from("properties").update(rest as never).eq("bin", bin);
        if (error) console.error("[permit: property update]", error);
      }
    }

    // Permits — dedup by work_permit (skip rows without one — they can't be uniquely upserted)
    const seen = new Set<string>();
    const permits: AnyRow[] = [];
    let skipped = 0;
    for (const r of data.rows) {
      const p = { ...(r.permit as AnyRow), bin: (r.property as AnyRow).bin };
      const wp = p.work_permit as string | null;
      if (!wp) { skipped++; continue; }
      if (seen.has(wp)) continue;
      seen.add(wp);
      permits.push(p);
    }

    const wps = permits.map((p) => p.work_permit as string);
    const { data: existingPermits } = wps.length
      ? await supabaseAdmin.from("approved_permits").select("work_permit").in("work_permit", wps)
      : { data: [] };
    const existingSet = new Set((existingPermits ?? []).map((e) => e.work_permit as string));
    let added = 0, updated = 0;
    for (const p of permits) (existingSet.has(p.work_permit as string) ? updated++ : added++);

    let errored = 0;
    if (permits.length) {
      const { error } = await supabaseAdmin
        .from("approved_permits")
        .upsert(permits as never, { onConflict: "work_permit" });
      if (error) { errored = permits.length; console.error("[ingest permits]", error); }
    }

    await bumpSyncLog(syncLogId, { added: added - Math.min(errored, added), updated, errored }, data.isLastBatch);
    return { syncLogId, added, updated, errored, skipped };
  });

// ─── Reads ───────────────────────────────────────────────────────────────────

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  borough: z.string().max(50).nullable().optional(),
  search: z.string().max(200).nullable().optional(),
});

export const listProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.limit;
    const to = from + data.limit - 1;

    let q = context.supabase
      .from("properties")
      .select(
        "bin, borough, house_number, street_name, owner_business_name, owner_first_name, owner_last_name, updated_at, full_address, " +
        "filings:job_application_filings(job_number, job_type, job_status, latest_action_date, initial_cost, lead_score), " +
        "permits:approved_permits(work_permit, work_type, permit_status, issued_date, estimated_job_costs)",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (data.borough) q = q.eq("borough", data.borough);
    if (data.search) {
      const s = data.search.replace(/[%_]/g, "");
      q = q.or(`street_name.ilike.%${s}%,house_number.ilike.%${s}%,owner_business_name.ilike.%${s}%`);
    }

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);

    const properties = (rows ?? []).map((p) => {
      const filings = (p.filings ?? []) as Array<{ job_number: string | null; job_type: string | null; job_status: string | null; latest_action_date: string | null; initial_cost: string | null; lead_score: number | null }>;
      const permits = (p.permits ?? []) as Array<{ work_permit: string | null; work_type: string | null; permit_status: string | null; issued_date: string | null; estimated_job_costs: string | null }>;
      const latestFiling = [...filings].sort((a, b) => (b.latest_action_date ?? "").localeCompare(a.latest_action_date ?? ""))[0] ?? null;
      const latestPermit = [...permits].sort((a, b) => (b.issued_date ?? "").localeCompare(a.issued_date ?? ""))[0] ?? null;
      const maxScore = filings.reduce((m, f) => Math.max(m, f.lead_score ?? 0), 0);
      return {
        bin: p.bin as string,
        borough: p.borough,
        house_number: p.house_number,
        street_name: p.street_name,
        full_address: p.full_address,
        owner_business_name: p.owner_business_name,
        owner_first_name: p.owner_first_name,
        owner_last_name: p.owner_last_name,
        updated_at: p.updated_at,
        filing_count: filings.length,
        permit_count: permits.length,
        latest_filing: latestFiling,
        latest_permit: latestPermit,
        lead_score: maxScore,
      };
    });

    return {
      properties,
      total: count ?? 0,
      page: data.page,
      pages: Math.max(1, Math.ceil((count ?? 0) / data.limit)),
    };
  });

export const getProperty = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ bin: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: property, error: pErr } = await context.supabase
      .from("properties")
      .select("*")
      .eq("bin", data.bin)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!property) return { property: null, timeline: [] };

    const [filingsRes, permitsRes] = await Promise.all([
      context.supabase.from("job_application_filings").select("*").eq("bin", data.bin).order("latest_action_date", { ascending: false, nullsFirst: false }),
      context.supabase.from("approved_permits").select("*").eq("bin", data.bin).order("issued_date", { ascending: false, nullsFirst: false }),
    ]);
    if (filingsRes.error) throw new Error(filingsRes.error.message);
    if (permitsRes.error) throw new Error(permitsRes.error.message);

    const filings = filingsRes.data ?? [];
    const permits = permitsRes.data ?? [];

    const licenseNums = Array.from(new Set([
      ...filings.map((f) => f.applicant_license).filter(Boolean),
      ...permits.map((p) => p.applicant_license).filter(Boolean),
    ])) as string[];

    let licenseMap: Record<string, unknown> = {};
    if (licenseNums.length) {
      const { data: licenses } = await context.supabase
        .from("dob_license_info")
        .select("*")
        .in("license_number", licenseNums);
      for (const l of licenses ?? []) {
        const ln = (l as { license_number: string | null }).license_number;
        if (ln && !licenseMap[ln]) licenseMap[ln] = l;
      }
    }

    type TLEntry =
      | { type: "filing"; sortDate: string | null; record: typeof filings[number]; license: unknown }
      | { type: "permit"; sortDate: string | null; record: typeof permits[number]; license: unknown };

    const timeline: TLEntry[] = [
      ...filings.map((f) => ({
        type: "filing" as const,
        sortDate: (f.latest_action_date ?? f.approved ?? f.pre_filing_date) as string | null,
        record: f,
        license: f.applicant_license ? licenseMap[f.applicant_license] ?? null : null,
      })),
      ...permits.map((p) => ({
        type: "permit" as const,
        sortDate: (p.issued_date ?? p.approved_date) as string | null,
        record: p,
        license: p.applicant_license ? licenseMap[p.applicant_license] ?? null : null,
      })),
    ].sort((a, b) => {
      if (!a.sortDate) return 1;
      if (!b.sortDate) return -1;
      return b.sortDate.localeCompare(a.sortDate);
    });

    return { property, timeline };
  });

export const getImportStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [props, filings, permits, licenses] = await Promise.all([
      context.supabase.from("properties").select("*", { count: "exact", head: true }),
      context.supabase.from("job_application_filings").select("updated_at", { count: "exact" }).order("updated_at", { ascending: false }).limit(1),
      context.supabase.from("approved_permits").select("updated_at", { count: "exact" }).order("updated_at", { ascending: false }).limit(1),
      context.supabase.from("dob_license_info").select("imported_at", { count: "exact" }).order("imported_at", { ascending: false }).limit(1),
    ]);
    return {
      properties: { total: props.count ?? 0 },
      filings: { total: filings.count ?? 0, lastUpdated: filings.data?.[0]?.updated_at ?? null },
      permits: { total: permits.count ?? 0, lastUpdated: permits.data?.[0]?.updated_at ?? null },
      licenses: { total: licenses.count ?? 0, lastImportedAt: licenses.data?.[0]?.imported_at ?? null },
    };
  });

export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [propsRes, filingsCount, leadsCount, lastSyncRes, recentRes] = await Promise.all([
      context.supabase.from("properties").select("*", { count: "exact", head: true }),
      context.supabase.from("job_application_filings").select("*", { count: "exact", head: true }),
      context.supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", context.userId),
      context.supabase.from("sync_log").select("*").order("completed_at", { ascending: false, nullsFirst: false }).limit(1),
      context.supabase
        .from("job_application_filings")
        .select("id, bin, job_number, job_type, job_status, latest_action_date, initial_cost, lead_score, properties(borough, full_address)")
        .order("lead_score", { ascending: false, nullsFirst: false })
        .limit(10),
    ]);
    return {
      totalProperties: propsRes.count ?? 0,
      totalFilings: filingsCount.count ?? 0,
      leadCount: leadsCount.count ?? 0,
      lastSync: lastSyncRes.data?.[0] ?? null,
      recent: recentRes.data ?? [],
    };
  });
