ALTER TABLE public.dob_license_info ALTER COLUMN license_number TYPE text USING license_number::text;
DROP INDEX IF EXISTS idx_dob_license_info_license_number;
CREATE INDEX idx_dob_license_info_license_number ON public.dob_license_info (license_number);