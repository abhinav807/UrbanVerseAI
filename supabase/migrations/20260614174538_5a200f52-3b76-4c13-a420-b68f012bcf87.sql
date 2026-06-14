
-- Roads: city road network
CREATE TABLE public.roads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  geometry jsonb NOT NULL DEFAULT '{}'::jsonb,
  capacity integer NOT NULL DEFAULT 0,
  traffic integer NOT NULL DEFAULT 0,
  condition text NOT NULL DEFAULT 'good',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roads TO authenticated;
GRANT ALL ON public.roads TO service_role;
ALTER TABLE public.roads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read roads" ON public.roads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert roads" ON public.roads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update roads" ON public.roads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete roads" ON public.roads FOR DELETE TO authenticated USING (true);

-- Simulations
CREATE TABLE public.simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  road_id uuid REFERENCES public.roads(id) ON DELETE SET NULL,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulations TO authenticated;
GRANT ALL ON public.simulations TO service_role;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read simulations" ON public.simulations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert simulations" ON public.simulations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners can update simulations" ON public.simulations FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owners can delete simulations" ON public.simulations FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Risk zones
CREATE TABLE public.risk_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  geometry jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_level text NOT NULL DEFAULT 'low',
  risk_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_zones TO authenticated;
GRANT ALL ON public.risk_zones TO service_role;
ALTER TABLE public.risk_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read risk_zones" ON public.risk_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert risk_zones" ON public.risk_zones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update risk_zones" ON public.risk_zones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete risk_zones" ON public.risk_zones FOR DELETE TO authenticated USING (true);

-- Reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid REFERENCES public.simulations(id) ON DELETE CASCADE,
  report_text text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read reports" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners can update reports" ON public.reports FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owners can delete reports" ON public.reports FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_updated_at_roads BEFORE UPDATE ON public.roads
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_risk_zones BEFORE UPDATE ON public.risk_zones
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Helpful indexes
CREATE INDEX idx_simulations_road_id ON public.simulations(road_id);
CREATE INDEX idx_simulations_created_at ON public.simulations(created_at DESC);
CREATE INDEX idx_reports_simulation_id ON public.reports(simulation_id);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_risk_zones_risk_type ON public.risk_zones(risk_type);
