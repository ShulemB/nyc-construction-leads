
CREATE TABLE public.stop_work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_number TEXT NOT NULL UNIQUE,
  bin TEXT NOT NULL REFERENCES public.properties(bin) ON DELETE CASCADE,
  borough_name TEXT,
  disposition_code TEXT,
  disposition_code_desc TEXT,
  disposition_category TEXT,
  last_disposition_date DATE,
  last_disposition_year INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  community_board TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX stop_work_orders_bin_idx ON public.stop_work_orders(bin);
CREATE INDEX stop_work_orders_last_disposition_date_idx ON public.stop_work_orders(last_disposition_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stop_work_orders TO authenticated;
GRANT ALL ON public.stop_work_orders TO service_role;

ALTER TABLE public.stop_work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stop work orders"
  ON public.stop_work_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert stop work orders"
  ON public.stop_work_orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stop work orders"
  ON public.stop_work_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stop work orders"
  ON public.stop_work_orders FOR DELETE TO authenticated USING (true);

CREATE TRIGGER stop_work_orders_set_updated_at
  BEFORE UPDATE ON public.stop_work_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
