const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const email = 'test@visionsolar.com';
  const password = 'Password123!';

  console.log(`Attempting to sign up ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('User already registered')) {
      console.log('User already exists. Skipping signup.');
    } else {
      console.error('Error signing up:', error.message);
      return;
    }
  } else {
    console.log('User signed up successfully:', data.user.id);
  }

  // Note: We can't insert profile directly if RLS is on and we are using anon key 
  // unless we have a policy allowing it or the trigger handles it.
  // But for testing purposes, we'll try to insert it.
  
  // Since we don't have the user's ID easily if they already existed (without service key),
  // we'll try to sign in to get the session.
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Error signing in:', signInError.message);
    return;
  }

  const userId = signInData.user.id;
  console.log('Signed in. User ID:', userId);

  // Insert profile as Admin
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      full_name: 'Test Admin',
      role: 'Admin',
    });

  if (profileError) {
    console.error('Error creating profile:', profileError.message);
  } else {
    console.log('Admin profile created/updated successfully.');
  }
}

createTestUser();
