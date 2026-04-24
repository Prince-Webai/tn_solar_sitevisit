
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuditLogs() {
  console.log('Checking audit_logs...');
  const { data: logs, error } = await supabase.from('audit_logs').select('*').limit(5);
  if (error) {
    console.error('Error fetching logs:', error.message);
    return;
  }

  console.log(`Found ${logs.length} logs (showing last 5):`);
  logs.forEach(l => {
    console.log(`- [${l.created_at}] User:${l.user_name} Action:${l.action} Entity:${l.entity_id} Details:${l.details}`);
  });
}

checkAuditLogs();
