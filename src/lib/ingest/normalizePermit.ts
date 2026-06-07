type Row = Record<string, unknown>;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const get = (r: Row, ...keys: string[]): string | null => {
  const wanted = keys.map(norm);
  for (const rk of Object.keys(r)) {
    if (wanted.includes(norm(rk))) {
      const v = r[rk];
      if (v === null || v === undefined || v === "") return null;
      return String(v).trim();
    }
  }
  return null;
};

const num = (v: string | null): number | null => {
  if (v === null) return null;
  const cleaned = v.replace(/[$,]/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const date = (v: string | null): string | null => {
  if (!v) return null;
  const cleaned = v.split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, mm, dd, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  const t = Date.parse(cleaned);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
};

export interface NormalizedPermit {
  work_permit: string | null;
  sequence_number: string | null;
  tracking_number: string | null;
  job_filing_number: string | null;
  [k: string]: unknown;
}

export function normalizePermit(row: Row): NormalizedPermit | null {
  const work_permit = get(row, "work_permit", "permit_number");
  const sequence_number = get(row, "sequence_number", "sequence__", "sequence_no");
  const tracking_number = get(row, "tracking_number", "tracking__", "tracking_no");
  const job_filing_number = get(row, "job_filing_number", "job__", "job_number");

  if (!work_permit && !tracking_number) return null;

  return {
    work_permit,
    sequence_number,
    tracking_number,
    job_filing_number,

    bin: get(row, "bin", "bin__"),
    bbl: get(row, "bbl"),
    borough: get(row, "borough"),
    house_no: get(row, "house_no", "house_number", "house__"),
    street_name: get(row, "street_name"),
    block: get(row, "block"),
    lot: get(row, "lot"),
    c_b_no: get(row, "c_b_no", "community_board", "cb_no"),

    filing_status: get(row, "filing_status"),
    permit_status: get(row, "permit_status", "current_status"),
    filing_reason: get(row, "filing_reason"),
    work_type: get(row, "work_type"),
    permit_type: get(row, "permit_type"),
    permit_subtype: get(row, "permit_subtype"),
    work_on_floor: get(row, "work_on_floor"),
    work_retaining_wall: get(row, "work_retaining_wall"),

    issued_date: date(get(row, "issued_date", "issuance_date")),
    approved_date: date(get(row, "approved_date")),
    expired_date: date(get(row, "expired_date", "expiration_date")),
    job_start_date: date(get(row, "job_start_date")),

    estimated_job_costs: num(get(row, "estimated_job_costs", "estimated_job_cost", "job_cost")),

    owner_business_name: get(row, "owner_business_name", "owner_s_business_name"),
    owner_name: get(row, "owner_name"),
    applicant_first_name: get(row, "applicant_first_name", "applicant_s_first_name"),
    applicant_last_name: get(row, "applicant_last_name", "applicant_s_last_name"),
    applicant_business_name: get(row, "applicant_business_name", "applicant_s_business_name"),
    applicant_license_number: get(row, "applicant_license", "applicant_license__", "applicant_license_number"),
    applicant_professional_title: get(row, "applicant_professional_title"),

    raw: row,
    last_synced_at: new Date().toISOString(),
  };
}
