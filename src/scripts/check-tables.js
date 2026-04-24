
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking tables...');
  
  // Try to query staff_locations
  const { data, error } = await supabase
    .from('staff_locations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying staff_locations:', error.message);
    if (error.code === '42P01') {
      console.log('Table "staff_locations" DOES NOT EXIST.');
    }
  } else {
    console.log('Table "staff_locations" exists.');
  }

  // Check roles in profiles table
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .limit(10);

  if (profileData) {
    const roles = [...new Set(profileData.map(p => p.role))];
    console.log('Roles found in profiles table:', roles);
  }
}

checkTables();
