import { BOROUGH_MAP, JOB_TYPE_LABELS, JOB_STATUS_LABELS } from "../dob-constants";
import { computeLeadScore } from "./leadScore";

type Row = Record<string, unknown>;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const get = (r: Row, ...keys: string[]): string | null => {
  const wanted = keys.map(norm);
  for (const rk of Object.keys(r)) {
    const n = norm(rk);
    if (wanted.includes(n)) {
      const v = r[rk];
      if (v === null || v === undefined || v === "") return null;
      return String(v).trim();
    }
  }
  return null;
};


const bool = (v: string | null): boolean => {
  if (!v) return false;
  const s = v.toUpperCase().trim();
  return s === "X" || s === "Y" || s === "YES" || s === "TRUE" || s === "1";
};

const num = (v: string | null): number | null => {
  if (v === null) return null;
  const cleaned = v.replace(/[$,]/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const int = (v: string | null): number | null => {
  const n = num(v);
  return n === null ? null : Math.trunc(n);
};

// DOB date formats: "MM/DD/YYYY" or "YYYY-MM-DD" or "MM/DD/YYYY 12:00:00 AM"
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

export interface NormalizedFiling {
  job_number: string;
  doc_number: string | null;
  [k: string]: unknown;
}

export function normalizeFiling(row: Row): NormalizedFiling | null {
  const job_number = get(row, "job_number", "job__", "job #", "job no");
  if (!job_number) return null;

  const boroRaw = get(row, "borough");
  const borough = boroRaw ? BOROUGH_MAP[boroRaw.toUpperCase()] ?? boroRaw.toUpperCase() : null;

  const house_number = get(row, "house_number", "house__", "house #");
  const street_name = get(row, "street_name");
  const full_address = [house_number, street_name].filter(Boolean).join(" ") || null;

  const job_type = get(row, "job_type");
  const job_status = get(row, "job_status");

  const initial_cost = num(get(row, "initial_cost"));
  const total_construction_floor_area = num(get(row, "total_construction_floor_area"));
  const latest_action_date = date(get(row, "latest_action_date"));

  const f: NormalizedFiling = {
    job_number,
    doc_number: get(row, "doc__", "doc #", "doc_number"),
    borough,
    house_number,
    street_name,
    full_address,
    block: get(row, "block"),
    lot: get(row, "lot"),
    bin_number: get(row, "bin__", "bin #", "bin_number"),
    bbl: get(row, "bbl"),
    community_board: get(row, "community___board", "community board"),
    council_district: get(row, "council_district"),
    census_tract: get(row, "census_tract"),
    nta_name: get(row, "nta_name"),
    latitude: num(get(row, "latitude", "gis_latitude")),
    longitude: num(get(row, "longitude", "gis_longitude")),
    zoning_dist1: get(row, "zoning_dist1"),
    zoning_dist2: get(row, "zoning_dist2"),
    zoning_dist3: get(row, "zoning_dist3"),
    special_district_1: get(row, "special_district_1"),
    special_district_2: get(row, "special_district_2"),

    job_type,
    job_type_label: job_type ? JOB_TYPE_LABELS[job_type] ?? null : null,
    job_status,
    job_status_description: job_status ? JOB_STATUS_LABELS[job_status] ?? get(row, "job_status_descrp") : get(row, "job_status_descrp"),
    job_description: get(row, "job_description"),
    building_type: get(row, "building_type"),
    existing_occupancy: get(row, "existing_occupancy"),
    proposed_occupancy: get(row, "proposed_occupancy"),
    building_class: get(row, "building_class"),
    owner_type: get(row, "owner_type"),
    cluster: get(row, "cluster"),

    landmarked: bool(get(row, "landmarked")),
    adult_estab: bool(get(row, "adult_estab")),
    loft_board: bool(get(row, "loft_board")),
    city_owned: bool(get(row, "city_owned")),
    little_e: bool(get(row, "little_e")),
    pc_filed: bool(get(row, "pc_filed")),
    efiling_filed: bool(get(row, "efiling_filed")),
    non_profit: bool(get(row, "non_profit")),
    professional_cert: bool(get(row, "professional_cert")),
    withdrawal_flag: bool(get(row, "withdrawal_flag")),
    horizontal_enlargement: bool(get(row, "horizontal_enlrgmt", "horizontal_enlargement")),
    vertical_enlargement: bool(get(row, "vertical_enlrgmt", "vertical_enlargement")),
    site_fill: get(row, "site_fill"),

    work_plumbing: bool(get(row, "plumbing")),
    work_mechanical: bool(get(row, "mechanical")),
    work_boiler: bool(get(row, "boiler")),
    work_fuel_burning: bool(get(row, "fuel_burning")),
    work_fuel_storage: bool(get(row, "fuel_storage")),
    work_standpipe: bool(get(row, "standpipe")),
    work_sprinkler: bool(get(row, "sprinkler")),
    work_fire_alarm: bool(get(row, "fire_alarm")),
    work_equipment: bool(get(row, "equipment")),
    work_fire_suppression: bool(get(row, "fire_suppression")),
    work_curb_cut: bool(get(row, "curb_cut")),
    work_other: bool(get(row, "other")),
    work_other_description: get(row, "other_description"),

    owner_type_detail: get(row, "owner_s_business_type", "owner_business_type"),
    owner_first_name: get(row, "owner_s_first_name", "owner_first_name"),
    owner_last_name: get(row, "owner_s_last_name", "owner_last_name"),
    owner_business_name: get(row, "owner_s_business_name", "owner_business_name"),
    owner_house_number: get(row, "owner_s_house_number", "owner_house_number"),
    owner_street_name: get(row, "owner_s_house_street_name", "owner_house_street_name"),
    owner_city: get(row, "city", "owner_city"),
    owner_state: get(row, "state", "owner_state"),
    owner_zip: get(row, "zip", "owner_zip"),

    applicant_first_name: get(row, "applicant_s_first_name", "applicant_first_name"),
    applicant_last_name: get(row, "applicant_s_last_name", "applicant_last_name"),
    applicant_professional_title: get(row, "applicant_professional_title"),
    applicant_license_number: get(row, "applicant_license__", "applicant_license_number"),

    initial_cost,
    total_est_fee: num(get(row, "total_est__fee", "total_est_fee")),
    fee_status: get(row, "fee_status"),
    total_construction_floor_area,
    existing_zoning_sqft: num(get(row, "existing_zoning_sqft")),
    proposed_zoning_sqft: num(get(row, "proposed_zoning_sqft")),
    enlargement_sq_footage: num(get(row, "enlargement_sq_footage")),
    street_frontage: num(get(row, "street_frontage")),
    existing_stories: int(get(row, "existing_no__of_stories", "existing_stories")),
    proposed_stories: int(get(row, "proposed_no__of_stories", "proposed_stories")),
    existing_height: num(get(row, "existing_height")),
    proposed_height: num(get(row, "proposed_height")),
    existing_dwelling_units: int(get(row, "existing_dwelling_units")),
    proposed_dwelling_units: int(get(row, "proposed_dwelling_units")),
    job_no_good_count: int(get(row, "job_no_good_count")),

    latest_action_date,
    pre_filing_date: date(get(row, "pre__filing_date", "pre_filing_date")),
    paid_date: date(get(row, "paid")),
    fully_paid_date: date(get(row, "fully_paid")),
    assigned_date: date(get(row, "assigned")),
    approved_date: date(get(row, "approved")),
    fully_permitted_date: date(get(row, "fully_permitted")),
    signoff_date: date(get(row, "signoff_date")),
    special_action_date: date(get(row, "special_action_date")),
    special_action_status: get(row, "special_action_status"),
    dob_run_date: date(get(row, "dobrundate", "dob_run_date")),

    data_source: "csv_upload",
    lead_score: computeLeadScore({
      latest_action_date,
      job_type,
      initial_cost,
      total_construction_floor_area,
      job_status,
    }),
    last_synced_at: new Date().toISOString(),
  };

  return f;
}
