import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const progress = searchParams.get('progress');
    const activity = searchParams.get('activity');
    const kipapp = searchParams.get('kipapp');
    const search = searchParams.get('search');

    let tasks = await db.getTasks();

    if (progress && progress !== 'All') {
      tasks = tasks.filter((t) => t.progress === progress);
    }
    if (activity && activity !== 'All') {
      tasks = tasks.filter((t) => t.activity === activity);
    }
    if (kipapp && kipapp !== 'All') {
      tasks = tasks.filter((t) => t.statusKipApp === kipapp);
    }
    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.note.toLowerCase().includes(q) ||
          t.activity.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, count: tasks.length, data: tasks });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Task name is required' }, { status: 400 });
    }

    const task = await db.createTask({
      name: body.name,
      activity: body.activity || 'Administrasi',
      progress: body.progress || 'Not Started',
      finishAt: body.finishAt || null,
      finishAtRaw: body.finishAt || '',
      statusKipApp: body.statusKipApp || 'Pending',
      note: body.note || '',
      priority: body.priority || 'Medium',
      imageUrls: body.imageUrls || [],
      linkUrls: body.linkUrls || [],
      originStickyNoteId: body.originStickyNoteId || null,
      eventId: body.eventId || null,
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

