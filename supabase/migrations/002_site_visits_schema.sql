-- VisionSolar - Site Visit Form Schema
-- Run this in the Supabase SQL Editor

-- 1. Update profiles role enum
ALTER TABLE public.profiles 
DROP CONSTRAINT profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('Admin', 'Dispatcher', 'Technician', 'Sales', 'Engineer'));

-- 2. Create site_visits table
CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL UNIQUE,
  engineer_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Step 1: Client & Context
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  site_address TEXT NOT NULL,
  no_of_floors TEXT,
  other_floor_value TEXT,
  phase TEXT,
  site_gps JSONB, -- { lat, lng }
  
  -- Step 2 & 3 & 4 & 5: Photos and Videos (stored as URLs)
  photos JSONB DEFAULT '{}'::jsonb, -- front, left, right, back, solarSystemLocation, structureCustomDesign, inverter, engineer, client, roadAccess, acdbDcdb
  videos JSONB DEFAULT '{}'::jsonb, -- shadowAnalysis, earthing, lightningArrestorEarthing, plantToInverter, inverterToEarthing
  
  -- Step 3: Solar Space Details
  solar_space JSONB DEFAULT '{}'::jsonb, -- length, width, southFacing, shape
  
  -- Step 4: Structure & Electrical
  structure JSONB DEFAULT '{}'::jsonb, -- size, lightArrestorLocation, lightningArrestor, additionalPipe, pipeLength
  electrical JSONB DEFAULT '{}'::jsonb, -- inverterLocation
  
  -- Step 6: Declaration & Signature
  signature_url TEXT, -- Base64 or URL
  status TEXT DEFAULT 'completed',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Admin/Dispatcher can see all
CREATE POLICY "Admins can view all site visits" ON public.site_visits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

-- Engineers/Sales can view and create their own
CREATE POLICY "Engineers can view own site visits" ON public.site_visits
  FOR SELECT USING (engineer_id = auth.uid());

CREATE POLICY "Engineers can create site visits" ON public.site_visits
  FOR INSERT WITH CHECK (engineer_id = auth.uid());

-- 4. Storage Bucket Setup (Instructions)
-- Manually create a bucket named 'site-visits' in the Supabase Dashboard.
-- Set it to NOT public.
-- Add policies:
-- 1. "Authenticated users can upload" (INSERT)
-- 2. "Authenticated users can read" (SELECT)
