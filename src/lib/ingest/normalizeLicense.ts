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

const toInt = (v: string | null): number | null => {
  if (v === null) return null;
  const n = parseInt(v.replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const toFloat = (v: string | null): number | null => {
  if (v === null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

export interface NormalizedLicense {
  license_sl_no: number | null;
  license_number: string | null;
  [k: string]: unknown;
}

export function normalizeLicense(row: Row): NormalizedLicense | null {
  const licenseNumberRaw = get(row, "license_number");
  const licenseNumber = licenseNumberRaw ? licenseNumberRaw.trim() : null;
  if (!licenseNumber) return null;


  return {
    license_sl_no: toInt(get(row, "license_sl_no")),
    license_type: get(row, "license_type"),
    license_number: licenseNumber,
    last_name: get(row, "last_name"),
    first_name: get(row, "first_name"),
    business_name: get(row, "business_name"),
    business_house_number: get(row, "number", "business_house_number"),
    business_street_name: get(row, "street", "business_street_name"),
    license_business_city: get(row, "license_business_city", "city"),
    business_state: get(row, "business_state"),
    business_zip_code: get(row, "postcode", "business_zip_code", "zip"),
    business_email: get(row, "business_email"),
    business_phone_number: get(row, "business_phone_number", "phone"),
    license_status: get(row, "license_status"),
    lat: toFloat(get(row, "latitude", "lat")),
    long: toFloat(get(row, "longitude", "long")),
    community_board: toInt(get(row, "community_board")),
    council_district: toInt(get(row, "council_district")),
    census_tract: toInt(get(row, "census_tract")),
    bin: toInt(get(row, "bin")),
    bbl: get(row, "bbl"),
    nta: get(row, "nta"),
  };
}
