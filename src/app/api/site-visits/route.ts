import { NextRequest, NextResponse } from 'next/server';
import { siteVisitService } from '@/lib/supabase/site-visit-service';

// GET /api/site-visits?jobId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    const data = await siteVisitService.fetchByJobId(jobId);
    if (!data) return NextResponse.json(null);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/site-visits — upsert a site visit
export async function POST(req: NextRequest) {
  try {
    const { jobId, engineerId, data } = await req.json();
    const result = await siteVisitService.upsertSiteVisit(jobId, engineerId, data);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
