import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [stats, allTasks, allEvents, stickyNotes] = await Promise.all([
      db.getStats(),
      db.getTasks(),
      db.getEvents(),
      db.getStickyNotes(),
    ]);

    // Fast pre-filtered data for Dashboard
    const todayTasks = allTasks.filter((t) => t.finishAt === todayStr);

    const overdueTasks = allTasks
      .filter((t) => t.progress !== 'Done' && t.finishAt && t.finishAt < todayStr)
      .slice(0, 8);

    const urgentTasks = allTasks
      .filter((t) => (t.progress === 'Very Urgent' || t.priority === 'High') && t.progress !== 'Done')
      .slice(0, 6);

    const todayEvents = allEvents.filter((e) => {
      if (!e.startDate) return false;
      if (e.isRange && e.endDate) {
        return e.startDate <= todayStr && todayStr <= e.endDate;
      }
      return e.startDate === todayStr;
    });

    const activeStickies = stickyNotes
      .filter((s) => !s.completed && !s.convertedToTaskId)
      .slice(0, 4);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        todayTasks,
        overdueTasks,
        urgentTasks,
        todayEvents,
        activeStickies,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

