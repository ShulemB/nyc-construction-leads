
DROP POLICY IF EXISTS "properties write auth" ON public.properties;
DROP POLICY IF EXISTS "properties update auth" ON public.properties;
DROP POLICY IF EXISTS "properties delete auth" ON public.properties;
DROP POLICY IF EXISTS "filings write auth" ON public.job_application_filings;
DROP POLICY IF EXISTS "filings update auth" ON public.job_application_filings;
DROP POLICY IF EXISTS "filings delete auth" ON public.job_application_filings;
DROP POLICY IF EXISTS "permits write auth" ON public.approved_permits;
DROP POLICY IF EXISTS "permits update auth" ON public.approved_permits;
DROP POLICY IF EXISTS "permits delete auth" ON public.approved_permits;

REVOKE INSERT, UPDATE, DELETE ON public.properties FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.job_application_filings FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.approved_permits FROM authenticated;
