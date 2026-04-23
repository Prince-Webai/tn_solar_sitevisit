
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_info', { t_name: 'profiles' });
  if (error) {
    // If RPC doesn't exist, try to just query a column info if possible, 
    // but usually we can't do that without direct SQL access.
    // We'll try to insert a 'Sales' user to see if it fails the constraint.
    console.log('Testing "Sales" role insertion...');
    const { error: iError } = await supabase.from('profiles').insert({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'test_schema@example.com',
        full_name: 'Test Schema',
        role: 'Sales'
    });
    if (iError) {
        console.error('Insertion failed:', iError.message);
    } else {
        console.log('Insertion succeeded! "Sales" is allowed.');
        // Cleanup
        await supabase.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    }
  } else {
    console.log('Table info:', data);
  }
}

checkSchema();
