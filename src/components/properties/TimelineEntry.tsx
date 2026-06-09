import { useState } from "react";
import { ChevronDown, ChevronRight, Mail, Phone } from "lucide-react";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

type V = string | number | null | undefined;
type Row = Record<string, V>;

const TYPE_STYLES = {
  filing: { border: "border-l-blue-500", label: "Job Filing", chip: "bg-blue-500/10 text-blue-600" },
  permit: { border: "border-l-orange-500", label: "Permit", chip: "bg-orange-500/10 text-orange-600" },
};

export function TimelineEntry({
  type, sortDate, record, license,
}: {
  type: "filing" | "permit";
  sortDate: string | null;
  record: Row;
  license: Row | null;
}) {
  const [open, setOpen] = useState(false);
  const styles = TYPE_STYLES[type];

  const headerKey = type === "filing"
    ? `${record.job_type ?? "—"} · ${record.job_status ?? "—"}`
    : `${record.work_type ?? "—"} · ${record.permit_status ?? "—"}`;
  const applicant = [record.applicant_first_name, record.applicant_last_name].filter(Boolean).join(" ") || record.applicant_business_name || "—";
  const cost = type === "filing" ? record.initial_cost : record.estimated_job_costs;

  return (
    <article className={`rounded-lg border border-border ${styles.border} border-l-4 bg-card`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${styles.chip}`}>{styles.label}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm">{headerKey}</div>
          <div className="truncate text-xs text-muted-foreground">{applicant}</div>
        </div>
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium">{fmtCurrency(cost ?? null, true)}</div>
          <div className="text-xs text-muted-foreground">{fmtDate(sortDate)}</div>
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-muted/20 px-5 py-4">
          {type === "filing" ? <FilingBody r={record} /> : <PermitBody r={record} />}
          {license && <LicensePanel l={license} />}
        </div>
      )}
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function FilingBody({ r }: { r: Row }) {
  const workChips: string[] = [];
  for (const [k, label] of [
    ["plumbing", "Plumbing"], ["mechanical", "Mechanical"], ["boiler", "Boiler"],
    ["fuel_burning", "Fuel Burning"], ["fuel_storage", "Fuel Storage"], ["standpipe", "Standpipe"],
    ["sprinkler", "Sprinkler"], ["fire_alarm", "Fire Alarm"], ["equipment", "Equipment"],
    ["fire_suppression", "Fire Suppression"], ["curb_cut", "Curb Cut"], ["other", "Other"],
  ] as const) {
    const v = r[k];
    if (typeof v === "string" && ["X", "Y", "YES", "TRUE", "1"].includes(v.toUpperCase())) workChips.push(label);
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Group title="Filing">
        <Field label="Job #">{r.job_number}</Field>
        <Field label="Doc #">{r.doc_number}</Field>
        <Field label="Type">{r.job_type}</Field>
        <Field label="Status">{r.job_status_descrp ?? r.job_status}</Field>
        <Field label="Withdrawal">{r.withdrawal_flag}</Field>
      </Group>
      <Group title="Applicant">
        <Field label="First name">{r.applicant_first_name}</Field>
        <Field label="Last name">{r.applicant_last_name}</Field>
        <Field label="Title">{r.applicant_professional_title}</Field>
        <Field label="License #">{r.applicant_license}</Field>
      </Group>
      <Group title="Dates">
        <Field label="Pre-Filing">{fmtDate(r.pre_filing_date as string | null)}</Field>
        <Field label="Paid">{fmtDate(r.paid as string | null)}</Field>
        <Field label="Fully Paid">{fmtDate(r.fully_paid as string | null)}</Field>
        <Field label="Assigned">{fmtDate(r.assigned as string | null)}</Field>
        <Field label="Approved">{fmtDate(r.approved as string | null)}</Field>
        <Field label="Fully Permitted">{fmtDate(r.fully_permitted as string | null)}</Field>
        <Field label="Sign-Off">{fmtDate(r.signoff_date as string | null)}</Field>
      </Group>
      <Group title="Costs">
        <Field label="Initial Cost">{fmtCurrency(r.initial_cost ?? null)}</Field>
        <Field label="Total Est. Fee">{fmtCurrency(r.total_est_fee ?? null)}</Field>
        <Field label="Fee Status">{r.fee_status}</Field>
      </Group>
      {r.job_description && (
        <div className="rounded-md border border-border bg-card p-3 lg:col-span-2">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</h4>
          <p className="text-sm">{r.job_description}</p>
        </div>
      )}
      {workChips.length > 0 && (
        <div className="rounded-md border border-border bg-card p-3 lg:col-span-2">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work Types</h4>
          <div className="flex flex-wrap gap-1.5">
            {workChips.map((c) => <span key={c} className="rounded-md bg-brand-soft px-2 py-0.5 text-xs text-brand">{c}</span>)}
          </div>
        </div>
      )}
      <Group title="Proposed Dimensions">
        <Field label="Stories">{r.proposed_stories}</Field>
        <Field label="Height">{r.proposed_height}</Field>
        <Field label="Floor Area">{r.total_construction_floor_area}</Field>
        <Field label="Dwelling Units">{r.proposed_dwelling_units}</Field>
        <Field label="Occupancy">{r.proposed_occupancy}</Field>
      </Group>
    </div>
  );
}

function PermitBody({ r }: { r: Row }) {
  const showFilingRep = r.filing_rep_first_name || r.filing_rep_last_name || r.filing_rep_business_name;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Group title="Permit">
        <Field label="Work Permit #">{r.work_permit}</Field>
        <Field label="Job Filing #">{r.job_filing_number}</Field>
        <Field label="Sequence #">{r.sequence_number}</Field>
        <Field label="Tracking #">{r.tracking_number}</Field>
        <Field label="Filing Reason">{r.filing_reason}</Field>
        <Field label="Work Type">{r.work_type}</Field>
        <Field label="Status">{r.permit_status}</Field>
      </Group>
      <Group title="Applicant">
        <Field label="First name">{r.applicant_first_name}</Field>
        <Field label="Middle">{r.applicant_middle_name}</Field>
        <Field label="Last name">{r.applicant_last_name}</Field>
        <Field label="Business">{r.applicant_business_name}</Field>
        <Field label="Business address">{r.applicant_business_address}</Field>
        <Field label="License #">{r.applicant_license}</Field>
        <Field label="License Type">{r.permittee_license_type}</Field>
      </Group>
      {showFilingRep && (
        <Group title="Filing Representative">
          <Field label="First name">{r.filing_rep_first_name}</Field>
          <Field label="Middle initial">{r.filing_rep_middle_initial}</Field>
          <Field label="Last name">{r.filing_rep_last_name}</Field>
          <Field label="Business">{r.filing_rep_business_name}</Field>
        </Group>
      )}
      <Group title="Dates">
        <Field label="Approved">{fmtDate(r.approved_date as string | null)}</Field>
        <Field label="Issued">{fmtDate(r.issued_date as string | null)}</Field>
        <Field label="Expired">{fmtDate(r.expired_date as string | null)}</Field>
      </Group>
      <Group title="Job">
        <Field label="Estimated Cost">{fmtCurrency(r.estimated_job_costs ?? null)}</Field>
        <Field label="Floor">{r.work_on_floor}</Field>
        <Field label="Apt/Condo">{r.apt_condo_no}</Field>
      </Group>
      {r.job_description && (
        <div className="rounded-md border border-border bg-card p-3 lg:col-span-2">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</h4>
          <p className="text-sm">{r.job_description}</p>
        </div>
      )}
      <Group title="Owner">
        <Field label="Name">{r.owner_name}</Field>
        <Field label="Business">{r.owner_business_name}</Field>
        <Field label="Address">{r.owner_street_address}</Field>
        <Field label="City">{r.owner_city}</Field>
        <Field label="State">{r.owner_state}</Field>
        <Field label="ZIP">{r.owner_zip_code}</Field>
      </Group>
    </div>
  );
}

function formatPhone(p: V): string {
  if (typeof p !== "string") return "";
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith("1")) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return p;
}

function statusVariant(status: V): { className: string; label: string } {
  const s = (typeof status === "string" ? status : "").toUpperCase();
  if (s === "ACTIVE") return { className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: s };
  if (s === "INACTIVE") return { className: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: s };
  return { className: "bg-muted text-muted-foreground border-border", label: typeof status === "string" ? status : "—" };
}

function LicensePanel({ l }: { l: Row }) {
  const status = statusVariant(l.license_status);
  const fullName = [l.first_name, l.last_name].filter(Boolean).join(" ") || "—";
  const address = [
    [l.business_house_number, l.business_street_name].filter(Boolean).join(" "),
    l.license_business_city,
    [l.business_state, l.business_zip_code].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");
  const phoneFmt = formatPhone(l.business_phone_number);

  return (
    <div className="mt-3 rounded-md border border-brand/30 bg-brand-soft/40 p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand">Applicant License Info</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name">{fullName}</Field>
        <Field label="Business">{l.business_name}</Field>
        <Field label="License #">{l.license_number}</Field>
        <Field label="License type">{l.license_type}</Field>
        <Field label="Status"><Badge variant="outline" className={status.className}>{status.label}</Badge></Field>
        <Field label="Address">{address}</Field>
        <Field label="Phone">
          {typeof l.business_phone_number === "string" && l.business_phone_number ? (
            <a href={`tel:${l.business_phone_number.replace(/\D/g, "")}`} className="inline-flex items-center gap-1 text-brand hover:underline">
              <Phone className="h-3 w-3" /> {phoneFmt}
            </a>
          ) : null}
        </Field>
        <Field label="Email">
          {typeof l.business_email === "string" && l.business_email ? (
            <a href={`mailto:${l.business_email}`} className="inline-flex items-center gap-1 text-brand hover:underline">
              <Mail className="h-3 w-3" /> {l.business_email}
            </a>
          ) : null}
        </Field>
      </div>
    </div>
  );
}
