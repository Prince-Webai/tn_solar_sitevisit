import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using ANON key to test RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Login as a user to test RLS
  // I will use an existing user email/password if I know one, or I can just test without auth.
  // Wait, without auth, INSERT will fail RLS. Let's see if it throws instantly or hangs.
  console.log('Testing create client (unauthenticated)...');
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
  } else {
    console.log('Client Created:', client?.id);
  }
}

test();
