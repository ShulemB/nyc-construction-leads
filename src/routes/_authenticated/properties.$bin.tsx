import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { getProperty } from "@/lib/properties.functions";
import { addLead } from "@/lib/leads.functions";
import { listSwosByBin } from "@/lib/swo.functions";
import { PropertyInfoCard } from "@/components/properties/PropertyInfoCard";
import { TimelineEntry } from "@/components/properties/TimelineEntry";
import { ViewDeedButton } from "@/components/leads/ViewDeedButton";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Star, Ban } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/properties/$bin")({
  head: ({ params }) => ({ meta: [{ title: `Property BIN ${params.bin} — PermitLeads` }] }),
  component: PropertyDetail,
});

type LicenseRow = { [k: string]: string | number | null };

function PropertyDetail() {
  const { bin } = Route.useParams();
  const fn = useServerFn(getProperty);
  const { data } = useSuspenseQuery({
    queryKey: ["property", bin],
    queryFn: () => fn({ data: { bin } }),
  });
  const qc = useQueryClient();
  const addFn = useServerFn(addLead);
  const add = useMutation({
    mutationFn: () => addFn({ data: { bin } }),
    onSuccess: () => { toast.success("Added to leads"); qc.invalidateQueries({ queryKey: ["leads"] }); },
    onError: (e) => toast.error(e.message),
  });
  const swosFn = useServerFn(listSwosByBin);
  const { data: swoData } = useQuery({
    queryKey: ["swos", bin],
    queryFn: () => swosFn({ data: { bin } }),
  });
  const swos = (swoData?.swos ?? []) as Array<Record<string, string | number | null>>;

  if (!data.property) {
    return (
      <AppShell>
        <div className="p-12 text-center">
          <p className="text-sm text-muted-foreground">Property not found.</p>
          <Link to="/properties" className="mt-4 inline-block text-sm text-brand hover:underline">← Back to properties</Link>
        </div>
      </AppShell>
    );
  }

  const property = data.property as Record<string, string | number | null>;
  const filings = data.filings as Array<Record<string, string | number | null>>;
  const permits = data.permits as Array<Record<string, string | number | null>>;
  const licenses = data.licenses as LicenseRow[];
  const licenseMap: Record<string, LicenseRow> = {};
  for (const l of licenses) {
    const ln = l.license_number;
    if (typeof ln === "string" && !licenseMap[ln]) licenseMap[ln] = l;
  }

  type TLEntry =
    | { type: "filing"; sortDate: string | null; record: Record<string, string | number | null> }
    | { type: "permit"; sortDate: string | null; record: Record<string, string | number | null> };
  const timeline: TLEntry[] = [
    ...filings.map((f) => ({
      type: "filing" as const,
      sortDate: (f.latest_action_date ?? f.approved ?? f.pre_filing_date) as string | null,
      record: f,
    })),
    ...permits.map((p) => ({
      type: "permit" as const,
      sortDate: (p.issued_date ?? p.approved_date) as string | null,
      record: p,
    })),
  ].sort((a, b) => {
    if (!a.sortDate) return 1;
    if (!b.sortDate) return -1;
    return b.sortDate.localeCompare(a.sortDate);
  });

  return (
    <AppShell>
      <div className="border-b border-border bg-card/30 px-8 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link to="/properties" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand">
              <ChevronLeft className="h-3 w-3" /> Properties
            </Link>
            <h1 className="mt-1 truncate font-display text-2xl font-bold">
              {[property.house_number, property.street_name].filter(Boolean).join(" ") || `BIN ${bin}`}
            </h1>
            <p className="text-sm text-muted-foreground">{property.borough} · BIN {bin}</p>
          </div>
          <button
            onClick={() => add.mutate()}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
          >
            <Star className="h-4 w-4" /> Add to leads
          </button>
          <ViewDeedButton
            block={property.block as string | null}
            lot={property.lot as string | null}
            borough={property.borough as string | null}
            bbl={property.bbl as string | null}
          />
        </div>
      </div>

      <div className="grid gap-6 p-8 lg:grid-cols-[minmax(280px,30%)_1fr]">
        <PropertyInfoCard property={property} />

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Activity timeline</h2>
            <p className="text-xs text-muted-foreground">{filings.length} filings · {permits.length} permits · sorted by latest activity</p>
          </div>
          {timeline.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No filings or permits for this property.
            </div>
          ) : (
            <div className="space-y-2">
              {timeline.map((entry, i) => {
                const ln = entry.record.applicant_license;
                const license = typeof ln === "string" ? licenseMap[ln] ?? null : null;
                return (
                  <TimelineEntry
                    key={`${entry.type}-${entry.record.id ?? i}`}
                    type={entry.type}
                    sortDate={entry.sortDate}
                    record={entry.record}
                    license={license}
                  />
                );
              })}
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Ban className="h-4 w-4 text-destructive" /> Stop Work Orders
              </h2>
              <p className="text-xs text-muted-foreground">{swos.length} on record</p>
            </div>
            {swos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No stop work orders on record
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Complaint #</th>
                      <th className="px-3 py-2 text-left font-medium">Disposition</th>
                      <th className="px-3 py-2 text-left font-medium">Category</th>
                      <th className="px-3 py-2 text-left font-medium">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {swos.map((s) => {
                      const cat = (s.disposition_category as string | null) ?? "";
                      const isOpen = /active|open|issued|in.?progress/i.test(cat);
                      return (
                        <tr key={s.id as string}>
                          <td className="px-3 py-2 whitespace-nowrap">{s.last_disposition_date ?? "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs">{s.complaint_number}</td>
                          <td className="px-3 py-2">{s.disposition_code_desc ?? s.disposition_code ?? "—"}</td>
                          <td className="px-3 py-2">
                            {cat ? (
                              <Badge variant={isOpen ? "destructive" : "secondary"}>{cat}</Badge>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2">{s.address ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
