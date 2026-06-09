import { computeLeadScore } from "./leadScore";
import { BOROUGH_MAP } from "../dob-constants";

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
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
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

const normBorough = (v: string | null): string | null => {
  if (!v) return null;
  return BOROUGH_MAP[v.toUpperCase()] ?? v.toUpperCase();
};

// ─── Property from filing row ──────────────────────────────────────────────

export interface NormalizedProperty {
  bin: string;
  [k: string]: unknown;
}

export function normalizePropertyFromFiling(row: Row): NormalizedProperty | null {
  const bin = get(row, "bin", "bin__", "bin #", "bin_number");
  if (!bin) return null;
  return {
    bin,
    borough: normBorough(get(row, "borough")),
    house_number: get(row, "house__", "house_no", "house_number", "house #"),
    street_name: get(row, "street_name"),
    block: get(row, "block"),
    lot: get(row, "lot"),
    bbl: get(row, "bbl"),
    latitude: num(get(row, "gis_latitude", "latitude")),
    longitude: num(get(row, "gis_longitude", "longitude")),
    community_board: get(row, "community___board", "community_board", "commmunity_board"),
    council_district: get(row, "gis_council_district", "council_district"),
    census_tract: get(row, "gis_census_tract", "census_tract"),
    nta: get(row, "gis_nta_name", "nta", "nta_name"),
    building_type: get(row, "building_type"),
    building_class: get(row, "building_class"),
    landmarked: get(row, "landmarked"),
    adult_estab: get(row, "adult_estab"),
    loft_board: get(row, "loft_board"),
    city_owned: get(row, "city_owned"),
    little_e: get(row, "little_e"),
    cluster: get(row, "cluster"),
    existing_stories: get(row, "existingno_of_stories", "existing_no_of_stories", "existing_stories"),
    existing_height: get(row, "existing_height"),
    existing_dwelling_units: get(row, "existing_dwelling_units"),
    existing_occupancy: get(row, "existing_occupancy"),
    zoning_dist1: get(row, "zoning_dist1"),
    zoning_dist2: get(row, "zoning_dist2"),
    zoning_dist3: get(row, "zoning_dist3"),
    special_district1: get(row, "special_district_1", "special_district1"),
    special_district2: get(row, "special_district_2", "special_district2"),
    street_frontage: get(row, "street_frontage"),
    owner_type: get(row, "owner_type"),
    non_profit: get(row, "non_profit"),
    owner_first_name: get(row, "owner_s_first_name", "owner_first_name"),
    owner_last_name: get(row, "owner_s_last_name", "owner_last_name"),
    owner_business_name: get(row, "owner_s_business_name", "owner_business_name"),
    owner_house_number: get(row, "owner_s_house_number", "owner_house_number"),
    owner_street_name: get(row, "owner_shouse_street_name", "owner_s_house_street_name", "owner_street_name"),
    owner_city: get(row, "city_", "owner_city", "city"),
    owner_state: get(row, "state", "owner_state"),
    owner_zip: get(row, "zip", "owner_zip"),
  };
}

export function normalizePropertyFromPermit(row: Row): NormalizedProperty | null {
  const bin = get(row, "bin");
  if (!bin) return null;
  return {
    bin,
    borough: normBorough(get(row, "borough")),
    house_number: get(row, "house_no", "house_number"),
    street_name: get(row, "street_name"),
    block: get(row, "block"),
    lot: get(row, "lot"),
    bbl: get(row, "bbl"),
    latitude: num(get(row, "latitude", "gis_latitude")),
    longitude: num(get(row, "longitude", "gis_longitude")),
    community_board: get(row, "community_board"),
    council_district: get(row, "council_district"),
    census_tract: get(row, "census_tract"),
    nta: get(row, "nta"),
  };
}

// ─── Filing ────────────────────────────────────────────────────────────────

export interface NormalizedFiling {
  bin: string;
  job_number: string | null;
  [k: string]: unknown;
}

