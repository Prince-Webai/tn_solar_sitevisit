-- VisionSolar Job Manager - Database Schema
-- Run in Supabase SQL Editor to create all tables

-- ===========================
-- PROFILES (extends auth.users)
-- ===========================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Dispatcher', 'Technician')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- CLIENTS
-- ===========================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- JOBS
-- ===========================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  suburb TEXT,
  status TEXT NOT NULL DEFAULT 'Quote' CHECK (status IN ('Lead', 'Quote', 'Quote Sent', 'Work Order', 'In Progress', 'Completed', 'Cancelled', 'Unsuccessful', 'Archived')),
  category TEXT CHECK (category IN ('Installation', 'Service', 'Site Assessment')),
  description TEXT,
  po_number TEXT,
  scheduled_date DATE,
  completed_date DATE,
  estimated_hours NUMERIC(5,2),
  system_size TEXT,
  requires_site_visit BOOLEAN DEFAULT false,
  materials_status TEXT DEFAULT 'N/A' CHECK (materials_status IN ('Pending', 'Ordered', 'Received', 'N/A')),
  invoice_status TEXT DEFAULT 'Draft' CHECK (invoice_status IN ('Draft', 'Sent', 'Paid', 'Unpaid', 'Overdue')),
  total_value NUMERIC(12,2),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  billing_same_as_job BOOLEAN DEFAULT true,
  billing_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- JOB LINE ITEMS
-- ===========================
CREATE TABLE IF NOT EXISTS public.job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  item_code TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  total NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + tax_percent / 100)) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- JOB CHECKLIST
-- ===========================
CREATE TABLE IF NOT EXISTS public.job_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- JOB ATTACHMENTS
-- ===========================
CREATE TABLE IF NOT EXISTS public.job_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- STAFF LOCATIONS (Realtime)
-- ===========================
CREATE TABLE IF NOT EXISTS public.staff_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id)
);

-- ===========================
-- AUDIT LOGS
-- ===========================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- INDEXES
-- ===========================
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON public.jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON public.jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_job_items_job_id ON public.job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_job_checklist_job_id ON public.job_checklist(job_id);
CREATE INDEX IF NOT EXISTS idx_job_attachments_job_id ON public.job_attachments(job_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ===========================
-- ROW LEVEL SECURITY
-- ===========================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin/Dispatcher: Full access
CREATE POLICY "Admin/Dispatcher full access profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

CREATE POLICY "Admin/Dispatcher full access clients" ON public.clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

CREATE POLICY "Admin/Dispatcher full access jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

CREATE POLICY "Admin/Dispatcher full access job_items" ON public.job_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

CREATE POLICY "Admin/Dispatcher full access job_checklist" ON public.job_checklist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

CREATE POLICY "Admin/Dispatcher full access job_attachments" ON public.job_attachments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

CREATE POLICY "Admin/Dispatcher full access staff_locations" ON public.staff_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

CREATE POLICY "Admin/Dispatcher full access audit_logs" ON public.audit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
  );

-- Technician: Read own assigned jobs, update status
CREATE POLICY "Technician read own jobs" ON public.jobs
  FOR SELECT USING (
    assigned_to = auth.uid()
  );

CREATE POLICY "Technician update own jobs" ON public.jobs
  FOR UPDATE USING (
    assigned_to = auth.uid()
  );

CREATE POLICY "Technician read own profile" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
  );

CREATE POLICY "Technician update own location" ON public.staff_locations
  FOR ALL USING (
    profile_id = auth.uid()
  );

-- Enable Realtime for staff_locations and jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- ===========================
-- STORAGE BUCKET
-- ===========================
-- Run this in the Supabase Dashboard > Storage or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('job-attachments', 'job-attachments', false);

-- Storage policies (run in Supabase Dashboard):
-- Authenticated users can upload:
-- CREATE POLICY "Auth users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'job-attachments' AND auth.role() = 'authenticated');
-- Authenticated users can read:
-- CREATE POLICY "Auth users can read" ON storage.objects FOR SELECT USING (bucket_id = 'job-attachments' AND auth.role() = 'authenticated');
