-- ===========================
-- Fix RLS: site_visits Update & Admin Access
-- ===========================

-- 1. Ensure all roles are allowed in profiles
DO $$ 
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('Admin', 'Dispatcher', 'Technician', 'Sales', 'Engineer'));
END $$;

-- 2. site_visits policies
-- Drop existing restricted policies to recreate them more comprehensively
DROP POLICY IF EXISTS "Admins can view all site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Engineers can view own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Engineers can create site visits" ON public.site_visits;

-- Admin/Dispatcher: Full Access
CREATE POLICY "Admins full access site visits" ON public.site_visits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

-- Engineers/Technicians/Sales: View and Upsert their own
CREATE POLICY "Staff view own site visits" ON public.site_visits
  FOR SELECT USING (engineer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher')));

CREATE POLICY "Staff insert own site visits" ON public.site_visits
  FOR INSERT WITH CHECK (engineer_id = auth.uid());

CREATE POLICY "Staff update own site visits" ON public.site_visits
  FOR UPDATE USING (engineer_id = auth.uid())
  WITH CHECK (engineer_id = auth.uid());

-- 3. Ensure jobs can be updated by staff assigned to them (for GPS sync)
DROP POLICY IF EXISTS "Engineer update assigned jobs" ON public.jobs;
CREATE POLICY "Staff update assigned jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher', 'Sales'))
    OR assigned_to = auth.uid()
  );

-- 4. Storage Bucket Policies (If not already set)
-- This assumes a bucket named 'site-visits' exists
-- Note: These usually need to be run in the Supabase Dashboard, but here is the SQL for reference
-- INSERT INTO storage.buckets (id, name, public) VALUES ('site-visits', 'site-visits', false) ON CONFLICT (id) DO NOTHING;
