const SUPABASE_URL = 'https://clhbnthrkfzdhtklwypi.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';

const HDR = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

async function upsertAuthUser(email, password) {
  console.log(`Creating/Updating auth user: ${email}...`);
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: HDR,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const d = await r.json();
  
  if (d.id) {
    console.log(`Successfully created auth user: ${d.id}`);
    return d.id;
  }

  // If user already exists, we might need to update the password
  if (d.error_code === 'email_exists' || (d.msg && d.msg.includes('already registered'))) {
    console.log('User already exists, updating password...');
    // Find user first
    const l = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`, { headers: HDR });
    const ld = await l.json();
    const found = ld.users?.find(u => u.email === email);
    
    if (found) {
      const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${found.id}`, {
        method: 'PUT',
        headers: HDR,
        body: JSON.stringify({ password, email_confirm: true }),
      });
      if (updateRes.ok) {
        console.log(`Successfully updated password for user: ${found.id}`);
        return found.id;
      } else {
        const err = await updateRes.text();
        throw new Error(`Failed to update user: ${err}`);
      }
    }
  }
  
  throw new Error(`Failed to create/find user: ${JSON.stringify(d)}`);
}

async function upsertProfile(id, email, full_name, role) {
  console.log(`Upserting profile for ${email}...`);
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...HDR, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ id, email, full_name, role }),
  });
  if (r.ok) {
    console.log('Profile upserted successfully');
  } else {
    const text = await r.text();
    console.error(`Failed to upsert profile: ${text}`);
  }
}

async function main() {
  const email = 'work.devashishbhavsar14@gmail.com';
  const password = 'N1ckS0n@1';
  const name = 'Devashish Bhavsar';
  const role = 'Admin';

  try {
    const userId = await upsertAuthUser(email, password);
    await upsertProfile(userId, email, name, role);
    console.log('\n✅ Admin user added successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('\n❌ Error adding admin user:', error.message);
  }
}

main();
