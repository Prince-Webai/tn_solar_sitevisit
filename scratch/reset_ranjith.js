const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const email = 'ranjithkumar@tnsolarsolution.com';
  // Generate a truly random password
  const newPassword = Math.random().toString(36).slice(-10) + 
                     Math.random().toString(36).toUpperCase().slice(-5) + 
                     '!@#';

  console.log(`Searching for user: ${email}...`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error(`User ${email} not found in Auth!`);
    return;
  }

  console.log(`User found with ID: ${user.id}. Resetting password to a random string...`);

  const { data, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('Error updating password:', updateError.message);
  } else {
    console.log('\n✅ Password reset successfully with a random string!');
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);
  }
}

resetPassword();
