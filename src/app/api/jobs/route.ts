import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') ?? undefined;
    const userId = searchParams.get('userId') ?? undefined;
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean);

    const jobs = await jobService.fetchJobs({ role, userId, statuses });
    return NextResponse.json(jobs);
  } catch (err: any) {
    console.error('GET /api/jobs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...job } = body;
    const created = await jobService.createJob(job, userId);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/jobs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
