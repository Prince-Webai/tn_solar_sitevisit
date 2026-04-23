const SUPABASE_URL = 'https://clhbnthrkfzdhtklwypi.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjI2NzIsImV4cCI6MjA5MjE5ODY3Mn0.bCD4eE7n-mecmd25YfBnUbe8F2SiajHplubGs33MgZQ';

const HDR_SERVICE = { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` };
const HDR_ANON    = { 'Content-Type': 'application/json', 'apikey': ANON_KEY };

async function testLogin(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: HDR_ANON,
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (d.access_token) {
    // fetch their profile
    const p = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${d.user.id}&select=role,full_name`, {
      headers: { ...HDR_ANON, 'Authorization': `Bearer ${d.access_token}` },
    });
    const profile = await p.json();
    return { ok: true, userId: d.user.id, profile: profile[0] };
  }
  return { ok: false, error: d.error_description || d.msg };
}

async function main() {
  const USERS = [
    { email: 'admin@tnsolar.com',    password: 'Admin123!'    },
    { email: 'sales@tnsolar.com',    password: 'Sales123!'    },
    { email: 'engineer@tnsolar.com', password: 'Engineer123!' },
  ];

  console.log('🧪 Testing all 3 logins...\n');
  for (const u of USERS) {
    const r = await testLogin(u.email, u.password);
    if (r.ok) {
      console.log(`✅ ${u.email}`);
      console.log(`   Role: ${r.profile?.role || 'No profile found'} | Name: ${r.profile?.full_name}`);
    } else {
      console.log(`❌ ${u.email}: ${r.error}`);
    }
  }
}

main();
