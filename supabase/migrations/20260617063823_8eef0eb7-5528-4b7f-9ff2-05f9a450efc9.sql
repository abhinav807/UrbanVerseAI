-- 1. reports: restrict SELECT to owner
DROP POLICY IF EXISTS "Authenticated can read reports" ON public.reports;
CREATE POLICY "Owners can read reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- 2. simulations: restrict SELECT to owner
DROP POLICY IF EXISTS "Authenticated can read simulations" ON public.simulations;
CREATE POLICY "Owners can read simulations"
  ON public.simulations FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- 3. roads: add ownership column and scope writes to owners
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "Authenticated can insert roads" ON public.roads;
DROP POLICY IF EXISTS "Authenticated can update roads" ON public.roads;
DROP POLICY IF EXISTS "Authenticated can delete roads" ON public.roads;

CREATE POLICY "Authenticated can insert roads"
  ON public.roads FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can update roads"
  ON public.roads FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can delete roads"
  ON public.roads FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- 4. risk_zones: add ownership column and scope writes to owners
ALTER TABLE public.risk_zones ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "Authenticated can insert risk_zones" ON public.risk_zones;
DROP POLICY IF EXISTS "Authenticated can update risk_zones" ON public.risk_zones;
DROP POLICY IF EXISTS "Authenticated can delete risk_zones" ON public.risk_zones;

CREATE POLICY "Authenticated can insert risk_zones"
  ON public.risk_zones FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can update risk_zones"
  ON public.risk_zones FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can delete risk_zones"
  ON public.risk_zones FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());