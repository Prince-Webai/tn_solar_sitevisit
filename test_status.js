import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.rpc('get_constraint', {});
  // Wait, I don't have a get_constraint rpc.
  // I can just try inserting with 'Quote' and see if it fails, then 'Unscheduled', etc.
  
  const statuses = ['Lead', 'Quote', 'Quote Sent', 'Work Order', 'In Progress', 'Completed', 'Cancelled', 'Unsuccessful', 'Archived', 'Unscheduled'];
  
  for (const status of statuses) {
    console.log(`Trying to insert with status: ${status}...`);
    const jobNumber = `TN-TEST-${Math.floor(10000 + Math.random() * 89999)}`;
    const { error } = await supabase
      .from('jobs')
      .insert({
        address: '123 Test St',
        status: status,
        job_number: jobNumber
      });
      
    if (error) {
      console.log(`❌ Failed: ${status} -> ${error.message}`);
    } else {
      console.log(`✅ Success: ${status}`);
    }
  }
}

test();
