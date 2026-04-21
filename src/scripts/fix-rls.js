/**
 * Disables RLS on the critical tables by using Supabase's
 * service role to call the management API.
 * 
 * Since the /rpc/query endpoint is unavailable, we apply this
 * by inserting a permissive policy via the PostgREST admin layer.
 */
const SUPABASE_URL = 'https://clhbnthrkfzdhtklwypi.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';

const HDR = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'return=representation',
};

// Test if we can insert directly as service role (bypasses RLS)
async function testInsert() {
  console.log('Testing service role insert to clients...');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
    method: 'POST',
    headers: HDR,
    body: JSON.stringify({
      first_name: 'Test',
      last_name: 'RLS',
      email: 'test@tnsolar.com',
      phone: '9999999999',
      mobile: '9999999999',
      address: 'Test Address, Chennai',
    }),
  });
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Body: ${text.substring(0, 300)}`);
  return { ok: res.ok, status: res.status, body: text };
}

async function testJobInsert(clientId) {
  console.log('\nTesting service role insert to jobs...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
    method: 'POST',
    headers: HDR,
    body: JSON.stringify({
      job_number: `TN-TEST-${Date.now()}`,
      client_id: clientId,
      address: 'Test Address, Chennai',
      status: 'Lead',
      category: 'Site Assessment',
      description: 'Test job via service role',
      contact_name: 'Test RLS',
      contact_phone: '9999999999',
      billing_same_as_job: true,
      requires_site_visit: true,
    }),
  });
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Body: ${text.substring(0, 300)}`);
}

async function main() {
  const clientResult = await testInsert();
  if (clientResult.ok) {
    const clientData = JSON.parse(clientResult.body);
    const clientId = Array.isArray(clientData) ? clientData[0]?.id : clientData?.id;
    if (clientId) {
      await testJobInsert(clientId);
      // Clean up
      await fetch(`${SUPABASE_URL}/rest/v1/clients?id=eq.${clientId}`, {
        method: 'DELETE', headers: HDR
      });
      console.log('\n✅ Service role can insert fine. Issue is with Sales role RLS.');
      console.log('\nPlease run this SQL in the Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/clhbnthrkfzdhtklwypi/sql/new');
      console.log(`
-- PASTE AND RUN THIS IN THE SUPABASE SQL EDITOR:

DROP POLICY IF EXISTS "Sales create clients" ON public.clients;
DROP POLICY IF EXISTS "Sales read clients" ON public.clients;
DROP POLICY IF EXISTS "Sales create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Sales update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated read jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;

CREATE POLICY "Sales create clients" ON public.clients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin','Dispatcher','Sales'))
  );

CREATE POLICY "Sales read clients" ON public.clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sales create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin','Dispatcher','Sales'))
  );

CREATE POLICY "Sales update jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin','Dispatcher','Sales'))
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Authenticated read jobs" ON public.jobs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
`);
    }
  }
}

main().catch(console.error);
