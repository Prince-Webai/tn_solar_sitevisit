-- ============================================================
-- TN SOLAR SITE VISIT MANAGEMENT — MASTER SCHEMA (v2)
-- Updated: 2026-04-27
-- Includes: All migrations 001–006 + all bugfixes + Sales/Engineer
--           RLS permissions + site_visits unique constraint fix
-- ✅ SAFE TO RUN MULTIPLE TIMES (fully idempotent)
-- ============================================================


-- ============================================================
-- SECTION 1: PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all 5 roles are allowed
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('Admin', 'Dispatcher', 'Technician', 'Sales', 'Engineer'));


-- ============================================================
-- SECTION 2: CLIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  mobile     TEXT,
  address    TEXT,
  district   TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS district TEXT;


-- ============================================================
-- SECTION 3: JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number           TEXT NOT NULL UNIQUE,
  client_id            UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  address              TEXT NOT NULL,
  suburb               TEXT,
  district             TEXT,
  latitude             NUMERIC(10,7),
  longitude            NUMERIC(10,7),
  status               TEXT NOT NULL DEFAULT 'Quote'
                         CHECK (status IN ('Lead','Quote','Quote Sent','Work Order',
                                           'In Progress','Completed','Cancelled',
                                           'Unsuccessful','Archived')),
  category             TEXT CHECK (category IN ('Installation','Service','Site Assessment')),
  description          TEXT,
  po_number            TEXT,
  scheduled_date       TIMESTAMPTZ,
  completed_date       DATE,
  estimated_hours      NUMERIC(5,2),
  system_size          TEXT,
  requires_site_visit  BOOLEAN DEFAULT false,
  materials_status     TEXT DEFAULT 'N/A'
                         CHECK (materials_status IN ('Pending','Ordered','Received','N/A')),
  invoice_status       TEXT DEFAULT 'Draft'
                         CHECK (invoice_status IN ('Draft','Sent','Paid','Unpaid','Overdue')),
  total_value          NUMERIC(12,2),
  assigned_to          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_name         TEXT,
  contact_email        TEXT,
  contact_phone        TEXT,
  billing_same_as_job  BOOLEAN DEFAULT true,
  billing_address      TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Idempotent column additions (migration guard)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS district   TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS latitude   NUMERIC(10,7);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS longitude  NUMERIC(10,7);


-- ============================================================
-- SECTION 4: SITE VISITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_visits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  engineer_id       UUID NOT NULL REFERENCES public.profiles(id),

  -- Step 1: Client & Context
  client_name       TEXT NOT NULL,
  client_phone      TEXT NOT NULL,
  site_address      TEXT NOT NULL,
  district          TEXT,
  no_of_floors      TEXT,
  other_floor_value TEXT,
  phase             TEXT,
  site_gps          JSONB,           -- { lat, lng }

  -- Steps 2-5: Media (stored as public URLs in Supabase Storage)
  photos            JSONB DEFAULT '{}'::jsonb,
  videos            JSONB DEFAULT '{}'::jsonb,

  -- Step 3: Solar Space
  solar_space       JSONB DEFAULT '{}'::jsonb,

  -- Step 4: Structure & Electrical
  structure         JSONB DEFAULT '{}'::jsonb,
  electrical        JSONB DEFAULT '{}'::jsonb,

  -- Step 6: Signature & Status
  signature_url     TEXT,
  status            TEXT DEFAULT 'completed',

  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Ensure the unique constraint on job_id exists for ON CONFLICT upsert to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.site_visits'::regclass
    AND   conname  = 'site_visits_job_id_key'
  ) THEN
    ALTER TABLE public.site_visits ADD CONSTRAINT site_visits_job_id_key UNIQUE (job_id);
  END IF;
END $$;

ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS district TEXT;


-- ============================================================
-- SECTION 5: SUPPORTING TABLES
-- ============================================================

