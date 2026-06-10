import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { listProperties } from "@/lib/properties.functions";
import { addLead } from "@/lib/leads.functions";
import { fmtCurrency, fmtNumber, fmtDate } from "@/lib/format";
import { BOROUGHS, scoreTier } from "@/lib/dob-constants";
import { Building2, Search, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/properties/")({
  head: () => ({ meta: [{ title: "Properties — PermitLeads" }] }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [borough, setBorough] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fn = useServerFn(listProperties);
  const qc = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: ["properties", { page, borough, search }],
    queryFn: () => fn({ data: { page, limit: 50, borough, search } }),
  });

  const addFn = useServerFn(addLead);
  const add = useMutation({
    mutationFn: (bin: string) => addFn({ data: { bin } }),
    onSuccess: () => { toast.success("Added to leads"); qc.invalidateQueries({ queryKey: ["leads"] }); },
    onError: (e) => toast.error(e.message),
  });

  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  return (
    <AppShell>
      <div className="border-b border-border bg-card/30 px-8 py-6">
        <h1 className="font-display text-2xl font-bold">Properties</h1>
        <p className="text-sm text-muted-foreground">{fmtNumber(data.total)} properties · page {data.page} of {data.pages}</p>
      </div>

      <div className="space-y-4 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={submitSearch} className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search street, house #, owner business…"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
            />
          </form>
          <select
            value={borough ?? ""} onChange={(e) => { setBorough(e.target.value || null); setPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All boroughs</option>
            {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {data.properties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-display text-lg font-semibold">No properties yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Import a filings or permits CSV to populate properties.</p>
            <Link to="/import" className="mt-6 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90">
              Go to import
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Property</th>
                    <th className="px-4 py-3 text-left">Owner</th>
                    <th className="px-4 py-3 text-left">Records</th>
                    <th className="px-4 py-3 text-left">Latest activity</th>
                    <th className="px-4 py-3 text-left">Cost</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.properties.map((p) => {
                    const tier = scoreTier(p.lead_score ?? 0);
                    const ownerName = [p.owner_first_name, p.owner_last_name].filter(Boolean).join(" ") || null;
                    return (
                      <tr key={p.bin} className="hover:bg-accent/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`h-8 w-1 rounded-full ${tier === "hot" ? "bg-score-hot" : tier === "warm" ? "bg-score-warm" : "bg-score-cold"}`} />
                            <div>
                              <Link to="/properties/$bin" params={{ bin: p.bin }} className="font-medium hover:text-brand">
                                {p.full_address ?? `BIN ${p.bin}`}
                              </Link>
                              <div className="text-xs text-muted-foreground">{p.borough} · BIN {p.bin}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div>{ownerName || "—"}</div>
                          {p.owner_business_name ? (
                            <div className="text-xs text-muted-foreground">{p.owner_business_name}</div>
                          ) : (
                            <div className="text-xs text-muted-foreground">&nbsp;</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 text-xs">
                            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5">{p.filing_count} filings</span>
                            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5">{p.permit_count} permits</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.latest_filing ? (
                            <div>
                              <div className="font-mono text-xs">{p.latest_filing.job_type ?? "—"} · {p.latest_filing.job_status ?? "—"}</div>
                              <div className="text-xs text-muted-foreground">{fmtDate(p.latest_filing.latest_action_date)}</div>
                            </div>
                          ) : p.latest_permit ? (
                            <div>
                              <div className="font-mono text-xs">{p.latest_permit.work_type ?? "—"} · {p.latest_permit.permit_status ?? "—"}</div>
                              <div className="text-xs text-muted-foreground">{fmtDate(p.latest_permit.issued_date)}</div>
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">{fmtCurrency(p.latest_filing?.initial_cost ?? p.latest_permit?.estimated_job_costs ?? null, true)}</td>
                        <td className="px-4 py-3 font-mono">{p.lead_score || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => add.mutate(p.bin)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                          >
                            <Star className="h-3 w-3" /> Lead
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <div className="text-sm text-muted-foreground">Page {data.page} of {data.pages}</div>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
