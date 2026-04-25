const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = 'https://clhbnthrkfzdhtklwypi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runStressTest() {
  console.log('--- DB STRESS TEST STARTING ---');
  
  // 1. Fetch some data to get valid IDs
  const { data: jobs } = await supabase.from('jobs').select('id').limit(1);
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  
  if (!jobs?.length || !profiles?.length) {
    console.error('No jobs or profiles found to test with.');
    return;
  }
  
  const jobId = jobs[0].id;
  const engineerId = profiles[0].id;
  
  console.log(`Using JobID: ${jobId}, EngineerID: ${engineerId}`);

  const CONCURRENT_REQUESTS = 50; // Simulate 50 simultaneous dashboard loads
  console.log(`Simulating ${CONCURRENT_REQUESTS} concurrent dashboard loads (fetchJobs)...`);

  const startTime = Date.now();
  
  const tasks = Array.from({ length: CONCURRENT_REQUESTS }).map(async (_, i) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, client:clients(*), assigned_staff:profiles(*)')
        .limit(10);
      
      if (error) throw error;
      return { success: true, index: i };
    } catch (err) {
      return { success: false, index: i, error: err.message };
    }
  });

  const results = await Promise.all(tasks);
  const endTime = Date.now();
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n--- RESULTS ---');
  console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Time: ${endTime - startTime}ms`);
  console.log(`Average Latency: ${((endTime - startTime) / CONCURRENT_REQUESTS).toFixed(2)}ms`);
  
  if (failed > 0) {
    console.log('\nSample Error:', results.find(r => !r.success).error);
  } else {
    console.log('\n✅ All concurrent requests processed successfully without database crashes!');
  }
}

runStressTest();
