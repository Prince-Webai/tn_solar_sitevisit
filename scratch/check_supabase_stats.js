const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
  const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
  const { count: visitCount } = await supabase.from('site_visits').select('*', { count: 'exact', head: true });

  console.log('Supabase Data Stats:');
  console.log(`- Jobs: ${jobCount}`);
  console.log(`- Clients: ${clientCount}`);
  console.log(`- Site Visits: ${visitCount}`);
}

check().catch(console.error);
