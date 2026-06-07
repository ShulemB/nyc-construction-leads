
-- pg_trgm for fuzzy search on text fields
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  trade TEXT[],
  boroughs TEXT[],
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- FILINGS (core DOB data)
-- =========================================
CREATE TABLE public.filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL,
  doc_number TEXT,

  -- Location
  borough TEXT,
  house_number TEXT,
  street_name TEXT,
  full_address TEXT,
  block TEXT,
  lot TEXT,
  bin_number TEXT,
  bbl TEXT,
  community_board TEXT,
  council_district TEXT,
  census_tract TEXT,
  nta_name TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  zoning_dist1 TEXT,
  zoning_dist2 TEXT,
  zoning_dist3 TEXT,
  special_district_1 TEXT,
  special_district_2 TEXT,

  -- Classification
  job_type TEXT,
  job_type_label TEXT,
  job_status TEXT,
  job_status_description TEXT,
  job_description TEXT,
  building_type TEXT,
  existing_occupancy TEXT,
  proposed_occupancy TEXT,
  building_class TEXT,
  owner_type TEXT,
  cluster TEXT,

  -- Flags
  landmarked BOOLEAN DEFAULT FALSE,
  adult_estab BOOLEAN DEFAULT FALSE,
  loft_board BOOLEAN DEFAULT FALSE,
  city_owned BOOLEAN DEFAULT FALSE,
  little_e BOOLEAN DEFAULT FALSE,
  pc_filed BOOLEAN DEFAULT FALSE,
  efiling_filed BOOLEAN DEFAULT FALSE,
  non_profit BOOLEAN DEFAULT FALSE,
  professional_cert BOOLEAN DEFAULT FALSE,
  withdrawal_flag BOOLEAN DEFAULT FALSE,
  horizontal_enlargement BOOLEAN DEFAULT FALSE,
  vertical_enlargement BOOLEAN DEFAULT FALSE,
  site_fill TEXT,

  -- Work types
  work_plumbing BOOLEAN DEFAULT FALSE,
  work_mechanical BOOLEAN DEFAULT FALSE,
  work_boiler BOOLEAN DEFAULT FALSE,
  work_fuel_burning BOOLEAN DEFAULT FALSE,
  work_fuel_storage BOOLEAN DEFAULT FALSE,
  work_standpipe BOOLEAN DEFAULT FALSE,
  work_sprinkler BOOLEAN DEFAULT FALSE,
  work_fire_alarm BOOLEAN DEFAULT FALSE,
  work_equipment BOOLEAN DEFAULT FALSE,
  work_fire_suppression BOOLEAN DEFAULT FALSE,
  work_curb_cut BOOLEAN DEFAULT FALSE,
  work_other BOOLEAN DEFAULT FALSE,
  work_other_description TEXT,

  -- Owner
  owner_type_detail TEXT,
  owner_first_name TEXT,
  owner_last_name TEXT,
  owner_business_name TEXT,
  owner_house_number TEXT,
  owner_street_name TEXT,
  owner_city TEXT,
  owner_state TEXT,
  owner_zip TEXT,

  -- Applicant
  applicant_first_name TEXT,
  applicant_last_name TEXT,
  applicant_professional_title TEXT,
  applicant_license_number TEXT,

  -- Financial & scope
  initial_cost DECIMAL(15,2),
  total_est_fee DECIMAL(15,2),
  fee_status TEXT,
  total_construction_floor_area DECIMAL(12,2),
  existing_zoning_sqft DECIMAL(12,2),
  proposed_zoning_sqft DECIMAL(12,2),
  enlargement_sq_footage DECIMAL(12,2),
  street_frontage DECIMAL(10,2),
  existing_stories INTEGER,
  proposed_stories INTEGER,
  existing_height DECIMAL(10,2),
  proposed_height DECIMAL(10,2),
  existing_dwelling_units INTEGER,
  proposed_dwelling_units INTEGER,
  job_no_good_count INTEGER,

  -- Dates
  latest_action_date DATE,
  pre_filing_date DATE,
  paid_date DATE,
  fully_paid_date DATE,
  assigned_date DATE,
  approved_date DATE,
  fully_permitted_date DATE,
  signoff_date DATE,
  special_action_date DATE,
  special_action_status TEXT,
  dob_run_date DATE,

  -- Metadata
  lead_score INTEGER NOT NULL DEFAULT 0,
  is_new_this_sync BOOLEAN NOT NULL DEFAULT FALSE,
  data_source TEXT NOT NULL DEFAULT 'csv_upload',
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT filings_job_doc_unique UNIQUE (job_number, doc_number)
);

CREATE INDEX idx_filings_borough ON public.filings(borough);
CREATE INDEX idx_filings_job_type ON public.filings(job_type);
CREATE INDEX idx_filings_job_status ON public.filings(job_status);
CREATE INDEX idx_filings_latest_action ON public.filings(latest_action_date DESC NULLS LAST);
CREATE INDEX idx_filings_initial_cost ON public.filings(initial_cost DESC NULLS LAST);
CREATE INDEX idx_filings_lead_score ON public.filings(lead_score DESC);
CREATE INDEX idx_filings_is_new ON public.filings(is_new_this_sync) WHERE is_new_this_sync = TRUE;
CREATE INDEX idx_filings_job_number ON public.filings(job_number);
CREATE INDEX idx_filings_address_trgm ON public.filings USING GIN (full_address gin_trgm_ops);
CREATE INDEX idx_filings_owner_business_trgm ON public.filings USING GIN (owner_business_name gin_trgm_ops);

GRANT SELECT ON public.filings TO authenticated;
GRANT ALL ON public.filings TO service_role;
ALTER TABLE public.filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read filings" ON public.filings
  FOR SELECT TO authenticated USING (true);

-- =========================================
-- LEADS
-- =========================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filing_id UUID NOT NULL REFERENCES public.filings(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, filing_id)
);

CREATE INDEX idx_leads_user ON public.leads(user_id);
CREATE INDEX idx_leads_status ON public.leads(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own leads" ON public.leads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- SYNC LOG
-- =========================================
CREATE TABLE public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  filename TEXT,
  status TEXT NOT NULL,
  rows_added INTEGER NOT NULL DEFAULT 0,
  rows_updated INTEGER NOT NULL DEFAULT 0,
  rows_unchanged INTEGER NOT NULL DEFAULT 0,
  rows_errored INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_log_started ON public.sync_log(started_at DESC);

GRANT SELECT, INSERT ON public.sync_log TO authenticated;
GRANT ALL ON public.sync_log TO service_role;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sync logs" ON public.sync_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sync logs" ON public.sync_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
