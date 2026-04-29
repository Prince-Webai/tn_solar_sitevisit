import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using service role for bypass, or anon for exact replica. We'll try anon first.
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('Testing create client...');
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert({
      first_name: 'Test',
      last_name: 'User',
      email: `test.${Date.now()}@test.com`,
      phone: '1234567890',
      address: '123 Test St',
      district: 'Chennai'
    })
    .select()
    .single();

  if (clientErr) {
    console.error('Client Error:', clientErr);
    return;
  }
  console.log('Client Created:', client.id);

  console.log('Testing create job...');
  const jobNumber = `TN-1234567890-${Math.floor(1000 + Math.random() * 8999)}`;
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .insert({
      client_id: client.id,
      address: '123 Test St',
      district: 'Chennai',
      status: 'Lead',
      category: 'Site Assessment',
      description: 'Site visit booked by sales',
      contact_name: 'Test User',
      contact_email: 'test@test.com',
      contact_phone: '1234567890',
      requires_site_visit: true,
      materials_status: 'Pending',
      job_number: jobNumber
    })
    .select()
    .single();

  if (jobErr) {
    console.error('Job Error:', jobErr);
    return;
  }
  console.log('Job Created:', job.id);
}

test();
