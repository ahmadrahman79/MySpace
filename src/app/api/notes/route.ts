import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activity = searchParams.get('activity');
    const search = searchParams.get('search');

    let notes = await db.getNotes();

    if (activity && activity !== 'All') {
      notes = notes.filter((n) => n.activity === activity);
    }

    if (search) {
      const q = search.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.activity.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, count: notes.length, data: notes });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Note title is required' }, { status: 400 });
    }

    const note = await db.createNote({
      title: body.title,
      activity: body.activity || 'General',
      createdBy: body.createdBy || 'User',
      content: body.content || '',
      images: body.images || [],
      links: body.links || [],
      associatedTaskIds: body.associatedTaskIds || [],
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

