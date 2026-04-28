import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/supabase/service';

// GET /api/clients
export async function GET() {
  try {
    const clients = await jobService.fetchClients();
    return NextResponse.json(clients);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = await jobService.createClient(body);
    return NextResponse.json(client, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
