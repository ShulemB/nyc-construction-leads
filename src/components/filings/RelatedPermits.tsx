import { Fragment, useState, useMemo } from "react";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react";

type Permit = Record<string, unknown> & {
  id: string;
  work_permit: string | null;
  sequence_number: string | null;
  tracking_number: string | null;
  job_filing_number: string | null;
  bin: string | null;
  bbl: string | null;
  borough: string | null;
  house_no: string | null;
  street_name: string | null;
  block: string | null;
  lot: string | null;
  c_b_no: string | null;
  filing_status: string | null;
  permit_status: string | null;
  filing_reason: string | null;
  work_type: string | null;
  permit_type: string | null;
  permit_subtype: string | null;
  work_on_floor: string | null;
  work_retaining_wall: string | null;
  approved_date: string | null;
  issued_date: string | null;
  expired_date: string | null;
  job_start_date: string | null;
  estimated_job_costs: number | null;
  owner_business_name: string | null;
  owner_name: string | null;
  applicant_first_name: string | null;
  applicant_last_name: string | null;
  applicant_business_name: string | null;
  applicant_license_number: string | null;
  applicant_professional_title: string | null;
  match_status: string | null;
  match_method: string | null;
  matched_job_number: string | null;
  data_source: string | null;
  last_synced_at: string | null;
};

const TABLE_COLS: { key: keyof Permit; label: string; render?: (p: Permit) => React.ReactNode }[] = [
  { key: "work_permit", label: "Work Permit" },
  { key: "sequence_number", label: "Seq #" },
  { key: "permit_type", label: "Type" },
  { key: "permit_subtype", label: "Subtype" },
  { key: "permit_status", label: "Status" },
  { key: "filing_reason", label: "Filing Reason" },
  { key: "work_type", label: "Work Type" },
  { key: "approved_date", label: "Approved", render: (p) => fmtDate(p.approved_date) },
  { key: "issued_date", label: "Issued", render: (p) => fmtDate(p.issued_date) },
  { key: "expired_date", label: "Expires", render: (p) => fmtDate(p.expired_date) },
  { key: "estimated_job_costs", label: "Est. Cost", render: (p) => fmtCurrency(p.estimated_job_costs) },
  { key: "tracking_number", label: "Tracking #" },
];

const FIELD_GROUPS: { title: string; fields: { key: keyof Permit; label: string; render?: (p: Permit) => React.ReactNode }[] }[] = [
  {
    title: "Permit",
    fields: [
      { key: "work_permit", label: "Work Permit" },
      { key: "sequence_number", label: "Sequence #" },
      { key: "tracking_number", label: "Tracking #" },
      { key: "job_filing_number", label: "Job Filing #" },
      { key: "permit_type", label: "Permit Type" },
      { key: "permit_subtype", label: "Permit Subtype" },
      { key: "work_type", label: "Work Type" },
      { key: "filing_reason", label: "Filing Reason" },
      { key: "filing_status", label: "Filing Status" },
      { key: "permit_status", label: "Permit Status" },
      { key: "work_on_floor", label: "Work On Floor" },
      { key: "work_retaining_wall", label: "Retaining Wall" },
      { key: "estimated_job_costs", label: "Estimated Cost", render: (p) => fmtCurrency(p.estimated_job_costs) },
    ],
  },
  {
    title: "Dates",
    fields: [
      { key: "approved_date", label: "Approved", render: (p) => fmtDate(p.approved_date) },
      { key: "issued_date", label: "Issued", render: (p) => fmtDate(p.issued_date) },
      { key: "job_start_date", label: "Job Start", render: (p) => fmtDate(p.job_start_date) },
      { key: "expired_date", label: "Expires", render: (p) => fmtDate(p.expired_date) },
      { key: "last_synced_at", label: "Last Synced", render: (p) => fmtDate(p.last_synced_at) },
    ],
  },
  {
    title: "Location",
    fields: [
      { key: "borough", label: "Borough" },
      { key: "house_no", label: "House No" },
      { key: "street_name", label: "Street" },
      { key: "bin", label: "BIN" },
      { key: "bbl", label: "BBL" },
      { key: "block", label: "Block" },
      { key: "lot", label: "Lot" },
      { key: "c_b_no", label: "Community Board" },
    ],
  },
  {
    title: "Owner",
    fields: [
      { key: "owner_name", label: "Owner" },
      { key: "owner_business_name", label: "Owner Business" },
    ],
  },
  {
    title: "Applicant",
    fields: [
      { key: "applicant_first_name", label: "First Name" },
      { key: "applicant_last_name", label: "Last Name" },
      { key: "applicant_business_name", label: "Business" },
      { key: "applicant_professional_title", label: "Title" },
      { key: "applicant_license_number", label: "License #" },
    ],
  },
  {
    title: "Match",
    fields: [
      { key: "matched_job_number", label: "Matched Job #" },
      { key: "match_status", label: "Match Status" },
      { key: "match_method", label: "Match Method" },
      { key: "data_source", label: "Source" },
    ],
  },
];

function PermitDetail({ p }: { p: Permit }) {
  return (
    <div className="space-y-5 bg-muted/20 p-5">
      {FIELD_GROUPS.map((g) => (
        <div key={g.title}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {g.fields.map((f) => {
              const val = f.render ? f.render(p) : (p[f.key] as React.ReactNode);
              const empty = val === null || val === undefined || val === "" || val === "—";
              return (
                <div key={String(f.key)}>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{f.label}</div>
                  <div className={`mt-0.5 text-sm ${empty ? "text-muted-foreground" : ""}`}>{empty ? "—" : val}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RelatedPermits({ permits }: { permits: Permit[] }) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof Permit>("issued_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const t = filter.trim().toLowerCase();
    let rows = permits;
    if (t) {
      rows = rows.filter((p) =>
        TABLE_COLS.some((c) => String(p[c.key] ?? "").toLowerCase().includes(t)),
      );
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [permits, filter, sortKey, sortDir]);

  if (permits.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3 font-display text-sm font-semibold">Related Approved Permits</h2>
        <p className="px-5 py-6 text-sm text-muted-foreground">No approved permits linked to this filing yet.</p>
      </section>
    );
  }

  if (permits.length === 1) {
    return (
      <section className="rounded-xl border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3 font-display text-sm font-semibold">Related Approved Permit</h2>
        <PermitDetail p={permits[0]} />
      </section>
    );
  }

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <h2 className="font-display text-sm font-semibold">Related Approved Permits ({permits.length})</h2>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter permits…"
          className="rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-8 px-2"></th>
              {TABLE_COLS.map((c) => (
                <th
                  key={String(c.key)}
                  onClick={() => {
                    if (sortKey === c.key) setSortDir(sortDir === "asc" ? "desc" : "asc");
                    else { setSortKey(c.key); setSortDir("asc"); }
                  }}
                  className="cursor-pointer px-3 py-2 text-left font-medium hover:text-foreground"
                >
                  <span className="inline-flex items-center gap-1">{c.label}<ArrowUpDown className="h-3 w-3 opacity-50" /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => {
              const isOpen = expanded.has(p.id);
              return (
                <Fragment key={p.id}>
                  <tr className="hover:bg-muted/30 cursor-pointer" onClick={() => toggle(p.id)}>
                    <td className="px-2 text-muted-foreground">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    {TABLE_COLS.map((c) => (
                      <td key={String(c.key)} className="whitespace-nowrap px-3 py-2">
                        {c.render ? c.render(p) : (p[c.key] as React.ReactNode) ?? "—"}
                      </td>
                    ))}
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={TABLE_COLS.length + 1} className="p-0">
                        <PermitDetail p={p} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
