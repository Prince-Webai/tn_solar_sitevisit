const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  console.log('Checking connection to:', supabaseUrl);
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.log('Connection successful, but table "profiles" does not exist. Database is likely empty.');
    } else {
      console.error('Error connecting to Supabase:', error);
    }
  } else {
    console.log('Connection successful! Found', data.length, 'profiles.');
  }
}

checkConnection();
