const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for migration
);

async function run() {
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
    
    DROP POLICY IF EXISTS "Public read staff_locations" ON public.staff_locations;
    CREATE POLICY "Public read staff_locations" ON public.staff_locations FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Own location update" ON public.staff_locations;
    CREATE POLICY "Own location update" ON public.staff_locations FOR ALL USING (profile_id = auth.uid());
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('Migration error:', error);
  } else {
    console.log('Migration successful');
  }
}

run();
