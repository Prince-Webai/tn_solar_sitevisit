import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We use the REST API to query pg_constraint? No, we can't query pg_constraint via PostgREST unless there's a view.
// But we CAN use the REST API to fetch one job and see its current status, OR we can test more statuses.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const statuses = [
    'In-Progress', 'IN PROGRESS', 'in progress', 'Site Visit', 'Assessment', 'Scheduled', 'Dispatched', 'Started'
  ];
  
  for (const status of statuses) {
    const jobNumber = `TN-TEST-${Math.floor(10000 + Math.random() * 89999)}`;
    const { error } = await supabase
      .from('jobs')
      .insert({
        address: '123 Test St',
        status: status,
        job_number: jobNumber
      });
      
    if (!error) {
      console.log(`✅ Success: ${status}`);
    }
  }
}

test();
