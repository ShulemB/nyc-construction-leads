import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLicenseByNumber } from "@/lib/license.functions";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";

function formatPhone(p: string | null | undefined): string {
  if (!p) return "";
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith("1")) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return p;
}

function statusVariant(status: string | null | undefined): { className: string; label: string } {
  const s = (status ?? "").toUpperCase();
  if (s === "ACTIVE") return { className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: s };
  if (s === "INACTIVE") return { className: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: s };
  return { className: "bg-muted text-muted-foreground border-border", label: status ?? "—" };
}

export function ApplicantLicensePanel({ licenseNumber }: { licenseNumber: string | number | null | undefined }) {
  const fn = useServerFn(getLicenseByNumber);
  const enabled = licenseNumber !== null && licenseNumber !== undefined && licenseNumber !== "";
  const { data, isLoading } = useQuery({
    queryKey: ["license", String(licenseNumber)],
    queryFn: () => fn({ data: { licenseNumber: licenseNumber as string | number } }),
    enabled,
  });

  return (
    <section className="rounded-xl border border-border bg-card">
      <h2 className="border-b border-border px-5 py-3 font-display text-sm font-semibold">Applicant License Info</h2>
      <div className="p-5">
        {!enabled ? (
          <p className="text-sm text-muted-foreground">No license number on this filing.</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data?.license ? (
          <p className="text-sm text-muted-foreground">No license data available. Import DOB License Info to enrich.</p>
        ) : (
          <LicenseDetails l={data.license as LicenseRow} />
        )}
      </div>
    </section>
  );
}

type LicenseRow = {
  first_name: string | null; last_name: string | null;
  business_name: string | null;
  license_number: number | null; license_type: string | null;
  license_status: string | null;
  business_house_number: string | null; business_street_name: string | null;
  license_business_city: string | null; business_state: string | null; business_zip_code: string | null;
  business_phone_number: string | null; business_email: string | null;
};

function LicenseDetails({ l }: { l: LicenseRow }) {
  const status = statusVariant(l.license_status);
  const fullName = [l.first_name, l.last_name].filter(Boolean).join(" ") || "—";
  const address = [
    [l.business_house_number, l.business_street_name].filter(Boolean).join(" "),
    l.license_business_city,
    [l.business_state, l.business_zip_code].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");
  const phone = formatPhone(l.business_phone_number);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <F label="Full name">{fullName}</F>
      <F label="Business">{l.business_name}</F>
      <F label="License #">{l.license_number}</F>
      <F label="License type">{l.license_type}</F>
      <F label="License status"><Badge variant="outline" className={status.className}>{status.label}</Badge></F>
      <F label="Address">{address || "—"}</F>
      <F label="Phone">
        {l.business_phone_number ? (
          <a href={`tel:${l.business_phone_number.replace(/\D/g, "")}`} className="inline-flex items-center gap-1 text-brand hover:underline">
            <Phone className="h-3 w-3" /> {phone}
          </a>
        ) : "—"}
      </F>
      <F label="Email">
        {l.business_email ? (
          <a href={`mailto:${l.business_email}`} className="inline-flex items-center gap-1 text-brand hover:underline">
            <Mail className="h-3 w-3" /> {l.business_email}
          </a>
        ) : "—"}
      </F>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  const empty = children === null || children === undefined || children === "" || children === "—";
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm ${empty ? "text-muted-foreground" : ""}`}>{empty ? "—" : children}</div>
    </div>
  );
}
