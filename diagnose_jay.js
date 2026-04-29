import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  // 1. Find Jay Kishor's profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .ilike('full_name', '%jai%');

  console.log('Matching profiles:', JSON.stringify(profiles, null, 2));

  if (!profiles || profiles.length === 0) {
    console.log('No profile found for Jai Kishor!');
    return;
  }

  const jay = profiles[0];
  console.log(`\nJay's user ID: ${jay.id}, Role: ${jay.role}`);

  // 2. Find ALL jobs assigned to Jay
  const { data: assignedJobs } = await supabase
    .from('jobs')
    .select('id, job_number, status, assigned_to, scheduled_date, created_at')
    .eq('assigned_to', jay.id);

  console.log(`\nJobs assigned to Jay (assigned_to = ${jay.id}):`);
  console.log(JSON.stringify(assignedJobs, null, 2));

  // 3. Find ALL jobs (to see total count)
  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });
  console.log(`\nTotal jobs in DB: ${count}`);

  // 4. Find jobs with no assigned_to
  const { data: unassignedJobs } = await supabase
    .from('jobs')
    .select('id, job_number, status, assigned_to, contact_name')
    .is('assigned_to', null)
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\nMost recent unassigned jobs (sample):');
  console.log(JSON.stringify(unassignedJobs, null, 2));
}

diagnose();
