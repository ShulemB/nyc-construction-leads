
CREATE TABLE public.dob_license_info (
  id BIGSERIAL PRIMARY KEY,
  license_sl_no BIGINT UNIQUE,
  license_type TEXT,
  license_number BIGINT,
  last_name TEXT,
  first_name TEXT,
  business_name TEXT,
  business_house_number TEXT,
  business_street_name TEXT,
  license_business_city TEXT,
  business_state TEXT,
  business_zip_code TEXT,
  business_email TEXT,
  business_phone_number TEXT,
  license_status TEXT,
  lat DOUBLE PRECISION,
  long DOUBLE PRECISION,
  community_board INTEGER,
  council_district INTEGER,
  census_tract INTEGER,
  bin BIGINT,
  bbl TEXT,
  nta TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dob_license_info_license_number ON public.dob_license_info(license_number);
CREATE INDEX idx_dob_license_info_bin ON public.dob_license_info(bin);

GRANT SELECT ON public.dob_license_info TO authenticated;
GRANT ALL ON public.dob_license_info TO service_role;

ALTER TABLE public.dob_license_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view license info"
  ON public.dob_license_info FOR SELECT
  TO authenticated
  USING (true);
