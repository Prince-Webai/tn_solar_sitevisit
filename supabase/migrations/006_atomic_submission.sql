-- Function to handle atomic site visit submission
-- This reduces round-trips and ensures data consistency

CREATE OR REPLACE FUNCTION public.submit_site_visit_v2(
  p_job_id UUID,
  p_engineer_id UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_site_address TEXT,
  p_district TEXT,
  p_site_gps JSONB,
  p_no_of_floors TEXT,
  p_other_floor_value TEXT,
  p_phase TEXT,
  p_photos JSONB,
  p_videos JSONB,
  p_solar_space JSONB,
  p_structure JSONB,
  p_electrical JSONB,
  p_signature_url TEXT,
  p_user_name TEXT DEFAULT 'Engineer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to update jobs and audit logs
AS $$
DECLARE
  v_visit_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Upsert site visit
  INSERT INTO public.site_visits (
    job_id,
    engineer_id,
    client_name,
    client_phone,
    site_address,
    district,
    site_gps,
    no_of_floors,
    other_floor_value,
    phase,
    photos,
    videos,
    solar_space,
    structure,
    electrical,
    signature_url,
    status,
    updated_at
  ) VALUES (
    p_job_id,
    p_engineer_id,
    p_client_name,
    p_client_phone,
    p_site_address,
    p_district,
    p_site_gps,
    p_no_of_floors,
    p_other_floor_value,
    p_phase,
    p_photos,
    p_videos,
    p_solar_space,
    p_structure,
    p_electrical,
    p_signature_url,
    'completed',
    now()
  )
  ON CONFLICT (job_id) DO UPDATE SET
    client_name = EXCLUDED.client_name,
    client_phone = EXCLUDED.client_phone,
    site_address = EXCLUDED.site_address,
    district = EXCLUDED.district,
    site_gps = EXCLUDED.site_gps,
    no_of_floors = EXCLUDED.no_of_floors,
    other_floor_value = EXCLUDED.other_floor_value,
    phase = EXCLUDED.phase,
    photos = EXCLUDED.photos,
    videos = EXCLUDED.videos,
    solar_space = EXCLUDED.solar_space,
    structure = EXCLUDED.structure,
    electrical = EXCLUDED.electrical,
    signature_url = EXCLUDED.signature_url,
    status = 'completed',
    updated_at = now()
  RETURNING id INTO v_visit_id;

  -- 2. Update Job status and GPS
  IF p_site_gps IS NOT NULL THEN
    UPDATE public.jobs
    SET 
      latitude = (p_site_gps->>'lat')::NUMERIC,
      longitude = (p_site_gps->>'lng')::NUMERIC,
      status = 'In Progress',
      updated_at = now()
    WHERE id = p_job_id;
  ELSE
    UPDATE public.jobs
    SET 
      status = 'In Progress',
      updated_at = now()
    WHERE id = p_job_id;
  END IF;

  -- 3. Add Audit Log
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    p_engineer_id,
    p_user_name,
    'site_visit_submitted',
    'job',
    p_job_id,
    'Site visit report submitted via atomic transaction (v2)',
    now()
  );

  -- Return success
  SELECT jsonb_build_object(
    'success', true,
    'visit_id', v_visit_id,
    'message', 'Site visit submitted successfully'
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- Postgres automatically rolls back on error in a function
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;
