import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { dashboardStats } from "@/lib/properties.functions";
import { fmtCurrency, fmtNumber, daysAgo } from "@/lib/format";
import { scoreTier } from "@/lib/dob-constants";
import { Building2, FileSearch, Star, ArrowRight, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PermitLeads" }] }),
  component: Dashboard,
});

type RecentRow = {
  id: number;
  bin: string;
  job_number: string | null;
  job_type: string | null;
  job_status: string | null;
  latest_action_date: string | null;
  initial_cost: string | null;
  lead_score: number | null;
  properties: { borough: string | null; full_address: string | null } | null;
};

function Dashboard() {
  const fn = useServerFn(dashboardStats);
  const { data } = useSuspenseQuery({ queryKey: ["dashboard-stats"], queryFn: () => fn() });
  const recent = data.recent as unknown as RecentRow[];

  return (
    <AppShell>
      <div className="border-b border-border bg-card/30 px-8 py-6">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {data.lastSync?.completed_at
            ? `Last sync: ${new Date(data.lastSync.completed_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} — ${data.lastSync.rows_added} new, ${data.lastSync.rows_updated} updated`
            : "No syncs yet. Upload your first DOB export to get started."}
        </p>
      </div>

      <div className="space-y-6 p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Building2} label="Properties" value={fmtNumber(data.totalProperties)} />
          <Stat icon={FileSearch} label="Filings" value={fmtNumber(data.totalFilings)} />
          <Stat icon={Star} label="Leads in pipeline" value={fmtNumber(data.leadCount)} />
          <Stat icon={Building2} label="Boroughs covered" value="5" />
        </div>

        {data.totalProperties === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-display text-lg font-semibold">No data yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Upload a DOB Job Application CSV to start finding leads.</p>
            <Link to="/import" className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90">
              Upload data <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Hottest filings</h2>
                <p className="text-xs text-muted-foreground">Top {recent.length} by lead score</p>
              </div>
              <Link to="/properties" className="text-sm font-medium text-brand hover:underline">View all →</Link>
            </div>
            {recent.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No filings yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((f) => {
                  const tier = scoreTier(f.lead_score ?? 0);
                  return (
                    <li key={f.id} className="flex items-center gap-4 px-6 py-4">
                      <span className={`h-10 w-1 rounded-full ${tier === "hot" ? "bg-score-hot" : tier === "warm" ? "bg-score-warm" : "bg-score-cold"}`} />
                      <div className="min-w-0 flex-1">
                        <Link to="/properties/$bin" params={{ bin: f.bin }} className="block truncate font-medium hover:text-brand">
                          {f.properties?.full_address ?? "(no address)"}
                        </Link>
                        <div className="truncate text-xs text-muted-foreground">{f.properties?.borough} · {f.job_type}</div>
                      </div>
                      <div className="hidden text-right text-sm sm:block">
                        <div className="font-medium">{fmtCurrency(f.initial_cost, true)}</div>
                        <div className="text-xs text-muted-foreground">{daysAgo(f.latest_action_date)}</div>
                      </div>
                      <span className="hidden rounded-md bg-muted px-2 py-1 font-mono text-xs sm:inline">{f.lead_score}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
