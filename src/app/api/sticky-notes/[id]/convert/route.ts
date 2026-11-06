import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const activity = body.activity || 'Administrasi';

    const result = await db.convertStickyToTask(id, activity);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Sticky note not found or could not be converted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sticky note converted to task successfully without duplication',
      data: result,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

