UPDATE public.approved_permits AS ap
SET matched_job_number = split_part(ap.job_filing_number, '-', 1),
    match_status = 'matched',
    match_method = 'job_filing_number'
FROM public.job_application_filings f
WHERE ap.matched_job_number IS NULL
  AND ap.job_filing_number IS NOT NULL
  AND position('-' in ap.job_filing_number) > 0
  AND f.job_number = split_part(ap.job_filing_number, '-', 1);