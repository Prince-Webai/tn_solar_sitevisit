
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('Checking database status...');
  
  // Check profiles
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) {
    console.error('Error fetching profiles:', pError);
  } else {
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(p => console.log(`- ${p.full_name} (${p.role}) [${p.id}]`));
  }

  // Check jobs
  const { data: jobs, error: jError } = await supabase.from('jobs').select('count', { count: 'exact' });
  if (jError) {
    console.error('Error fetching jobs count:', jError);
  } else {
    console.log(`Found ${jobs[0]?.count || 0} jobs.`);
  }

  // Check auth users
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
  if (uError) {
    console.error('Error fetching auth users:', uError);
  } else {
    console.log(`Found ${users.length} auth users:`);
    users.forEach(u => console.log(`- ${u.email} [${u.id}]`));
  }
}

checkDatabase();
