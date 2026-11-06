import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const area = searchParams.get('area');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');

    let notes = await db.getStickyNotes();

    if (area && area !== 'All') {
      notes = notes.filter((n) => n.area === area);
    }
    if (priority && priority !== 'All') {
      notes = notes.filter((n) => n.priority === priority);
    }
    if (status && status !== 'All') {
      notes = notes.filter((n) => n.status === status);
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
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const note = await db.createStickyNote({
      title: body.title,
      content: body.content || '',
      area: body.area || 'Personal',
      priority: body.priority || 'Medium',
      status: body.status || 'Not started',
      date: body.date || null,
      completed: Boolean(body.completed),
      color: body.color || 'amber',
      convertedToTaskId: null,
      imageUrls: body.imageUrls || [],
      linkUrls: body.linkUrls || [],
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

