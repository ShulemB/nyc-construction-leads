
-- Drop existing
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.job_application_filings CASCADE;
DROP TABLE IF EXISTS public.approved_permits CASCADE;

-- ─── properties ─────────────────────────────────────────────────────────────
CREATE TABLE public.properties (
  bin text PRIMARY KEY,
  borough text,
  house_number text,
  street_name text,
  block text,
  lot text,
  bbl text,
  latitude double precision,
  longitude double precision,
  community_board text,
  council_district text,
  census_tract text,
  nta text,
  building_type text,
  building_class text,
  landmarked text,
  adult_estab text,
  loft_board text,
  city_owned text,
  little_e text,
  cluster text,
  existing_stories text,
  existing_height text,
  existing_dwelling_units text,
  existing_occupancy text,
  zoning_dist1 text,
  zoning_dist2 text,
  zoning_dist3 text,
  special_district1 text,
  special_district2 text,
  street_frontage text,
  owner_type text,
  non_profit text,
  owner_first_name text,
  owner_last_name text,
  owner_business_name text,
  owner_house_number text,
  owner_street_name text,
  owner_city text,
  owner_state text,
  owner_zip text,
  full_address text GENERATED ALWAYS AS (NULLIF(trim(coalesce(house_number,'') || ' ' || coalesce(street_name,'')), '')) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties read auth" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "properties write auth" ON public.properties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "properties update auth" ON public.properties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "properties delete auth" ON public.properties FOR DELETE TO authenticated USING (true);
CREATE INDEX properties_borough_idx ON public.properties (borough);
CREATE INDEX properties_street_idx ON public.properties (street_name);
CREATE INDEX properties_nta_idx ON public.properties (nta);
CREATE INDEX properties_council_idx ON public.properties (council_district);
CREATE TRIGGER properties_set_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── job_application_filings ────────────────────────────────────────────────
CREATE TABLE public.job_application_filings (
  id bigserial PRIMARY KEY,
  bin text NOT NULL REFERENCES public.properties(bin) ON DELETE CASCADE,
  job_number text UNIQUE,
  job_s1_no text,
  doc_number text,
  job_type text,
  job_status text,
  job_status_descrp text,
  latest_action_date date,
  total_construction_floor_area text,
  job_description text,
  job_no_good_count text,
  withdrawal_flag text,
  pc_filed text,
  efiling_filed text,
  professional_cert text,
  plumbing text,
  mechanical text,
  boiler text,
  fuel_burning text,
  fuel_storage text,
  standpipe text,
  sprinkler text,
  fire_alarm text,
  equipment text,
  fire_suppression text,
  curb_cut text,
  other text,
  other_description text,
  applicant_first_name text,
  applicant_last_name text,
  applicant_professional_title text,
  applicant_license text,
  pre_filing_date date,
  paid date,
  fully_paid date,
  assigned date,
  approved date,
  fully_permitted date,
  signoff_date date,
  special_action_status text,
  special_action_date date,
  dob_run_date date,
  initial_cost text,
  total_est_fee text,
  fee_status text,
  existing_zoning_sqft text,
  proposed_zoning_sqft text,
  horizontal_enlrgmt text,
  vertical_enlrgmt text,
  enlargement_sq_footage text,
  proposed_stories text,
  proposed_height text,
  proposed_dwelling_units text,
  proposed_occupancy text,
  site_fill text,
  lead_score int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_application_filings TO authenticated;
GRANT ALL ON public.job_application_filings TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.job_application_filings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.job_application_filings_id_seq TO service_role;
ALTER TABLE public.job_application_filings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "filings read auth" ON public.job_application_filings FOR SELECT TO authenticated USING (true);
CREATE POLICY "filings write auth" ON public.job_application_filings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "filings update auth" ON public.job_application_filings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "filings delete auth" ON public.job_application_filings FOR DELETE TO authenticated USING (true);
CREATE INDEX filings_bin_idx ON public.job_application_filings (bin);
CREATE INDEX filings_latest_action_idx ON public.job_application_filings (latest_action_date DESC NULLS LAST);
CREATE INDEX filings_app_license_idx ON public.job_application_filings (applicant_license);
CREATE INDEX filings_job_type_idx ON public.job_application_filings (job_type);
CREATE INDEX filings_job_status_idx ON public.job_application_filings (job_status);
CREATE INDEX filings_lead_score_idx ON public.job_application_filings (lead_score DESC NULLS LAST);
CREATE TRIGGER filings_set_updated_at BEFORE UPDATE ON public.job_application_filings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── approved_permits ───────────────────────────────────────────────────────
CREATE TABLE public.approved_permits (
  id bigserial PRIMARY KEY,
  bin text NOT NULL REFERENCES public.properties(bin) ON DELETE CASCADE,
  work_permit text UNIQUE,
  job_filing_number text,
  sequence_number text,
  filing_reason text,
  tracking_number text,
  apt_condo_no text,
  work_on_floor text,
  work_type text,
  permittee_license_type text,
  job_description text,
  estimated_job_costs text,
  permit_status text,
  zip_code text,
  applicant_license text,
  applicant_first_name text,
  applicant_middle_name text,
  applicant_last_name text,
  applicant_business_name text,
  applicant_business_address text,
  filing_rep_first_name text,
  filing_rep_middle_initial text,
  filing_rep_last_name text,
  filing_rep_business_name text,
  approved_date date,
  issued_date date,
  expired_date date,
  owner_business_name text,
  owner_name text,
  owner_street_address text,
  owner_city text,
  owner_state text,
  owner_zip_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approved_permits TO authenticated;
GRANT ALL ON public.approved_permits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.approved_permits_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.approved_permits_id_seq TO service_role;
ALTER TABLE public.approved_permits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permits read auth" ON public.approved_permits FOR SELECT TO authenticated USING (true);
CREATE POLICY "permits write auth" ON public.approved_permits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "permits update auth" ON public.approved_permits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "permits delete auth" ON public.approved_permits FOR DELETE TO authenticated USING (true);
CREATE INDEX permits_bin_idx ON public.approved_permits (bin);
CREATE INDEX permits_issued_idx ON public.approved_permits (issued_date DESC NULLS LAST);
CREATE INDEX permits_app_license_idx ON public.approved_permits (applicant_license);
CREATE INDEX permits_work_type_idx ON public.approved_permits (work_type);
CREATE INDEX permits_permit_status_idx ON public.approved_permits (permit_status);
CREATE TRIGGER permits_set_updated_at BEFORE UPDATE ON public.approved_permits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── leads (per-user pipeline keyed by property) ────────────────────────────
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bin text NOT NULL REFERENCES public.properties(bin) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','proposal_sent','won','lost')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bin)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads own select" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "leads own insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leads own update" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leads own delete" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX leads_user_idx ON public.leads (user_id, updated_at DESC);
CREATE INDEX leads_bin_idx ON public.leads (bin);
CREATE TRIGGER leads_set_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
