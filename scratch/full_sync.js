const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';
const MONGODB_URI = process.env.MONGODB_URI;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncAll() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const tables = [
    { supabase: 'profiles', mongo: 'profiles' },
    { supabase: 'clients', mongo: 'clients' },
    { supabase: 'jobs', mongo: 'jobs' },
    { supabase: 'job_checklist', mongo: 'jobchecklists' },
    { supabase: 'site_visits', mongo: 'sitevisits' },
    { supabase: 'audit_logs', mongo: 'auditlogs' }
  ];

  for (const table of tables) {
    console.log(`\nSyncing ${table.supabase} -> ${table.mongo}...`);
    const { data, error } = await supabase.from(table.supabase).select('*');
    if (error) {
      console.error(`Error fetching ${table.supabase}:`, error);
      continue;
    }

    console.log(`Found ${data.length} records.`);
    const collection = mongoose.connection.db.collection(table.mongo);

    for (const item of data) {
      const { id, ...rest } = item;
      // Handle potential column name differences
      // e.g., Supabase uses snake_case, MongoDB might too or camelCase
      // The models seem to use snake_case for most fields.
      
      await collection.updateOne(
        { _id: id },
        { $set: { _id: id, ...rest } },
        { upsert: true }
      );
    }
    console.log(`Synced ${data.length} records to ${table.mongo}`);
  }

  console.log('\nAll sync complete!');
  await mongoose.disconnect();
}

syncAll().catch(console.error);
