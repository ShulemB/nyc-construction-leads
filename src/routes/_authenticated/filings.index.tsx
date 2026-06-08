import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { listFilings } from "@/lib/filings.functions";
import { addLead } from "@/lib/leads.functions";
import { fmtCurrency, daysAgo } from "@/lib/format";
import { BOROUGHS, JOB_TYPES, WORK_TYPES, jobTypeColor, scoreTier } from "@/lib/dob-constants";
import { Search, Plus, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SORTS = ["lead_score", "latest_action_date", "initial_cost"] as const;
type Sort = (typeof SORTS)[number];

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  boroughs: z.array(z.string()).optional().catch(undefined),
  jobTypes: z.array(z.string()).optional().catch(undefined),
  workTypes: z.array(z.string()).optional().catch(undefined),
  newOnly: z.boolean().optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/filings/")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Filings — PermitLeads" }] }),
  component: FilingsList,
});

function FilingsList() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const q = search.q ?? "";
  const boroughs = search.boroughs ?? [];
  const jobTypes = search.jobTypes ?? [];
  const workTypes = search.workTypes ?? [];
  const newOnly = search.newOnly ?? false;
  const sort: Sort = search.sort ?? "lead_score";
  const page = search.page ?? 1;

  // Local input mirror for debouncing search text
  const [qInput, setQInput] = useState(q);
  useEffect(() => { setQInput(q); }, [q]);
  useEffect(() => {
    if (qInput === q) return;
    const t = setTimeout(() => {
      navigate({
        search: (prev: Record<string, unknown>) => ({ ...prev, q: qInput || undefined, page: undefined }),
        replace: true,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [qInput, q, navigate]);


  const update = (
    patch: Partial<{
      boroughs: string[]; jobTypes: string[]; workTypes: string[];
      newOnly: boolean; sort: Sort; page: number;
    }>,
    opts?: { keepPage?: boolean }
  ) => {
    navigate({
      search: (prev: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...prev, ...patch };
        // Normalize empty arrays / defaults out of the URL
        if (Array.isArray(next.boroughs) && next.boroughs.length === 0) next.boroughs = undefined;
        if (Array.isArray(next.jobTypes) && next.jobTypes.length === 0) next.jobTypes = undefined;
        if (Array.isArray(next.workTypes) && next.workTypes.length === 0) next.workTypes = undefined;
        if (next.newOnly === false) next.newOnly = undefined;
        if (next.sort === "lead_score") next.sort = undefined;
        if (!opts?.keepPage) next.page = undefined;
        return next;
      },
    });
  };

  const clearAll = () => navigate({ search: {} });

  const toggle = (arr: string[], v: string, key: "boroughs" | "jobTypes" | "workTypes") => {
    const nextArr = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    update({ [key]: nextArr } as never);
  };

  const fn = useServerFn(listFilings);
  const qc = useQueryClient();
  const addLeadFn = useServerFn(addLead);

  const params = { q, boroughs, jobTypes, workTypes, newOnly, sort, page, pageSize: 50 };
  const { data, isFetching } = useQuery({
    queryKey: ["filings", params],
    queryFn: () => fn({ data: params }),
  });

  const addMutation = useMutation({
    mutationFn: (filingId: string) => addLeadFn({ data: { filingId } }),
    onSuccess: () => { toast.success("Added to leads"); qc.invalidateQueries({ queryKey: ["leads"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 50));

  const activeCount =
    boroughs.length + jobTypes.length + workTypes.length +
    (q ? 1 : 0) + (newOnly ? 1 : 0) + (sort !== "lead_score" ? 1 : 0);
  const hasFilters = activeCount > 0;

  return (
    <AppShell>
      <div className="border-b border-border bg-card/30 px-8 py-6">
        <h1 className="font-display text-2xl font-bold">Job Application Filing</h1>
        <p className="text-sm text-muted-foreground">Search and filter NYC DOB permit filings</p>
      </div>

      <div className="space-y-4 p-8">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by address, owner, business, job #, description..."
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              className="pl-9 text-base"
            />
          </div>
          {hasFilters && (
            <Button variant="destructive" onClick={clearAll} className="shrink-0">
              <X className="mr-1 h-4 w-4" />
              Clear filters ({activeCount})
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Filters{hasFilters ? ` (${activeCount})` : ""}
            </span>
            {hasFilters && (
              <button onClick={clearAll} className="text-xs text-brand hover:underline">
                Clear all
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FilterGroup label="Borough">
              {BOROUGHS.map((b) => (
                <Chip key={b} active={boroughs.includes(b)} onClick={() => toggle(boroughs, b, "boroughs")}>{b}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Job Type">
              {JOB_TYPES.map((t) => (
                <Chip key={t} active={jobTypes.includes(t)} onClick={() => toggle(jobTypes, t, "jobTypes")}>{t}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Work Type">
              {WORK_TYPES.map((w) => (
                <Chip key={w.key} active={workTypes.includes(w.key)} onClick={() => toggle(workTypes, w.key, "workTypes")}>{w.label}</Chip>
              ))}
            </FilterGroup>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newOnly}
                onChange={(e) => update({ newOnly: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              New this sync only
            </label>
            <span className="text-muted-foreground">
              {isFetching ? <Loader2 className="inline h-3 w-3 animate-spin" /> : `${total.toLocaleString()} filings`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort:</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value as Sort })}
              className="rounded-md border border-input bg-card px-2 py-1.5 text-sm"
            >
              <option value="lead_score">Lead score</option>
              <option value="latest_action_date">Latest action</option>
              <option value="initial_cost">Estimated cost</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {!data?.rows.length && !isFetching && (
            <li className="p-12 text-center text-sm text-muted-foreground">
              No filings match. Try removing filters, or <Link to="/import" className="text-brand hover:underline">upload data</Link>.
            </li>
          )}
          {data?.rows.map((f) => {
            const tier = scoreTier(f.lead_score ?? 0);
            return (
              <li key={f.id} className="flex items-center gap-4 px-5 py-3 hover:bg-accent/40">
                <span className={`h-12 w-1 rounded-full ${tier === "hot" ? "bg-score-hot" : tier === "warm" ? "bg-score-warm" : "bg-score-cold"}`} />
                <div className="min-w-0 flex-1">
                  <Link to="/filings/$jobNumber" params={{ jobNumber: f.job_number }} className="block truncate font-medium hover:text-brand">
                    {f.full_address ?? "(no address)"}
                  </Link>
                  <div className="truncate text-xs text-muted-foreground">
                    <span className={`inline-block shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-none align-text-bottom mr-1 ${jobTypeColor(f.job_type)}`}>{f.job_type}</span>
                    {f.borough} · {f.owner_business_name || [f.owner_first_name, f.owner_last_name].filter(Boolean).join(" ") || "—"}
                    {f.job_status_description ? ` · ${f.job_status_description}` : ""}
                  </div>
                </div>
                <div className="hidden text-right text-sm md:block">
                  <div className="font-medium">{fmtCurrency(f.initial_cost, true)}</div>
                  <div className="text-xs text-muted-foreground">{daysAgo(f.latest_action_date)}</div>
                </div>
                <span className="hidden rounded-md bg-muted px-2 py-1 font-mono text-xs md:inline">{f.lead_score}</span>
                <Button size="sm" variant="outline" onClick={() => addMutation.mutate(f.id)} disabled={addMutation.isPending}>
                  <Plus className="h-3.5 w-3.5" />
                  <span className="ml-1 hidden sm:inline">Lead</span>
                </Button>
              </li>
            );
          })}
        </ul>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: page - 1 }, { keepPage: true })}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => update({ page: page + 1 }, { keepPage: true })}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
      {active && <X className="h-3 w-3" />}
    </button>
  );
}
