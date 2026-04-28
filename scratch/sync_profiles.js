const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';
const MONGODB_URI = process.env.MONGODB_URI;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sync() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  console.log('Fetching profiles from Supabase...');
  const { data: supabaseProfiles, error } = await supabase.from('profiles').select('*');

  if (error) {
    console.error('Error fetching from Supabase:', error);
    return;
  }

  console.log(`Found ${supabaseProfiles.length} profiles in Supabase.`);

  const Profile = mongoose.connection.db.collection('profiles');

  for (const sp of supabaseProfiles) {
    console.log(`Syncing profile: ${sp.email} (${sp.role})`);
    await Profile.updateOne(
      { _id: sp.id },
      { 
        $set: {
          _id: sp.id,
          email: sp.email,
          full_name: sp.full_name,
          role: sp.role,
          avatar_url: sp.avatar_url,
          status: sp.status,
          created_at: sp.created_at || new Date(),
          updated_at: new Date()
        }
      },
      { upsert: true }
    );
  }

  console.log('Sync complete!');
  await mongoose.disconnect();
}

sync().catch(console.error);
