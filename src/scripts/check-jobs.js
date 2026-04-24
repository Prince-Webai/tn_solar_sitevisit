
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
  console.log('Checking jobs...');
  const { data: jobs, error } = await supabase.from('jobs').select('*');
  if (error) {
    console.error('Error fetching jobs:', error.message);
    return;
  }

  console.log(`Found ${jobs.length} jobs.`);
  jobs.forEach(j => {
    console.log(`- ${j.job_number}: Status=${j.status}, Materials=${j.materials_status}, Visit=${j.requires_site_visit}`);
  });
}

checkJobs();
