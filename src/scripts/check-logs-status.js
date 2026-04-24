
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
  console.log('Checking audit_logs table...');
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching logs:', error.message);
    if (error.message.includes('does not exist')) {
      console.error('CRITICAL: The audit_logs table STILL does not exist in the database.');
    }
  } else {
    console.log('Recent Logs:', data);
    if (data.length === 0) {
      console.log('No logs found. The table exists but is empty.');
    }
  }
}

checkLogs();
