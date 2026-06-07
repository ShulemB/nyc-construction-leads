
DROP INDEX IF EXISTS public.uniq_permits_work_seq;
DROP INDEX IF EXISTS public.uniq_permits_tracking;

CREATE UNIQUE INDEX uniq_permits_work_seq
  ON public.approved_permits (work_permit, sequence_number);

CREATE UNIQUE INDEX uniq_permits_tracking
  ON public.approved_permits (tracking_number);
