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

-- Fix circular RLS on profiles:
-- First, drop ALL possible old and new policy names to be safe
DROP POLICY IF EXISTS "Admin/Dispatcher full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Technician read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins mutations profiles" ON public.profiles;

-- New non-circular policies
CREATE POLICY "Profiles are readable by all authenticated users" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin policy for mutations (INSERT, UPDATE, DELETE)
-- Explicitly NOT FOR SELECT to avoid recursion
CREATE POLICY "Admins mutations profiles" ON public.profiles
  FOR INSERT, UPDATE, DELETE
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

-- 2. site_visits policies
-- Drop existing policies to recreate them safely
DROP POLICY IF EXISTS "Admins can view all site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Engineers can view own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Engineers can create site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Admins full access site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Staff view own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Staff insert own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Staff update own site visits" ON public.site_visits;

-- Admin/Dispatcher: Full Access
CREATE POLICY "Admins full access site visits" ON public.site_visits
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
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
DROP POLICY IF EXISTS "Staff update assigned jobs" ON public.jobs;
CREATE POLICY "Staff update assigned jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher', 'Sales'))
    OR assigned_to = auth.uid()
  );

-- 4. Storage Bucket Policies (If not already set)
-- This assumes a bucket named 'site-visits' exists
-- Note: These usually need to be run in the Supabase Dashboard, but here is the SQL for reference
-- INSERT INTO storage.buckets (id, name, public) VALUES ('site-visits', 'site-visits', false) ON CONFLICT (id) DO NOTHING;
