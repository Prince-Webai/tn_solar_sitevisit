import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/supabase/service';

// GET /api/audit-logs
export async function GET() {
  try {
    const logs = await jobService.fetchAuditLogs();
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/audit-logs — log an activity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await jobService.logActivity(body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