-- Job Line Items
CREATE TABLE IF NOT EXISTS public.job_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  item_code   TEXT,
  description TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2)  NOT NULL DEFAULT 10,
  total       NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + tax_percent / 100)) STORED,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Job Checklist
CREATE TABLE IF NOT EXISTS public.job_checklist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  completed  BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Job Attachments
CREATE TABLE IF NOT EXISTS public.job_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_type   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_size   INTEGER NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Staff Locations (for realtime tracking)
CREATE TABLE IF NOT EXISTS public.staff_locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude   NUMERIC(10,7) NOT NULL,
  longitude  NUMERIC(10,7) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name   TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  details     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- SECTION 6: INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jobs_client_id        ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status            ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date    ON public.jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to       ON public.jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_job_items_job_id       ON public.job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_job_checklist_job_id   ON public.job_checklist(job_id);
CREATE INDEX IF NOT EXISTS idx_job_attachments_job_id ON public.job_attachments(job_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity      ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_job_id     ON public.site_visits(job_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_engineer   ON public.site_visits(engineer_id);


-- ============================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checklist   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits     ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (clean slate)

-- profiles
DROP POLICY IF EXISTS "Admin/Dispatcher full access profiles"            ON public.profiles;
DROP POLICY IF EXISTS "Technician read own profile"                      ON public.profiles;
DROP POLICY IF EXISTS "Authenticated read profiles"                      ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles"              ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to all profiles"          ON public.profiles;
DROP POLICY IF EXISTS "Admins full access to profiles"                   ON public.profiles;
DROP POLICY IF EXISTS "Admins mutations profiles"                        ON public.profiles;
DROP POLICY IF EXISTS "Admins insert profiles"                           ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles"                           ON public.profiles;
DROP POLICY IF EXISTS "Admins delete profiles"                           ON public.profiles;

-- clients
DROP POLICY IF EXISTS "Admin/Dispatcher full access clients"             ON public.clients;
DROP POLICY IF EXISTS "Sales create clients"                             ON public.clients;
DROP POLICY IF EXISTS "Sales read clients"                               ON public.clients;

-- jobs
DROP POLICY IF EXISTS "Admin/Dispatcher full access jobs"                ON public.jobs;
DROP POLICY IF EXISTS "Technician read own jobs"                         ON public.jobs;
DROP POLICY IF EXISTS "Technician update own jobs"                       ON public.jobs;
DROP POLICY IF EXISTS "Authenticated read jobs"                          ON public.jobs;
DROP POLICY IF EXISTS "Sales create jobs"                                ON public.jobs;
DROP POLICY IF EXISTS "Sales update jobs"                                ON public.jobs;
DROP POLICY IF EXISTS "Engineer update assigned jobs"                    ON public.jobs;
DROP POLICY IF EXISTS "Staff update assigned jobs"                       ON public.jobs;

-- site_visits
DROP POLICY IF EXISTS "Admins can view all site visits"                  ON public.site_visits;
DROP POLICY IF EXISTS "Engineers can view own site visits"               ON public.site_visits;
DROP POLICY IF EXISTS "Engineers can create site visits"                 ON public.site_visits;
DROP POLICY IF EXISTS "Admins full access site visits"                   ON public.site_visits;
DROP POLICY IF EXISTS "Staff view own site visits"                       ON public.site_visits;
DROP POLICY IF EXISTS "Staff insert own site visits"                     ON public.site_visits;
DROP POLICY IF EXISTS "Staff update own site visits"                     ON public.site_visits;

-- supporting tables
DROP POLICY IF EXISTS "Admin/Dispatcher full access job_items"           ON public.job_items;
DROP POLICY IF EXISTS "Authenticated read job_items"                     ON public.job_items;
DROP POLICY IF EXISTS "Admin/Dispatcher full access job_checklist"       ON public.job_checklist;
DROP POLICY IF EXISTS "Authenticated read job_checklist"                 ON public.job_checklist;
DROP POLICY IF EXISTS "Staff update job_checklist"                       ON public.job_checklist;
DROP POLICY IF EXISTS "Staff insert job_checklist"                       ON public.job_checklist;
DROP POLICY IF EXISTS "Admin/Dispatcher full access job_attachments"     ON public.job_attachments;
DROP POLICY IF EXISTS "Authenticated read job_attachments"               ON public.job_attachments;
DROP POLICY IF EXISTS "Admin/Dispatcher full access staff_locations"     ON public.staff_locations;
DROP POLICY IF EXISTS "Admin/Dispatcher full access audit_logs"          ON public.audit_logs;
DROP POLICY IF EXISTS "Technician update own location"                   ON public.staff_locations;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs"        ON public.audit_logs;


-- PROFILES (non-circular — no subquery on self for SELECT)
CREATE POLICY "Profiles are readable by all authenticated users" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );


-- CLIENTS
CREATE POLICY "Admin/Dispatcher full access clients" ON public.clients
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

CREATE POLICY "Sales create clients" ON public.clients
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher', 'Sales')
  );

