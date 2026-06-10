type Raw = Record<string, unknown>;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const get = (r: Raw, ...keys: string[]): string | null => {
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

const date = (v: string | null): string | null => {
  if (!v) return null;
  const cleaned = v.split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) { const [, mm, dd, yyyy] = m; return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`; }
  const t = Date.parse(cleaned);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
};

const num = (v: string | null): number | null => {
  if (v === null) return null;
  const n = Number(v.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
};

const int = (v: string | null): number | null => {
  const n = num(v);
  return n === null ? null : Math.trunc(n);
};

export interface NormalizedSwo {
  complaint_number: string;
  bin: string;
  borough_name: string | null;
  disposition_code: string | null;
  disposition_code_desc: string | null;
  disposition_category: string | null;
  last_disposition_date: string | null;
  last_disposition_year: number | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  community_board: string | null;
}

export function normalizeSwoRow(raw: Raw): NormalizedSwo | null {
  const complaint_number = get(raw, "Complaint Number", "complaint_number", "complaintnumber");
  const bin = get(raw, "BIN", "bin");
  if (!complaint_number || !bin) return null;
  return {
    complaint_number,
    bin,
    borough_name: get(raw, "Borough Name", "borough_name", "borough"),
    disposition_code: get(raw, "Disposition Code", "disposition_code"),
    disposition_code_desc: get(raw, "Disposition Code Description", "disposition_code_desc", "disposition_description"),
    disposition_category: get(raw, "Disposition Category", "disposition_category"),
    last_disposition_date: date(get(raw, "Last Disposition Date", "last_disposition_date")),
    last_disposition_year: int(get(raw, "Last Disposition Year", "last_disposition_year")),
    latitude: num(get(raw, "Latitude", "latitude")),
    longitude: num(get(raw, "Longitude", "longitude")),
    address: get(raw, "Address", "address"),
    community_board: get(raw, "Community Board", "community_board"),
  };
}
