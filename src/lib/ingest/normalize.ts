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
  const rawJob = get(row, "job_filing_number", "job_number", "job__", "job #", "job no");
  if (!rawJob) return null;

  // "B00472129-P1" → job_number "B00472129", doc_number "P1"
  let job_number = rawJob;
  let doc_number = get(row, "doc__", "doc #", "doc_number");
  const dash = rawJob.lastIndexOf("-");
  if (!doc_number && dash > 0) {
    job_number = rawJob.slice(0, dash);
    doc_number = rawJob.slice(dash + 1);
  }

  const boroRaw = get(row, "borough");
  const borough = boroRaw ? BOROUGH_MAP[boroRaw.toUpperCase()] ?? boroRaw.toUpperCase() : null;

  const house_number = get(row, "house_no", "house_number", "house #");
  const street_name = get(row, "street_name");
  const full_address = [house_number, street_name].filter(Boolean).join(" ") || null;

  const job_type = get(row, "job_type");
  const job_status = get(row, "filing_status", "job_status");

  const initial_cost = num(get(row, "initial_cost"));
  const total_construction_floor_area = num(get(row, "total_construction_floor_area"));
  const latest_action_date = date(get(row, "current_status_date", "latest_action_date"));

  const f: NormalizedFiling = {
    job_number,
    doc_number,
    borough,
    house_number,
    street_name,
    full_address,
    block: get(row, "block"),
    lot: get(row, "lot"),
    bin_number: get(row, "bin", "bin__", "bin #", "bin_number"),
    bbl: get(row, "bbl"),
    community_board: get(row, "commmunity_board", "community_board"),
    council_district: get(row, "council_district"),
    census_tract: get(row, "census_tract"),
    nta_name: get(row, "nta", "nta_name"),
    latitude: num(get(row, "latitude", "gis_latitude")),
    longitude: num(get(row, "longitude", "gis_longitude")),

    job_type,
    job_type_label: job_type ? JOB_TYPE_LABELS[job_type] ?? job_type : null,
    job_status,
    job_status_description: job_status ? JOB_STATUS_LABELS[job_status] ?? job_status : null,
    job_description: get(row, "job_description"),
    building_type: get(row, "building_type"),
    owner_type: get(row, "owner_type"),

    little_e: bool(get(row, "little_e")),

    work_plumbing: bool(get(row, "plumbing_work_type", "plumbing")),
    work_mechanical: bool(get(row, "mechanical_systems_work_type", "mechanical")),
    work_boiler: bool(get(row, "boiler_equipment_work_type", "boiler")),
    work_standpipe: bool(get(row, "stand_pipe_work_type", "standpipe")),
    work_sprinkler: bool(get(row, "sprinkler_work_type", "sprinkler")),
    work_curb_cut: bool(get(row, "curb_cut_work_type", "curb_cut")),
    work_fire_alarm: bool(get(row, "fire_alarm")),
    work_equipment: bool(get(row, "equipment")),
    work_fire_suppression: bool(get(row, "fire_suppression")),

    owner_first_name: get(row, "owner_first_name", "owner_s_first_name"),
    owner_last_name: get(row, "owner_last_name", "owner_s_last_name"),
    owner_business_name: get(row, "owner_s_business_name", "owner_business_name"),

    applicant_first_name: get(row, "applicant_first_name", "applicant_s_first_name"),
    applicant_last_name: get(row, "applicant_last_name", "applicant_s_last_name"),
    applicant_professional_title: get(row, "applicant_professional_title"),
    applicant_license_number: get(row, "applicant_license", "applicant_license__", "applicant_license_number"),

    initial_cost,
    total_construction_floor_area,
    existing_stories: int(get(row, "existing_stories", "existing_no__of_stories")),
    proposed_stories: int(get(row, "proposed_no_of_stories", "proposed_stories")),
    existing_height: num(get(row, "existing_height")),
    proposed_height: num(get(row, "proposed_height")),
    existing_dwelling_units: int(get(row, "existing_dwelling_units")),
    proposed_dwelling_units: int(get(row, "proposed_dwelling_units")),

    latest_action_date,
    pre_filing_date: date(get(row, "filing_date", "pre_filing_date")),
    approved_date: date(get(row, "approved_date", "approved")),
    fully_permitted_date: date(get(row, "first_permit_date", "fully_permitted")),
    signoff_date: date(get(row, "signoff_date")),

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

