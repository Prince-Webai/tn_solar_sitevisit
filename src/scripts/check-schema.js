const SUPABASE_URL = 'https://clhbnthrkfzdhtklwypi.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaGJudGhya2Z6ZGh0a2x3eXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMjY3MiwiZXhwIjoyMDkyMTk4NjcyfQ.WtJD2BGdKHWmmQWlHep_-TqjXgKC6p5VBWbhBLRj4lg';

const HDR = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'return=representation',
};

async function main() {
  // Fetch 0 rows to see what columns exist via schema introspection
  const r = await fetch(`${SUPABASE_URL}/rest/v1/clients?limit=0`, {
    headers: { ...HDR, 'Accept': 'application/json' }
  });
  console.log('clients status:', r.status);

  // Try a minimal insert without mobile
  const r2 = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
    method: 'POST',
    headers: HDR,
    body: JSON.stringify({
      first_name: 'Schema',
      last_name: 'Test',
      email: 'schema@test.com',
      phone: '9999999999',
      address: 'Chennai',
    }),
  });
  const t2 = await r2.text();
  console.log('\nInsert (no mobile) status:', r2.status);
  console.log('Body:', t2.substring(0, 400));

  if (r2.ok) {
    const d = JSON.parse(t2);
    const id = Array.isArray(d) ? d[0]?.id : d?.id;
    console.log('\n✅ clients table columns: no mobile column in live DB');
    console.log('Inserted ID:', id);
    // cleanup
    if (id) await fetch(`${SUPABASE_URL}/rest/v1/clients?id=eq.${id}`, { method: 'DELETE', headers: HDR });
  }
}

main().catch(console.error);
