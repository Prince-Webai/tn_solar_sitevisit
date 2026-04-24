
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTables() {
  console.log('Fixing tables...');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS public.staff_locations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      latitude NUMERIC(10,7) NOT NULL,
      longitude NUMERIC(10,7) NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(profile_id)
    );

    ALTER TABLE public.staff_locations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admin/Dispatcher full access staff_locations" ON public.staff_locations;
    CREATE POLICY "Admin/Dispatcher full access staff_locations" ON public.staff_locations
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Dispatcher'))
      );

    DROP POLICY IF EXISTS "Technician update own location" ON public.staff_locations;
    CREATE POLICY "Technician update own location" ON public.staff_locations
      FOR ALL USING (
        profile_id = auth.uid()
      );

    -- Ensure it's in the realtime publication
    BEGIN;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_locations;
    EXCEPTION
      WHEN others THEN NULL;
    END;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(err => ({ error: err }));
  
  if (error) {
    console.error('Error running SQL via RPC:', error.message);
    console.log('Attempting alternative: raw query might not be supported via supabase-js without an RPC helper.');
    console.log('Please run the SQL in your Supabase SQL Editor manually.');
  } else {
    console.log('Table staff_locations created successfully.');
  }
}

fixTables();