CREATE POLICY "Sales read clients" ON public.clients
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- JOBS
CREATE POLICY "Authenticated read jobs" ON public.jobs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sales create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher', 'Sales')
  );

CREATE POLICY "Staff update assigned jobs" ON public.jobs
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher', 'Sales')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Admin/Dispatcher full access jobs" ON public.jobs
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );


-- SITE VISITS
CREATE POLICY "Admins full access site visits" ON public.site_visits
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

CREATE POLICY "Staff view own site visits" ON public.site_visits
  FOR SELECT USING (engineer_id = auth.uid());

CREATE POLICY "Staff insert own site visits" ON public.site_visits
  FOR INSERT WITH CHECK (engineer_id = auth.uid());

CREATE POLICY "Staff update own site visits" ON public.site_visits
  FOR UPDATE USING (engineer_id = auth.uid())
  WITH CHECK (engineer_id = auth.uid());


-- JOB ITEMS
CREATE POLICY "Admin/Dispatcher full access job_items" ON public.job_items
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

CREATE POLICY "Authenticated read job_items" ON public.job_items
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- JOB CHECKLIST
CREATE POLICY "Admin/Dispatcher full access job_checklist" ON public.job_checklist
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

CREATE POLICY "Authenticated read job_checklist" ON public.job_checklist
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff update job_checklist" ON public.job_checklist
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff insert job_checklist" ON public.job_checklist
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- JOB ATTACHMENTS
CREATE POLICY "Admin/Dispatcher full access job_attachments" ON public.job_attachments
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

CREATE POLICY "Authenticated read job_attachments" ON public.job_attachments
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- STAFF LOCATIONS
CREATE POLICY "Admin/Dispatcher full access staff_locations" ON public.staff_locations
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

CREATE POLICY "Technician update own location" ON public.staff_locations
  FOR ALL USING (profile_id = auth.uid());


-- AUDIT LOGS
CREATE POLICY "Admin/Dispatcher full access audit_logs" ON public.audit_logs
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Dispatcher')
  );

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================
-- SECTION 8: REALTIME SUBSCRIPTIONS
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_locations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;


