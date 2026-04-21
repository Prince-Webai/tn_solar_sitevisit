/**
 * Runs SQL against Supabase via the REST SQL execution endpoint,
 * then inserts all 3 test users' profiles in one go.
 */

const SUPABASE_URL = 'https://clhbnthrkfzdhtklwypi.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';
const PROJECT_REF  = 'clhbnthrkfzdhtklwypi';

const HDR = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

// ── Run arbitrary SQL via Supabase pg REST endpoint ──────────────────────────
async function runSQL(sql) {
  // Try the pg/query endpoint (Management API style via service role)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: HDR,
    body: JSON.stringify({ sql }),
  });

  if (res.ok) return { ok: true };

  // Fallback: use pg_dump style direct query via the SQL API
  const res2 = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res2.text();
  return { ok: res2.ok, status: res2.status, body: text };
}

// ── Upsert profile row directly ──────────────────────────────────────────────
async function upsertProfile(id, email, full_name, role) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...HDR, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ id, email, full_name, role }),
  });
  const text = await r.text();
  return { ok: r.ok, body: text };
}

// ── Confirm existing auth user by ID ─────────────────────────────────────────
async function confirmUser(id) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: 'PUT',
    headers: HDR,
    body: JSON.stringify({ email_confirm: true }),
  });
}

// ── Create or retrieve a user ─────────────────────────────────────────────────
async function upsertAuthUser(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: HDR,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const d = await r.json();
  if (d.id) return d.id;

  // Already exists — find it
  const l = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`, { headers: HDR });
  const ld = await l.json();
  const found = ld.users?.find(u => u.email === email);
  if (!found) throw new Error('Cannot find user: ' + JSON.stringify(d));
  await confirmUser(found.id);
  return found.id;
}

// ══ MAIN ═════════════════════════════════════════════════════════════════════
async function main() {
  console.log('🔧 Step 1: Creating/confirming all 3 auth users in parallel…');

  const USERS = [
    { email: 'admin@tnsolar.com',    password: 'Admin123!',    role: 'Admin',    name: 'Admin User'    },
    { email: 'sales@tnsolar.com',    password: 'Sales123!',    role: 'Sales',    name: 'Sales User'    },
    { email: 'engineer@tnsolar.com', password: 'Engineer123!', role: 'Engineer', name: 'Engineer User' },
  ];

  const authResults = await Promise.allSettled(
    USERS.map(u => upsertAuthUser(u.email, u.password).then(id => ({ ...u, id })))
  );

  const ready = [];
  authResults.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`  ✅ ${USERS[i].role}: ${USERS[i].email} → ${r.value.id}`);
      ready.push(r.value);
    } else {
      console.log(`  ❌ ${USERS[i].email}: ${r.reason.message}`);
    }
  });

  // ── Step 2: Run schema SQL ──────────────────────────────────────────────────
  console.log('\n🔧 Step 2: Running schema SQL via Supabase API…');

  const SCHEMA_SQL = `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Admin','Dispatcher','Technician','Sales','Engineer')),
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_all" ON public.profiles;
    CREATE POLICY "service_all" ON public.profiles FOR ALL USING (true);
  `;

  const sqlResult = await runSQL(SCHEMA_SQL);
  if (sqlResult.ok) {
    console.log('  ✅ Schema created successfully');
  } else {
    console.log(`  ⚠️  SQL API returned ${sqlResult.status}: ${sqlResult.body}`);
    console.log('  → Will still try inserting profiles (table may already exist)');
  }

  // ── Step 3: Insert all profiles in parallel ─────────────────────────────────
  console.log('\n🔧 Step 3: Inserting all 3 profiles in parallel…');
  const profileResults = await Promise.allSettled(
    ready.map(u => upsertProfile(u.id, u.email, u.name, u.role))
  );

  let allProfilesOk = true;
  profileResults.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.ok) {
      console.log(`  ✅ ${ready[i].name} (${ready[i].role})`);
    } else {
      allProfilesOk = false;
      const body = r.status === 'fulfilled' ? r.value.body : r.reason.message;
      console.log(`  ❌ ${ready[i].name}: ${body}`);
    }
  });

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  if (allProfilesOk) {
    console.log('🎉 ALL DONE! App is ready to test.');
  } else {
    console.log('⚠️  Auth users created but profiles need the DB migration.');
    console.log('   Run this SQL in https://supabase.com/dashboard/project/clhbnthrkfzdhtklwypi/sql/new :');
    console.log(`
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin','Dispatcher','Technician','Sales','Engineer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all" ON public.profiles FOR ALL USING (true);
`);
    console.log('   Then run this script again.');
  }

  console.log('\nCredentials:');
  console.log('  admin@tnsolar.com    / Admin123!');
  console.log('  sales@tnsolar.com    / Sales123!');
  console.log('  engineer@tnsolar.com / Engineer123!');
  console.log('══════════════════════════════════════════\n');
}

main().catch(console.error);
