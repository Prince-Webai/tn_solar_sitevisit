
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLog() {
  console.log('Inserting test log...');
  
  // Get a valid job ID first
  const { data: jobs } = await supabase.from('jobs').select('id').limit(1);
  if (!jobs || jobs.length === 0) {
    console.error('No jobs found to log against');
    return;
  }
  
  const jobId = jobs[0].id;
  
  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      action: 'test_action',
      entity_type: 'job',
      entity_id: jobId,
      details: 'This is a test log from script',
      user_name: 'System Test'
    })
    .select();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success! Log inserted:', data);
  }
}

testLog();
