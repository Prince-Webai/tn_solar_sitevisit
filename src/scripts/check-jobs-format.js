
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
  console.log('Checking recent jobs...');
  const { data, error } = await supabase
    .from('jobs')
    .select('id, job_number, contact_phone, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching jobs:', error.message);
  } else {
    console.log('Recent Jobs:', data);
  }
}

checkJobs();
