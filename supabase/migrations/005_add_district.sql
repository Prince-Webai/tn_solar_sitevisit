-- Migration to add district column to jobs and clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS district TEXT;

-- Update RLS if necessary (it should be fine as it allows ALL for Admin/Dispatcher and INSERT for Sales)
