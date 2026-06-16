
CREATE TABLE public.bed_bug_reports (
  id TEXT PRIMARY KEY,
  building_id TEXT,
  registration_id TEXT,
  borough TEXT,
  house_number TEXT,
  street_name TEXT,
  postcode TEXT,
  dwelling_units INTEGER,
  infested_unit_count INTEGER,
  eradicated_unit_count INTEGER,
  re_infested_unit_count INTEGER,
  filing_date DATE,
  filing_period_start_date DATE,
  filing_period_end_date DATE,
  latitude TEXT,
  longitude TEXT,
  community_board TEXT,
  council_district TEXT,
  census_tract_2010 TEXT,
  bbl TEXT,
  nta TEXT,
  bin TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bed_bug_reports_bin ON public.bed_bug_reports(bin);
CREATE INDEX idx_bed_bug_reports_filing_date ON public.bed_bug_reports(filing_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bed_bug_reports TO authenticated;
GRANT ALL ON public.bed_bug_reports TO service_role;

ALTER TABLE public.bed_bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read bed_bug_reports"
  ON public.bed_bug_reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert bed_bug_reports"
  ON public.bed_bug_reports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update bed_bug_reports"
  ON public.bed_bug_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete bed_bug_reports"
  ON public.bed_bug_reports FOR DELETE TO authenticated USING (true);

CREATE TRIGGER set_bed_bug_reports_updated_at
  BEFORE UPDATE ON public.bed_bug_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
