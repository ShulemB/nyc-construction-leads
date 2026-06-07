import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { listLeads, updateLead, removeLead } from "@/lib/leads.functions";
import { fmtCurrency, daysAgo } from "@/lib/format";
import { jobTypeColor, scoreTier } from "@/lib/dob-constants";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["new", "contacted", "proposal_sent", "won", "lost"] as const;

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — PermitLeads" }] }),
  component: Leads,
});

function Leads() {
  const fn = useServerFn(listLeads);
  const { data } = useSuspenseQuery({ queryKey: ["leads"], queryFn: () => fn() });
  const qc = useQueryClient();
  const updFn = useServerFn(updateLead);
  const rmFn = useServerFn(removeLead);

  const upd = useMutation({
    mutationFn: (p: { id: string; status?: typeof STATUSES[number] }) =>
      updFn({ data: { id: p.id, status: p.status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
  const rm = useMutation({
    mutationFn: (id: string) => rmFn({ data: { id } }),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["leads"] }); },
  });

  return (
    <AppShell>
      <div className="border-b border-border bg-card/30 px-8 py-6">
        <h1 className="font-display text-2xl font-bold">Leads</h1>
        <p className="text-sm text-muted-foreground">Your active pipeline</p>
      </div>

      <div className="p-8">
        {data.leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Star className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-display text-lg font-semibold">No leads yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Browse filings and click + Lead to start your pipeline.</p>
            <Link to="/filings" className="mt-6 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90">
              Browse filings
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Filing</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Cost</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.leads.map((l) => {
                  const f = l.filing;
                  if (!f) return null;
                  const tier = scoreTier(f.lead_score ?? 0);
                  return (
                    <tr key={l.id} className="hover:bg-accent/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`h-8 w-1 rounded-full ${tier === "hot" ? "bg-score-hot" : tier === "warm" ? "bg-score-warm" : "bg-score-cold"}`} />
                          <span className={`rounded-md border px-2 py-0.5 font-mono text-xs ${jobTypeColor(f.job_type)}`}>{f.job_type}</span>
                          <div>
                            <Link to="/filings/$jobNumber" params={{ jobNumber: f.job_number }} className="font-medium hover:text-brand">{f.full_address}</Link>
                            <div className="text-xs text-muted-foreground">{f.borough} · {daysAgo(f.latest_action_date)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{f.lead_score}</td>
                      <td className="px-4 py-3">{fmtCurrency(f.initial_cost, true)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={l.status}
                          onChange={(e) => upd.mutate({ id: l.id, status: e.target.value as typeof STATUSES[number] })}
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => rm.mutate(l.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
