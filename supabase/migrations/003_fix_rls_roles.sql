-- ===========================
-- Fix RLS: Grant Sales & Engineer roles access
-- ===========================

-- Allow Sales to create clients (they book site visits)
CREATE POLICY IF NOT EXISTS "Sales create clients" ON public.clients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher', 'Sales'))
  );

-- Allow Sales to read clients
CREATE POLICY IF NOT EXISTS "Sales read clients" ON public.clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher', 'Sales', 'Engineer', 'Technician'))
  );

-- Allow Sales to create jobs
CREATE POLICY IF NOT EXISTS "Sales create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher', 'Sales'))
  );

-- Allow all authenticated users to read jobs (Engineers see their own via app-level filter)
CREATE POLICY IF NOT EXISTS "Authenticated read jobs" ON public.jobs
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow Engineer/Technician to update their own assigned jobs (site visit fill-in)
CREATE POLICY IF NOT EXISTS "Engineer update assigned jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher', 'Sales'))
    OR assigned_to = auth.uid()
  );

-- Allow all authenticated users to read profiles (needed for dispatch board staff list)
CREATE POLICY IF NOT EXISTS "Authenticated read profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow Sales/Engineer to read all profiles (for dispatch board)
CREATE POLICY IF NOT EXISTS "Sales update jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher', 'Sales'))
  );
