
-- Add btree indexes on filings for fast lookups by matching keys
CREATE INDEX IF NOT EXISTS idx_filings_job_number_btree ON public.filings (job_number);
CREATE INDEX IF NOT EXISTS idx_filings_bin_number ON public.filings (bin_number);
CREATE INDEX IF NOT EXISTS idx_filings_bbl ON public.filings (bbl);

-- Approved Permits table
CREATE TABLE IF NOT EXISTS public.approved_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  work_permit text,
  sequence_number text,
  tracking_number text,
  job_filing_number text,

  bin text,
  bbl text,
  borough text,
  house_no text,
  street_name text,
  block text,
  lot text,
  c_b_no text,

  filing_status text,
  permit_status text,
  filing_reason text,
  work_type text,
  permit_type text,
  permit_subtype text,
  work_on_floor text,
  work_retaining_wall text,

  issued_date date,
  approved_date date,
  expired_date date,
  job_start_date date,

  estimated_job_costs numeric,

  owner_business_name text,
  owner_name text,
  applicant_first_name text,
  applicant_last_name text,
  applicant_business_name text,
  applicant_license_number text,
  applicant_professional_title text,

  raw jsonb,
  data_source text DEFAULT 'permits_csv_upload',
  last_synced_at timestamptz DEFAULT now(),

  matched_job_number text,
  match_status text NOT NULL DEFAULT 'unmatched',
  match_method text,
  match_candidates jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.approved_permits TO authenticated;
GRANT ALL ON public.approved_permits TO service_role;

ALTER TABLE public.approved_permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read approved permits"
  ON public.approved_permits FOR SELECT
  TO authenticated
  USING (true);

-- Dedup unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS uniq_permits_work_seq
  ON public.approved_permits (work_permit, sequence_number)
  WHERE work_permit IS NOT NULL AND sequence_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_permits_tracking
  ON public.approved_permits (tracking_number)
  WHERE tracking_number IS NOT NULL AND (work_permit IS NULL OR sequence_number IS NULL);

-- Lookup indexes
CREATE INDEX IF NOT EXISTS idx_permits_work_permit ON public.approved_permits (work_permit);
CREATE INDEX IF NOT EXISTS idx_permits_tracking ON public.approved_permits (tracking_number);
CREATE INDEX IF NOT EXISTS idx_permits_job_filing ON public.approved_permits (job_filing_number);
CREATE INDEX IF NOT EXISTS idx_permits_bin ON public.approved_permits (bin);
CREATE INDEX IF NOT EXISTS idx_permits_bbl ON public.approved_permits (bbl);
CREATE INDEX IF NOT EXISTS idx_permits_matched_job ON public.approved_permits (matched_job_number);
CREATE INDEX IF NOT EXISTS idx_permits_match_status ON public.approved_permits (match_status);

-- updated_at trigger
CREATE TRIGGER trg_approved_permits_updated_at
  BEFORE UPDATE ON public.approved_permits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
