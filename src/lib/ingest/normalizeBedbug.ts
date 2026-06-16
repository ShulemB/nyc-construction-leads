type Raw = Record<string, unknown>;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const get = (r: Raw, ...keys: string[]): string | null => {
  const wanted = keys.map(norm);
  for (const rk of Object.keys(r)) {
    if (wanted.includes(norm(rk))) {
      const v = r[rk];
      if (v === null || v === undefined || v === "") return null;
      if (v instanceof Date) return v.toISOString();
      return String(v).trim();
    }
  }
  return null;
};

const date = (v: string | null): string | null => {
  if (!v) return null;
  const cleaned = v.split("T")[0].split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) { const [, mm, dd, yyyy] = m; return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`; }
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
};

const int = (v: string | null): number | null => {
  if (v === null) return null;
  const n = Number(v.replace(/,/g, "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export interface NormalizedBedbug {
  id: string;
  bin: string;
  building_id: string | null;
  registration_id: string | null;
  borough: string | null;
  house_number: string | null;
  street_name: string | null;
  postcode: string | null;
  dwelling_units: number | null;
  infested_unit_count: number | null;
  eradicated_unit_count: number | null;
  re_infested_unit_count: number | null;
  filing_date: string | null;
  filing_period_start_date: string | null;
  filing_period_end_date: string | null;
  latitude: string | null;
  longitude: string | null;
  community_board: string | null;
  council_district: string | null;
  census_tract_2010: string | null;
  bbl: string | null;
  nta: string | null;
}

export function normalizeBedbugRow(raw: Raw): NormalizedBedbug | null {
  const bin = get(raw, "bin", "BIN");
  if (!bin) return null;

  const registration_id = get(raw, "registration_id", "registrationid");
  const filing_date = date(get(raw, "filing_date", "filingdate"));
  const id = `${bin}-${registration_id ?? "noreg"}-${filing_date ?? "nodate"}`;

  return {
    id,
    bin,
    building_id: get(raw, "building_id", "buildingid"),
    registration_id,
    borough: get(raw, "borough"),
    house_number: get(raw, "house_number", "housenumber"),
    street_name: get(raw, "street_name", "streetname"),
    postcode: get(raw, "postcode", "zip", "zipcode"),
    dwelling_units: int(get(raw, "of_dwelling_units", "dwelling_units", "ofdwellingunits", "# of dwelling units")),
    infested_unit_count: int(get(raw, "infested_dwelling_unit_count", "infesteddwellingunitcount", "infested_unit_count")),
    eradicated_unit_count: int(get(raw, "eradicated_unit_count", "eradicatedunitcount")),
    re_infested_unit_count: int(get(raw, "re_infested_dwelling_unit", "reinfesteddwellingunit", "re_infested_unit_count")),
    filing_date,
    filing_period_start_date: date(get(raw, "filing_period_start_date", "filingperiodstartdate")),
    filing_period_end_date: date(get(raw, "filling_period_end_date", "filing_period_end_date", "filingperiodenddate")),
    latitude: get(raw, "latitude"),
    longitude: get(raw, "longitude"),
    community_board: get(raw, "community_board", "communityboard"),
    council_district: get(raw, "city_council_district", "council_district"),
    census_tract_2010: get(raw, "census_tract_2010", "censustract2010"),
    bbl: get(raw, "bbl"),
    nta: get(raw, "nta"),
  };
}
