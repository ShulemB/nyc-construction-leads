## Add DOB NOW Approved Permits Import & Unified Filing View

### 1. Database (migration)

New table `public.approved_permits` with all key DOB NOW Build Approved Permits columns:

- Identity: `work_permit`, `sequence_number`, `tracking_number`, `job_filing_number`
- Location: `bin`, `bbl`, `borough`, `house_no`, `street_name`, `block`, `lot`, `c_b_no`
- Permit data: `filing_status`, `permit_status`, `filing_reason`, `work_type`, `permit_type`, `permit_subtype`, `work_on_floor`, `work_retaining_wall`
- Dates: `issued_date`, `approved_date`, `expired_date`, `job_start_date`
- Cost/scope: `estimated_job_costs`
- People: `owner_business_name`, `owner_name`, `applicant_first_name`, `applicant_last_name`, `applicant_business_name`, `applicant_license_number`, `applicant_professional_title`
- Source: `raw` JSONB (all other fields), `last_synced_at`, `data_source`
- Linking: `matched_job_number` (text, nullable), `match_status` text ('matched'|'unmatched'|'ambiguous'), `match_method` text ('job_filing_number'|'bin'|'bbl'|null), `match_candidates` jsonb (for ambiguous)

Constraints:
- Unique on `(work_permit, sequence_number)` when both not null
- Unique on `tracking_number` when work_permit null
- Implement via two partial unique indexes

Indexes on filings table: `job_number`, `bin_number`, `bbl` (already exist via pg_trgm? Add btree if missing).
Indexes on approved_permits: `work_permit`, `tracking_number`, `job_filing_number`, `bin`, `bbl`, `matched_job_number`, `match_status`.

GRANTs + RLS: authenticated select + admin only writes (writes through service role in serverFn).

Also extend `sync_log.source` usage with new value `permits_csv_upload`.

### 2. Backend code

**`src/lib/ingest/normalizePermit.ts`** — maps DOB NOW Approved Permits CSV row to permit record. Handles field aliases (Work Permit, Job Filing Number, BIN, BBL, etc.). Parses dates and money.

**`src/lib/permits.functions.ts`**:
- `ingestPermitBatch` (mirrors `ingestBatch`): upsert into approved_permits using two strategies:
  - For rows with work_permit + sequence_number → upsert on that pair
  - For rows with only tracking_number → upsert on tracking_number
  Then run match resolution for each row:
  1. If `job_filing_number` matches a `filings.job_number` → matched, method=job_filing_number
  2. Else find filings by bin: if exactly one distinct job_number → matched, if multiple → ambiguous
  3. Else by bbl: same logic
  4. Else unmatched
- `listPermitsByJob(jobNumber)` — fetch related permits for filing detail
- `permitImportStats(syncLogId)` — return processed/added/updated/matched/unmatched/ambiguous/duplicates/errors

**Extend `src/lib/filings.functions.ts`**:
- Extend `listFilings` search `or(...)` to also union-search approved_permits then return parent filings. Simplest: also query approved_permits by the same term and pull `matched_job_number`s, then OR into the filings query (`job_number.in.(...)`).
- Add permit fields to detail: modify `getFiling` to also return related permits (call permits function or join).

### 3. Frontend

**Import page (`src/routes/_authenticated/import.tsx`)**:
- Add tabs / mode toggle: "Job Applications" | "Approved Permits"
- On permits mode use `ingestPermitBatch` and parse with Papa (CSV) or SheetJS (XLSX). Add `xlsx` dep for .xlsx support — convert to row objects then funnel through same batching.
- Show extended stats: processed, added, updated, matched, unmatched, ambiguous, duplicates ignored, errors.

**Filing detail (`src/routes/_authenticated/filings.$jobNumber.tsx`)**:
- After existing filing info, render "Related Approved Permits" section
- 0 permits → hide / "no permits yet"
- 1 permit → render details card
- 2+ → sortable table with columns (Work Permit, Sequence #, Status, Filing Reason, Work Type, Approved, Issued, Expired, Est. Cost, Tracking #) with simple sort + filter input

**Search**: filings list page already searches filings; results page links to detail which now shows permits. Update server `listFilings` to also pull `matched_job_number` matches from approved_permits when search term is provided so a Work Permit / Tracking # search surfaces the parent filing.

### 4. Dependencies

`bun add xlsx` for .xlsx parsing.

### 5. Future-proofing notes

- `approved_permits.match_method` enum-like text and `match_candidates` jsonb let future datasets reuse the same pattern.
- Filing Detail uses a generic "Related Datasets" section; permits is the first implementation, others can be appended later.

### Files to create
- `supabase/migrations/<new>.sql`
- `src/lib/ingest/normalizePermit.ts`
- `src/lib/permits.functions.ts`
- `src/components/filings/RelatedPermits.tsx`

### Files to edit
- `src/lib/filings.functions.ts` (search + getFiling)
- `src/routes/_authenticated/import.tsx` (tabs + XLSX + permits mode)
- `src/routes/_authenticated/filings.$jobNumber.tsx` (render RelatedPermits)
- `package.json` (xlsx)

Confirm to proceed and I'll ship it.