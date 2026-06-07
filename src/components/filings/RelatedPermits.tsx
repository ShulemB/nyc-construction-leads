import { useState, useMemo } from "react";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { ArrowUpDown } from "lucide-react";

type Permit = Record<string, unknown> & {
  id: string;
  work_permit: string | null;
  sequence_number: string | null;
  tracking_number: string | null;
  permit_status: string | null;
  filing_reason: string | null;
  work_type: string | null;
  approved_date: string | null;
  issued_date: string | null;
  expired_date: string | null;
  estimated_job_costs: number | null;
};

const COLUMNS: { key: keyof Permit; label: string; render?: (p: Permit) => React.ReactNode }[] = [
  { key: "work_permit", label: "Work Permit" },
  { key: "sequence_number", label: "Seq #" },
  { key: "permit_status", label: "Status" },
  { key: "filing_reason", label: "Filing Reason" },
  { key: "work_type", label: "Work Type" },
  { key: "approved_date", label: "Approved", render: (p) => fmtDate(p.approved_date) },
  { key: "issued_date", label: "Issued", render: (p) => fmtDate(p.issued_date) },
  { key: "expired_date", label: "Expired", render: (p) => fmtDate(p.expired_date) },
  { key: "estimated_job_costs", label: "Est. Cost", render: (p) => fmtCurrency(p.estimated_job_costs) },
  { key: "tracking_number", label: "Tracking #" },
];

export function RelatedPermits({ permits }: { permits: Permit[] }) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof Permit>("issued_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const t = filter.trim().toLowerCase();
    let rows = permits;
    if (t) {
      rows = rows.filter((p) =>
        COLUMNS.some((c) => String(p[c.key] ?? "").toLowerCase().includes(t)),
      );
    }
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
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
    const p = permits[0];
    return (
      <section className="rounded-xl border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3 font-display text-sm font-semibold">Related Approved Permit</h2>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {COLUMNS.map((c) => (
            <div key={String(c.key)}>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="mt-1 text-sm">{c.render ? c.render(p) : (p[c.key] as React.ReactNode) ?? "—"}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

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
              {COLUMNS.map((c) => (
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
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                {COLUMNS.map((c) => (
                  <td key={String(c.key)} className="whitespace-nowrap px-3 py-2">
                    {c.render ? c.render(p) : (p[c.key] as React.ReactNode) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