export function normalizeFilingRow(row: Row): NormalizedFiling | null {
  const bin = get(row, "bin", "bin__");
  if (!bin) return null;

  const rawJob = get(row, "job__", "job_number", "job_filing_number", "job #");
  let job_number = rawJob;
  let doc_number = get(row, "doc__", "doc_number", "doc #");
  if (rawJob && !doc_number && rawJob.includes("-")) {
    const dash = rawJob.lastIndexOf("-");
    job_number = rawJob.slice(0, dash);
    doc_number = rawJob.slice(dash + 1);
  }

  const job_type = get(row, "job_type");
  const job_status = get(row, "job_status");
  const latest_action_date = date(get(row, "latest_action_date", "current_status_date"));
  const initial_cost_raw = get(row, "initial_cost");
  const total_construction_floor_area = num(get(row, "total_construction_floor_area"));

  return {
    bin,
    job_number,
    job_s1_no: get(row, "job_s1_no"),
    doc_number,
    job_type,
    job_status,
    job_status_descrp: get(row, "job_status_descrp", "job_status_description"),
    latest_action_date,
    total_construction_floor_area: get(row, "total_construction_floor_area"),
    job_description: get(row, "job_description"),
    job_no_good_count: get(row, "job_no_good_count"),
    withdrawal_flag: get(row, "withdrawal_flag"),
    pc_filed: get(row, "pc_filed"),
    efiling_filed: get(row, "efiling_filed"),
    professional_cert: get(row, "professional_cert"),
    plumbing: get(row, "plumbing"),
    mechanical: get(row, "mechanical"),
    boiler: get(row, "boiler"),
    fuel_burning: get(row, "fuel_burning"),
    fuel_storage: get(row, "fuel_storage"),
    standpipe: get(row, "standpipe"),
    sprinkler: get(row, "sprinkler"),
    fire_alarm: get(row, "fire_alarm"),
    equipment: get(row, "equipment"),
    fire_suppression: get(row, "fire_suppression"),
    curb_cut: get(row, "curb_cut"),
    other: get(row, "other"),
    other_description: get(row, "other_description"),
    applicant_first_name: get(row, "applicant_s_first_name", "applicant_first_name"),
    applicant_last_name: get(row, "applicant_s_last_name", "applicant_last_name"),
    applicant_professional_title: get(row, "applicant_professional_title"),
    applicant_license: get(row, "applicant_license__", "applicant_license", "applicant_license_number"),
    pre_filing_date: date(get(row, "pre__filing_date", "pre_filing_date", "filing_date")),
    paid: date(get(row, "paid")),
    fully_paid: date(get(row, "fully_paid")),
    assigned: date(get(row, "assigned")),
    approved: date(get(row, "approved", "approved_date")),
    fully_permitted: date(get(row, "fully_permitted", "first_permit_date")),
    signoff_date: date(get(row, "signoff_date")),
    special_action_status: get(row, "special_action_status"),
    special_action_date: date(get(row, "special_action_date")),
    dob_run_date: date(get(row, "dobrundate", "dob_run_date")),
    initial_cost: initial_cost_raw,
    total_est_fee: get(row, "total_est__fee", "total_est_fee"),
    fee_status: get(row, "fee_status"),
    existing_zoning_sqft: get(row, "existing_zoning_sqft"),
    proposed_zoning_sqft: get(row, "proposed_zoning_sqft"),
    horizontal_enlrgmt: get(row, "horizontal_enlrgmt"),
    vertical_enlrgmt: get(row, "vertical_enlrgmt"),
    enlargement_sq_footage: get(row, "enlargement_sq_footage"),
    proposed_stories: get(row, "proposed_no_of_stories", "proposed_stories"),
    proposed_height: get(row, "proposed_height"),
    proposed_dwelling_units: get(row, "proposed_dwelling_units"),
    proposed_occupancy: get(row, "proposed_occupancy"),
    site_fill: get(row, "site_fill"),
    lead_score: computeLeadScore({
      latest_action_date,
      job_type,
      initial_cost: num(initial_cost_raw),
      total_construction_floor_area,
      job_status,
    }),
  };
}

// ─── Permit ────────────────────────────────────────────────────────────────

export interface NormalizedPermit {
  bin: string;
  work_permit: string | null;
  [k: string]: unknown;
}

export function normalizePermitRow(row: Row): NormalizedPermit | null {
  const bin = get(row, "bin");
  if (!bin) return null;
  return {
    bin,
    work_permit: get(row, "work_permit"),
    job_filing_number: get(row, "job_filing_number"),
    sequence_number: get(row, "sequence_number"),
    filing_reason: get(row, "filing_reason"),
    tracking_number: get(row, "tracking_number"),
    apt_condo_no: get(row, "apt_condo_no_s", "apt_condo_no"),
    work_on_floor: get(row, "work_on_floor"),
    work_type: get(row, "work_type"),
    permittee_license_type: get(row, "permittee_s_license_type", "permittee_license_type"),
    job_description: get(row, "job_description"),
    estimated_job_costs: get(row, "estimated_job_costs"),
    permit_status: get(row, "permit_status"),
    zip_code: get(row, "zip_code"),
    applicant_license: get(row, "applicant_license", "applicant_license_number"),
    applicant_first_name: get(row, "applicant_first_name"),
    applicant_middle_name: get(row, "applicant_middle_name"),
    applicant_last_name: get(row, "applicant_last_name"),
    applicant_business_name: get(row, "applicant_business_name"),
    applicant_business_address: get(row, "applicant_business_address"),
    filing_rep_first_name: get(row, "filing_representative_first_name", "filing_rep_first_name"),
    filing_rep_middle_initial: get(row, "filing_representative_middle_initial", "filing_rep_middle_initial"),
    filing_rep_last_name: get(row, "filing_representative_last_name", "filing_rep_last_name"),
    filing_rep_business_name: get(row, "filing_representative_business_name", "filing_rep_business_name"),
    approved_date: date(get(row, "approved_date")),
    issued_date: date(get(row, "issued_date")),
    expired_date: date(get(row, "expired_date")),
    owner_business_name: get(row, "owner_business_name"),
    owner_name: get(row, "owner_name"),
    owner_street_address: get(row, "owner_street_address"),
    owner_city: get(row, "owner_city"),
    owner_state: get(row, "owner_state"),
    owner_zip_code: get(row, "owner_zip_code"),
  };
}