-- ============================================================
-- SECTION 9: ATOMIC SITE VISIT RPC FUNCTION (v2)
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_site_visit_v2(
  p_job_id            UUID,
  p_engineer_id       UUID,
  p_client_name       TEXT,
  p_client_phone      TEXT,
  p_site_address      TEXT,
  p_district          TEXT,
  p_site_gps          JSONB,
  p_no_of_floors      TEXT,
  p_other_floor_value TEXT,
  p_phase             TEXT,
  p_photos            JSONB,
  p_videos            JSONB,
  p_solar_space       JSONB,
  p_structure         JSONB,
  p_electrical        JSONB,
  p_signature_url     TEXT,
  p_user_name         TEXT DEFAULT 'Engineer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER   -- Runs with elevated privileges to bypass RLS for this transaction
AS $$
DECLARE
  v_visit_id UUID;
  v_result   JSONB;
BEGIN
  -- 1. Upsert site visit record (conflict on the unique job_id constraint)
  INSERT INTO public.site_visits (
    job_id, engineer_id, client_name, client_phone,
    site_address, district, site_gps, no_of_floors,
    other_floor_value, phase, photos, videos,
    solar_space, structure, electrical, signature_url,
    status, updated_at
  ) VALUES (
    p_job_id, p_engineer_id, p_client_name, p_client_phone,
    p_site_address, p_district, p_site_gps, p_no_of_floors,
    p_other_floor_value, p_phase, p_photos, p_videos,
    p_solar_space, p_structure, p_electrical, p_signature_url,
    'completed', now()
  )
  ON CONFLICT (job_id) DO UPDATE SET
    client_name       = EXCLUDED.client_name,
    client_phone      = EXCLUDED.client_phone,
    site_address      = EXCLUDED.site_address,
    district          = EXCLUDED.district,
    site_gps          = EXCLUDED.site_gps,
    no_of_floors      = EXCLUDED.no_of_floors,
    other_floor_value = EXCLUDED.other_floor_value,
    phase             = EXCLUDED.phase,
    photos            = EXCLUDED.photos,
    videos            = EXCLUDED.videos,
    solar_space       = EXCLUDED.solar_space,
    structure         = EXCLUDED.structure,
    electrical        = EXCLUDED.electrical,
    signature_url     = EXCLUDED.signature_url,
    status            = 'completed',
    updated_at        = now()
  RETURNING id INTO v_visit_id;

  -- 2. Update Job status and GPS coordinates atomically
  IF p_site_gps IS NOT NULL THEN
    UPDATE public.jobs
    SET
      latitude   = (p_site_gps->>'lat')::NUMERIC,
      longitude  = (p_site_gps->>'lng')::NUMERIC,
      status     = 'Site Visit',
      updated_at = now()
    WHERE id = p_job_id;
  ELSE
    UPDATE public.jobs
    SET
      status     = 'Site Visit',
      updated_at = now()
    WHERE id = p_job_id;
  END IF;

  -- 3. Write audit log entry
  INSERT INTO public.audit_logs (
    user_id, user_name, action, entity_type, entity_id, details, created_at
  ) VALUES (
    p_engineer_id,
    p_user_name,
    'site_visit_submitted',
    'job',
    p_job_id,
    'Site visit report submitted via atomic transaction (v2)',
    now()
  );

  -- Return success payload
  SELECT jsonb_build_object(
    'success',  true,
    'visit_id', v_visit_id,
    'message',  'Site visit submitted successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- PostgreSQL auto-rolls back on unhandled exception
  RETURN jsonb_build_object(
    'success', false,
    'error',   SQLERRM,
    'detail',  SQLSTATE
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_site_visit_v2 TO authenticated;


-- ============================================================
-- SECTION 10: STORAGE BUCKET + POLICIES
-- ============================================================

-- Create the 'site-visits' storage bucket (public for easier image access via next/image)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-visits', 'site-visits', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old storage policies
DROP POLICY IF EXISTS "Allow authenticated uploads"  ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads"    ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates"  ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes"  ON storage.objects;

CREATE POLICY "Allow authenticated uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-visits');

CREATE POLICY "Allow authenticated reads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'site-visits');

CREATE POLICY "Allow authenticated updates"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-visits');

CREATE POLICY "Allow authenticated deletes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-visits');


-- ============================================================
-- SECTION 11: AUTO-UPDATE TRIGGERS
-- ============================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach triggers to all relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','clients','jobs','site_visits']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON public.%s
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;


-- ============================================================
-- DONE
-- Schema version: v2 (2026-04-27)
-- This script is fully idempotent - safe to run multiple times.
-- ============================================================
