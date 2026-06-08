import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { getFiling } from "@/lib/filings.functions";
import { listPermitsByJob } from "@/lib/permits.functions";
import { addLead } from "@/lib/leads.functions";
import { RelatedPermits } from "@/components/filings/RelatedPermits";
import { GoogleMapImage } from "@/components/filings/GoogleMapImage";
import { fmtCurrency, fmtNumber, fmtDate, daysAgo } from "@/lib/format";
import { WORK_TYPES, jobTypeColor, scoreTier } from "@/lib/dob-constants";
import { ChevronLeft, Plus, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/filings/$jobNumber")({
  head: ({ params }) => ({ meta: [{ title: `Job ${params.jobNumber} — PermitLeads` }] }),
  component: FilingDetail,
});

function FilingDetail() {
  const { jobNumber } = Route.useParams();
  const fn = useServerFn(getFiling);
  const permitsFn = useServerFn(listPermitsByJob);
  const { data } = useSuspenseQuery({
    queryKey: ["filing", jobNumber],
    queryFn: () => fn({ data: { jobNumber } }),
  });
  const { data: permitsData } = useSuspenseQuery({
    queryKey: ["filing-permits", jobNumber],
    queryFn: () => permitsFn({ data: { jobNumber } }),
  });

  const qc = useQueryClient();
  const addLeadFn = useServerFn(addLead);
  const addMutation = useMutation({
    mutationFn: (filingId: string) => addLeadFn({ data: { filingId } }),
    onSuccess: () => { toast.success("Added to leads"); qc.invalidateQueries({ queryKey: ["leads"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const f = data.filings[0];
  if (!f) {
    return (
      <AppShell>
        <div className="p-12 text-center">
          <h1 className="text-xl font-semibold">Filing not found</h1>
          <Link to="/filings" className="mt-4 inline-block text-sm text-brand hover:underline">← Back to filings</Link>
        </div>
      </AppShell>
    );
  }

  const tier = scoreTier(f.lead_score ?? 0);
  const activeWork = WORK_TYPES.filter((w) => f[w.key as keyof typeof f]);
  const allDocs = data.filings;

  return (
    <AppShell>
      <div className="border-b border-border bg-card/30 px-8 py-6">
        <Link to="/filings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to filings
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <GoogleMapImage houseNumber={f.house_number} streetName={f.street_name} borough={f.borough} address={f.full_address} />
            <h1 className="mt-4 font-display text-3xl font-bold">{f.full_address ?? "(no address)"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-md border px-2 py-0.5 font-mono text-xs ${jobTypeColor(f.job_type)}`}>{f.job_type} · {f.job_type_label}</span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{f.job_status_description ?? f.job_status}</span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase ${tier === "hot" ? "bg-score-hot text-white" : tier === "warm" ? "bg-score-warm text-white" : "bg-score-cold text-white"}`}>
                {tier} · {f.lead_score}
              </span>
              <span className="text-muted-foreground">Job #{f.job_number}{f.doc_number ? ` · Doc ${f.doc_number}` : ""}</span>
              {allDocs.length > 1 && <span className="text-muted-foreground">· {allDocs.length} documents</span>}
            </div>
          </div>
          <Button onClick={() => addMutation.mutate(f.id)} disabled={addMutation.isPending}>
            <Plus className="mr-1 h-4 w-4" /> Add to leads
          </Button>
        </div>
      </div>

      <div className="grid gap-6 p-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Overview">
            <Field label="Job number">{f.job_number}</Field>
            <Field label="Doc number">{f.doc_number}</Field>
            <Field label="Job type">{`${f.job_type ?? "—"} · ${f.job_type_label ?? ""}`}</Field>
            <Field label="Job status">{f.job_status_description ?? f.job_status}</Field>
            <Field label="Borough">{f.borough}</Field>
            <Field label="Full address">{f.full_address}</Field>
            <Field label="House / Street">{[f.house_number, f.street_name].filter(Boolean).join(" ")}</Field>
            <Field label="BIN">{f.bin_number}</Field>
            <Field label="BBL">{f.bbl}</Field>
            <Field label="Block / Lot">{[f.block, f.lot].filter(Boolean).join(" / ")}</Field>
            <Field label="Community Board">{f.community_board}</Field>
            <Field label="Council District">{f.council_district}</Field>
            <Field label="Census Tract">{f.census_tract}</Field>
            <Field label="NTA">{f.nta_name}</Field>
            <Field label="Building type">{f.building_type}</Field>
            <Field label="Building class">{f.building_class}</Field>
            <Field label="Cluster">{f.cluster}</Field>
            <Field label="Owner type">{f.owner_type}</Field>
            {f.job_description && (
              <div className="col-span-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{f.job_description}</p>
              </div>
            )}
          </Card>

          <Card title="Zoning">
            <Field label="Zoning Dist 1">{f.zoning_dist1}</Field>
            <Field label="Zoning Dist 2">{f.zoning_dist2}</Field>
            <Field label="Zoning Dist 3">{f.zoning_dist3}</Field>
            <Field label="Special Dist 1">{f.special_district_1}</Field>
            <Field label="Special Dist 2">{f.special_district_2}</Field>
            <Field label="Site fill">{f.site_fill}</Field>
            <Field label="Existing zoning sqft">{f.existing_zoning_sqft ? fmtNumber(f.existing_zoning_sqft) : "—"}</Field>
            <Field label="Proposed zoning sqft">{f.proposed_zoning_sqft ? fmtNumber(f.proposed_zoning_sqft) : "—"}</Field>
          </Card>

          <Card title="Scope & financials">
            <Field label="Est. cost">{fmtCurrency(f.initial_cost)}</Field>
            <Field label="Est. fee">{fmtCurrency(f.total_est_fee)}</Field>
            <Field label="Fee status">{f.fee_status}</Field>
            <Field label="Floor area">{f.total_construction_floor_area ? `${fmtNumber(f.total_construction_floor_area)} sqft` : "—"}</Field>
            <Field label="Enlargement">{f.enlargement_sq_footage ? `${fmtNumber(f.enlargement_sq_footage)} sqft` : "—"}</Field>
            <Field label="Street frontage">{f.street_frontage ? `${fmtNumber(f.street_frontage)} ft` : "—"}</Field>
            <Field label="Stories (existing → proposed)">{`${f.existing_stories ?? "—"} → ${f.proposed_stories ?? "—"}`}</Field>
            <Field label="Height (existing → proposed)">{`${f.existing_height ?? "—"} → ${f.proposed_height ?? "—"}`}</Field>
            <Field label="Dwelling units">{`${f.existing_dwelling_units ?? "—"} → ${f.proposed_dwelling_units ?? "—"}`}</Field>
            <Field label="Occupancy">{`${f.existing_occupancy ?? "—"} → ${f.proposed_occupancy ?? "—"}`}</Field>
            <Field label="No-good count">{f.job_no_good_count}</Field>
          </Card>

          <Card title="Work types">
            {activeWork.length === 0 ? (
              <p className="col-span-2 text-sm text-muted-foreground">No specific work types flagged.</p>
            ) : (
              <div className="col-span-2 flex flex-wrap gap-2">
                {activeWork.map((w) => (
                  <span key={w.key} className="rounded-md bg-brand-soft px-3 py-1 text-sm text-brand">{w.label}</span>
                ))}
              </div>
            )}
            {f.work_other_description && (
              <div className="col-span-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Other work</div>
                <p className="mt-1 text-sm">{f.work_other_description}</p>
              </div>
            )}
          </Card>

          <Card title="Owner">
            <Field label="Name">{[f.owner_first_name, f.owner_last_name].filter(Boolean).join(" ") || "—"}</Field>
            <Field label="Business">{f.owner_business_name}</Field>
            <Field label="Type">{f.owner_type_detail}</Field>
            <Field label="Mailing">
              {[f.owner_house_number, f.owner_street_name].filter(Boolean).join(" ")}
              {f.owner_city ? `, ${f.owner_city}` : ""}
              {f.owner_state ? `, ${f.owner_state}` : ""}
              {f.owner_zip ? ` ${f.owner_zip}` : ""}
            </Field>
          </Card>

          <Card title="Applicant (architect/engineer)">
            <Field label="Name">{[f.applicant_first_name, f.applicant_last_name].filter(Boolean).join(" ") || "—"}</Field>
            <Field label="Title">{f.applicant_professional_title}</Field>
            <Field label="License #">
              {f.applicant_license_number ? (
                <a href="https://www1.nyc.gov/site/buildings/industry/license-info.page" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                  {f.applicant_license_number} <ExternalLink className="h-3 w-3" />
                </a>
              ) : "—"}
            </Field>
          </Card>

          <RelatedPermits permits={permitsData.permits as never} />

          {allDocs.length > 1 && (
            <section className="rounded-xl border border-border bg-card">
              <h2 className="border-b border-border px-5 py-3 font-display text-sm font-semibold">All Documents on Job ({allDocs.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Doc #</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">Latest action</th>
                      <th className="px-3 py-2 text-left font-medium">Cost</th>
                      <th className="px-3 py-2 text-left font-medium">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allDocs.map((d) => (
                      <tr key={d.id}>
                        <td className="px-3 py-2">{d.doc_number ?? "—"}</td>
                        <td className="px-3 py-2">{d.job_status_description ?? d.job_status ?? "—"}</td>
                        <td className="px-3 py-2">{fmtDate(d.latest_action_date)}</td>
                        <td className="px-3 py-2">{fmtCurrency(d.initial_cost)}</td>
                        <td className="px-3 py-2">{fmtCurrency(d.total_est_fee)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Key dates">
            <Field label="Latest action">{f.latest_action_date ? `${fmtDate(f.latest_action_date)} (${daysAgo(f.latest_action_date)})` : "—"}</Field>
            <Field label="Pre-filed">{fmtDate(f.pre_filing_date)}</Field>
            <Field label="Paid">{fmtDate(f.paid_date)}</Field>
            <Field label="Fully paid">{fmtDate(f.fully_paid_date)}</Field>
            <Field label="Assigned">{fmtDate(f.assigned_date)}</Field>
            <Field label="Approved">{fmtDate(f.approved_date)}</Field>
            <Field label="Fully permitted">{fmtDate(f.fully_permitted_date)}</Field>
            <Field label="Sign-off">{fmtDate(f.signoff_date)}</Field>
            <Field label="Special action">{fmtDate(f.special_action_date)}</Field>
            <Field label="Special action status">{f.special_action_status}</Field>
            <Field label="DOB run date">{fmtDate(f.dob_run_date)}</Field>
          </Card>

          {f.latitude && f.longitude && (
            <Card title="Location">
              <div className="col-span-2 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-brand" />
                {Number(f.latitude).toFixed(5)}, {Number(f.longitude).toFixed(5)}
              </div>
              <a
                href={`https://www.google.com/maps?q=${f.latitude},${f.longitude}`}
                target="_blank" rel="noreferrer"
                className="col-span-2 inline-flex items-center gap-1 text-sm text-brand hover:underline"
              >
                Open in Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            </Card>
          )}

          <Card title="Flags">
            <div className="col-span-2 flex flex-wrap gap-2">
              {[
                { ok: f.landmarked, label: "Landmarked" },
                { ok: f.adult_estab, label: "Adult estab." },
                { ok: f.loft_board, label: "Loft board" },
                { ok: f.city_owned, label: "City owned" },
                { ok: f.non_profit, label: "Non-profit" },
                { ok: f.little_e, label: "Hazardous" },
                { ok: f.pc_filed, label: "PC filed" },
                { ok: f.efiling_filed, label: "eFiling" },
                { ok: f.professional_cert, label: "Pro cert" },
                { ok: f.withdrawal_flag, label: "Withdrawn" },
                { ok: f.horizontal_enlargement, label: "Horizontal enl." },
                { ok: f.vertical_enlargement, label: "Vertical enl." },
              ].filter((x) => x.ok).map((x) => (
                <span key={x.label} className="rounded-md bg-muted px-2 py-0.5 text-xs">{x.label}</span>
              ))}
            </div>
          </Card>

          <Card title="Source">
            <Field label="Source">{f.data_source}</Field>
            <Field label="Ingested">{fmtDate(f.ingested_at)}</Field>
            <Field label="Last synced">{fmtDate(f.last_synced_at)}</Field>
            <Field label="New this sync">{f.is_new_this_sync ? "Yes" : "No"}</Field>
            <Field label="Lead score">{f.lead_score}</Field>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <h2 className="border-b border-border px-5 py-3 font-display text-sm font-semibold">{title}</h2>
      <div className="grid gap-4 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const empty = children === null || children === undefined || children === "" || children === "—";
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm ${empty ? "text-muted-foreground" : ""}`}>{empty ? "—" : children}</div>
    </div>
  );
}
