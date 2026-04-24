
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncProfiles() {
  console.log('Syncing profiles...');
  
  // 1. Get all auth users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError.message);
    return;
  }

  // 2. Get all existing profiles
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id');
  if (profileError) {
    console.error('Error fetching profiles:', profileError.message);
    return;
  }

  const profileIds = new Set(profiles.map(p => p.id));
  
  // 3. Create missing profiles
  for (const user of users) {
    if (!profileIds.has(user.id)) {
      console.log(`Creating profile for ${user.email} [${user.id}]...`);
      
      // Determine role from email or default to Sales
      let role = 'Sales';
      if (user.email.includes('admin')) role = 'Admin';
      if (user.email.includes('engineer') || user.email.includes('tech')) role = 'Engineer';

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        role: role,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`
      });

      if (insertError) {
        console.error(`Failed to create profile for ${user.email}:`, insertError.message);
      } else {
        console.log(`Successfully created ${role} profile for ${user.email}`);
      }
    }
  }

  console.log('Sync complete.');
}

syncProfiles();
