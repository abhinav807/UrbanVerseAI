
-- Roads
DROP POLICY "Authenticated can insert roads" ON public.roads;
DROP POLICY "Authenticated can update roads" ON public.roads;
DROP POLICY "Authenticated can delete roads" ON public.roads;
CREATE POLICY "Authenticated can insert roads" ON public.roads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update roads" ON public.roads FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete roads" ON public.roads FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Risk zones
DROP POLICY "Authenticated can insert risk_zones" ON public.risk_zones;
DROP POLICY "Authenticated can update risk_zones" ON public.risk_zones;
DROP POLICY "Authenticated can delete risk_zones" ON public.risk_zones;
CREATE POLICY "Authenticated can insert risk_zones" ON public.risk_zones FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update risk_zones" ON public.risk_zones FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete risk_zones" ON public.risk_zones FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Simulations (force created_by to current user on insert)
DROP POLICY "Authenticated can insert simulations" ON public.simulations;
CREATE POLICY "Authenticated can insert simulations" ON public.simulations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Reports (force created_by to current user on insert)
DROP POLICY "Authenticated can insert reports" ON public.reports;
CREATE POLICY "Authenticated can insert reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
