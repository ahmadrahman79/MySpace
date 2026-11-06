import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // 1-12
    const year = searchParams.get('year');   // e.g. 2026
    const activity = searchParams.get('activity');
    const includeTasks = searchParams.get('includeTasks') !== 'false';

    let events = await db.getEvents();

    if (activity && activity !== 'All') {
      events = events.filter((e) => e.activity === activity);
    }

    if (year) {
      events = events.filter((e) => {
        if (!e.startDate) return false;
        return e.startDate.startsWith(year);
      });
    }

    if (month && year) {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      events = events.filter((e) => {
        if (!e.startDate) return false;
        if (e.isRange && e.endDate) {
          return e.startDate.slice(0, 7) <= monthPrefix && monthPrefix <= e.endDate.slice(0, 7);
        }
        return e.startDate.startsWith(monthPrefix);
      });
    }

    // Workflow 3: Seamless Task Scheduling without duplicates
    let scheduledTasks: any[] = [];
    if (includeTasks) {
      const allTasks = await db.getTasks();
      scheduledTasks = allTasks
        .filter((t) => t.finishAt)
        .map((t) => ({
          id: `task-cal-${t.id}`,
          originalTaskId: t.id,
          title: t.name,
          activity: t.activity,
          startDate: t.finishAt,
          endDate: t.finishAt,
          isRange: false,
          status: t.progress === 'Done' ? 'Completed' : 'Not Started',
          type: 'task',
          priority: t.priority,
          progress: t.progress,
          note: t.note,
          statusKipApp: t.statusKipApp,
        }));

      if (year) {
        scheduledTasks = scheduledTasks.filter((st) => st.startDate.startsWith(year));
      }
      if (month && year) {
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        scheduledTasks = scheduledTasks.filter((st) => st.startDate.startsWith(monthPrefix));
      }
      if (activity && activity !== 'All') {
        scheduledTasks = scheduledTasks.filter((st) => st.activity === activity);
      }
    }

    return NextResponse.json({
      success: true,
      eventsCount: events.length,
      tasksCount: scheduledTasks.length,
      data: {
        events,
        scheduledTasks,
        combined: [...events, ...scheduledTasks],
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Event title is required' }, { status: 400 });
    }

    const event = await db.createEvent({
      title: body.title,
      activity: body.activity || 'Umum',
      startDate: body.startDate || null,
      endDate: body.endDate || body.startDate || null,
      dateRaw: body.startDate || '',
      isRange: Boolean(body.startDate && body.endDate && body.startDate !== body.endDate),
      status: body.status || 'Not Started',
      type: body.type || 'event',
      description: body.description || '',
      imageUrls: body.imageUrls || [],
      linkUrls: body.linkUrls || [],
      associatedTaskIds: body.associatedTaskIds || [],
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

