import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const filterSchema = z.object({
  q: z.string().optional(),
  boroughs: z.array(z.string()).optional(),
  jobTypes: z.array(z.string()).optional(),
  workTypes: z.array(z.string()).optional(), // column names e.g. work_plumbing
  minCost: z.number().nullable().optional(),
  maxCost: z.number().nullable().optional(),
  newOnly: z.boolean().optional(),
  sort: z.enum(["lead_score", "latest_action_date", "initial_cost"]).default("lead_score"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const listFilings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let q = supabase.from("filings").select("*", { count: "exact" });

    if (data.q && data.q.trim()) {
      const term = data.q.trim().replace(/[%_]/g, "");
      // Also search approved_permits and pull in their matched job numbers
      const { data: permitMatches } = await supabase
        .from("approved_permits")
        .select("matched_job_number")
        .or(
          `work_permit.ilike.%${term}%,tracking_number.ilike.%${term}%,job_filing_number.ilike.%${term}%,permit_status.ilike.%${term}%,bin.ilike.%${term}%,bbl.ilike.%${term}%,owner_business_name.ilike.%${term}%,applicant_business_name.ilike.%${term}%`
        )
        .not("matched_job_number", "is", null)
        .limit(500);
      const extraJobs = [...new Set((permitMatches ?? []).map((p) => p.matched_job_number).filter(Boolean) as string[])];
      const orParts = [
        `full_address.ilike.%${term}%`,
        `owner_business_name.ilike.%${term}%`,
        `owner_last_name.ilike.%${term}%`,
        `job_number.ilike.%${term}%`,
        `job_description.ilike.%${term}%`,
        `bin_number.ilike.%${term}%`,
        `bbl.ilike.%${term}%`,
        `applicant_last_name.ilike.%${term}%`,
      ];
      if (extraJobs.length) orParts.push(`job_number.in.(${extraJobs.map((j) => `"${j}"`).join(",")})`);
      q = q.or(orParts.join(","));
    }
    if (data.boroughs?.length) q = q.in("borough", data.boroughs);
    if (data.jobTypes?.length) q = q.in("job_type", data.jobTypes);
    if (data.workTypes?.length) {
      for (const col of data.workTypes) {
        // whitelist
        if (/^work_[a-z_]+$/.test(col)) q = q.eq(col, true);
      }
    }
    if (data.minCost != null) q = q.gte("initial_cost", data.minCost);
    if (data.maxCost != null) q = q.lte("initial_cost", data.maxCost);
    if (data.newOnly) q = q.eq("is_new_this_sync", true);

    q = q.order(data.sort, { ascending: false, nullsFirst: false }).range(from, to);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const getFiling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobNumber: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("filings")
      .select("*")
      .eq("job_number", data.jobNumber)
      .order("doc_number", { ascending: true, nullsFirst: true });
    if (error) throw new Error(error.message);
    return { filings: rows ?? [] };
  });

export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [total, newCount, leadCount, recent] = await Promise.all([
      supabase.from("filings").select("*", { count: "exact", head: true }),
      supabase.from("filings").select("*", { count: "exact", head: true }).eq("is_new_this_sync", true),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase
        .from("filings")
        .select("id,job_number,full_address,borough,job_type,job_type_label,initial_cost,latest_action_date,lead_score")
        .eq("is_new_this_sync", true)
        .order("lead_score", { ascending: false })
        .limit(10),
    ]);

    const { data: lastSync } = await supabase
      .from("sync_log")
      .select("completed_at,rows_added,rows_updated")
      .eq("status", "success")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      totalFilings: total.count ?? 0,
      newCount: newCount.count ?? 0,
      leadCount: leadCount.count ?? 0,
      recent: recent.data ?? [],
      lastSync,
    };
  });
