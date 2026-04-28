import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/supabase/service';

// GET /api/search?q=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    if (!q) return NextResponse.json({ jobs: [], clients: [], profiles: [] });
    const results = await jobService.search(q);
    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
