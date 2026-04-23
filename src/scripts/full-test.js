/**
 * Full test script:
 * 1. Verifies all 3 logins (Admin, Sales, Engineer)
 * 2. Creates a test client
 * 3. Creates a job and assigns it to the Engineer user
 * 4. Marks it as a Site Assessment / Site Visit job
 */

const SUPABASE_URL = 'https://clhbnthrkfzdhtklwypi.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjI2NzIsImV4cCI6MjA5MjE5ODY3Mn0.bCD4eE7n-mecmd25YfBnUbe8F2SiajHplubGs33MgZQ';

const HDR_S = { 'Content-Type':'application/json','apikey':SERVICE_KEY,'Authorization':`Bearer ${SERVICE_KEY}` };
const HDR_A = { 'Content-Type':'application/json','apikey':ANON_KEY };

// ── helpers ────────────────────────────────────────────────────────────────────
async function login(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method:'POST', headers:HDR_A,
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(d.error_description || d.msg);
  return { token: d.access_token, userId: d.user.id };
}

async function getProfile(token, userId) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role,full_name`, {
    headers: { ...HDR_A, 'Authorization':`Bearer ${token}` },
  });
  const d = await r.json();
  return d[0];
}

async function post(path, body, headers = HDR_S) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method:'POST',
    headers: { ...headers, 'Prefer':'return=representation' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  try { return { ok: r.ok, data: JSON.parse(text) }; }
  catch { return { ok: r.ok, data: text }; }
}

// ══ MAIN ══════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  TN Solar — Full Integration Test Script  ');
  console.log('═══════════════════════════════════════════════\n');

  // ── TEST 1: Verify all 3 logins ──────────────────────────────────────────────
  console.log('① TESTING ALL 3 LOGINS\n');
  const creds = [
    { email:'admin@tnsolar.com',    password:'Admin123!'    },
    { email:'sales@tnsolar.com',    password:'Sales123!'    },
    { email:'engineer@tnsolar.com', password:'Engineer123!' },
  ];

  let engineerId = null;

  for (const c of creds) {
    try {
      const { token, userId } = await login(c.email, c.password);
      const profile = await getProfile(token, userId);
      console.log(`  ✅ ${c.email}`);
      console.log(`     Role: ${profile?.role || '⚠️ No profile'} | Name: ${profile?.full_name}`);
      if (profile?.role === 'Engineer') engineerId = userId;
    } catch (e) {
      console.log(`  ❌ ${c.email}: ${e.message}`);
    }
  }

  // ── TEST 2: Create a test client ─────────────────────────────────────────────
  console.log('\n② CREATING TEST CLIENT\n');
  const clientRes = await post('clients', {
    first_name: 'Rajesh',
    last_name:  'Kumar',
    phone:      '+91 98765 43210',
    email:      'rajesh.kumar@example.com',
    address:    '12, Anna Nagar, Chennai, Tamil Nadu 600040',
  });

  let clientId = null;
  if (clientRes.ok && Array.isArray(clientRes.data)) {
    clientId = clientRes.data[0]?.id;
    console.log(`  ✅ Client created: Rajesh Kumar (${clientId})`);
  } else {
    console.log('  ⚠️  Client insert result:', JSON.stringify(clientRes.data).slice(0, 200));
  }

  // ── TEST 3: Create a job & assign to Engineer ────────────────────────────────
  console.log('\n③ CREATING JOB & ASSIGNING TO ENGINEER\n');

  if (!engineerId) {
    console.log('  ⚠️  Could not find Engineer user ID. Fetching from profiles...');
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?role=eq.Engineer&select=id,full_name`, { headers: HDR_S });
    const d = await r.json();
    engineerId = d[0]?.id;
    console.log(`  → Found engineer: ${d[0]?.full_name} (${engineerId})`);
  }

  const jobRes = await post('jobs', {
    job_number:          'JOB-101',
    address:             '12, Anna Nagar, Chennai',
    status:              'Work Order',
    category:            'Site Assessment',
    description:         'Solar rooftop site visit for 5kW system installation',
    requires_site_visit: true,
    scheduled_date:      new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    client_id:           clientId,
    assigned_to:         engineerId,
  });

  if (jobRes.ok && Array.isArray(jobRes.data)) {
    const job = jobRes.data[0];
    console.log(`  ✅ Job created: ${job.job_number}`);
    console.log(`     Status: ${job.status}`);
    console.log(`     Category: ${job.category}`);
    console.log(`     Assigned to: ${engineerId}`);
    console.log(`     Scheduled: ${job.scheduled_date}`);
    console.log(`     Requires Site Visit: ${job.requires_site_visit}`);
  } else {
    console.log('  ❌ Job creation failed:', JSON.stringify(jobRes.data).slice(0, 300));
    console.log('\n  ℹ️  If error says "jobs table not found", run the full schema SQL first.');
    console.log('  → Schema SQL file: supabase/migrations/001_initial_schema.sql');
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('  MANUAL BROWSER TEST GUIDE');
  console.log('═══════════════════════════════════════════════');
  console.log('  Open: http://localhost:3000/login\n');
  console.log('  🔴 Admin login:');
  console.log('     admin@tnsolar.com / Admin123!');
  console.log('     → Should see: Dashboard, Dispatch Board, New Site Visit, History');
  console.log('     → Go to Dispatch Board → job JOB-001 should appear\n');
  console.log('  🟠 Sales login:');
  console.log('     sales@tnsolar.com / Sales123!');
  console.log('     → Should see: Dashboard, New Site Visit ONLY\n');
  console.log('  🟢 Engineer login:');
  console.log('     engineer@tnsolar.com / Engineer123!');
  console.log('     → Should see: Dashboard, New Site Visit, History');
  console.log('     → JOB-001 should appear as assigned to this engineer');
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(console.error);
