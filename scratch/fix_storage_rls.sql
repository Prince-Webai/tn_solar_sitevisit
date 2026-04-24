-- SQL to fix Storage RLS policies for site-visits bucket
-- Run this in the Supabase SQL Editor

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-visits', 'site-visits', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on the objects table (usually enabled by default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow authenticated users to upload files to 'site-visits' bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-visits');

-- 4. Policy: Allow authenticated users to read files from 'site-visits' bucket
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'site-visits');

-- 5. Policy: Allow authenticated users to update their own files (optional but good)
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-visits');

-- 6. Policy: Allow authenticated users to delete their own files (optional)
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-visits');
