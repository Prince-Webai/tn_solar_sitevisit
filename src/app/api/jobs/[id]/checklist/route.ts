import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/supabase/service';

// GET /api/jobs/[id]/checklist
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await jobService.fetchChecklist(id);
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/jobs/[id]/checklist — saves checklist
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await req.json();
    await jobService.saveChecklist(id, items);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
