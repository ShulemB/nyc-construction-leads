export const BOROUGH_MAP: Record<string, string> = {
  "1": "MANHATTAN",
  "2": "BRONX",
  "3": "BROOKLYN",
  "4": "QUEENS",
  "5": "STATEN ISLAND",
  MANHATTAN: "MANHATTAN",
  BRONX: "BRONX",
  BROOKLYN: "BROOKLYN",
  QUEENS: "QUEENS",
  "STATEN ISLAND": "STATEN ISLAND",
};

export const BOROUGHS = ["MANHATTAN", "BROOKLYN", "QUEENS", "BRONX", "STATEN ISLAND"] as const;

export const JOB_TYPE_LABELS: Record<string, string> = {
  NB: "New Building",
  A1: "Alteration Type I",
  A2: "Alteration Type II",
  A3: "Alteration Type III",
  DM: "Demolition",
  SG: "Sign",
  PA: "Place of Assembly",
  SC: "Subdivision Condo",
  SI: "Subdivision Improved",
};

export const JOB_TYPES = ["NB", "A1", "A2", "A3", "DM", "SG"] as const;

export const JOB_STATUS_LABELS: Record<string, string> = {
  A: "Pre-Filed",
  B: "Application Processed - Part-No Payment",
  C: "Application Processed - Payment Only",
  D: "Application Processed - Completed",
  E: "Application Processed - Entire Incomplete",
  F: "Application Assigned to Plan Examiner",
  G: "PAA Fee Due",
  H: "Plan Exam - In Process",
  I: "Sign-Off",
  J: "Plan Exam - Disapproved",
  K: "Plan Exam - Partial Approval",
  L: "PAA - Pending Routing",
  M: "Permit Issued - Partial Job",
  P: "Plan Exam - Approved",
  Q: "Permit Issued - Entire Job/Work",
  R: "Permit Issued - Renewal",
  U: "Completed",
  X: "Signed-Off",
};

export const WORK_TYPES = [
  { key: "work_plumbing", label: "Plumbing" },
  { key: "work_mechanical", label: "Mechanical" },
  { key: "work_boiler", label: "Boiler" },
  { key: "work_fuel_burning", label: "Fuel Burning" },
  { key: "work_fuel_storage", label: "Fuel Storage" },
  { key: "work_standpipe", label: "Standpipe" },
  { key: "work_sprinkler", label: "Sprinkler" },
  { key: "work_fire_alarm", label: "Fire Alarm" },
  { key: "work_equipment", label: "Equipment" },
  { key: "work_fire_suppression", label: "Fire Suppression" },
  { key: "work_curb_cut", label: "Curb Cut" },
  { key: "work_other", label: "Other" },
] as const;

export function jobTypeColor(jt: string | null | undefined): string {
  switch (jt) {
    case "NB": return "bg-job-nb/15 text-job-nb border-job-nb/30";
    case "A1": return "bg-job-a1/15 text-job-a1 border-job-a1/30";
    case "A2": return "bg-job-a2/15 text-job-a2 border-job-a2/30";
    case "A3": return "bg-job-a3/15 text-job-a3 border-job-a3/30";
    case "DM": return "bg-job-dm/15 text-job-dm border-job-dm/30";
    case "SG": return "bg-job-sg/15 text-job-sg border-job-sg/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export function scoreTier(score: number): "hot" | "warm" | "cold" {
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cold";
}
