import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/supabase/service';

// GET /api/jobs/[id]/audit-logs
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logs = await jobService.fetchAuditLogsByJobId(id);
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
