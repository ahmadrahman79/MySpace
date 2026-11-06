'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar as CalendarIcon,
  X,
  Tag
} from 'lucide-react';
import { CalendarEvent, Task } from '@/lib/types';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_HEADER = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // February 2026 as starting focus where many events are
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedActivity, setSelectedActivity] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'event' | 'holiday' | 'leave' | 'task'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Selected item modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Add event modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newActivity, setNewActivity] = useState('Umum');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newType, setNewType] = useState<'event' | 'holiday' | 'leave'>('event');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events?year=${year}&includeTasks=true`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data.events);
        setScheduledTasks(json.data.scheduledTasks);
      }
    } catch (e) {
      console.error('Failed to fetch calendar items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener('data-updated', handleUpdate);
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, [year]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Distinct activities
  const allActivities = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.activity) set.add(e.activity);
    });
    scheduledTasks.forEach((t) => {
      if (t.activity) set.add(t.activity);
    });
    return ['All', ...Array.from(set)];
  }, [events, scheduledTasks]);

  // Combined and filtered items
  const combinedItems = useMemo(() => {
    const list: any[] = [];

    if (typeFilter === 'all' || typeFilter === 'event' || typeFilter === 'holiday' || typeFilter === 'leave') {
      events.forEach((e) => {
        if (typeFilter !== 'all' && e.type !== typeFilter) return;
        if (selectedActivity !== 'All' && e.activity !== selectedActivity) return;
        list.push({ ...e, itemType: e.type });
      });
    }

    if (typeFilter === 'all' || typeFilter === 'task') {
      scheduledTasks.forEach((t) => {
        if (selectedActivity !== 'All' && t.activity !== selectedActivity) return;
        list.push({ ...t, itemType: 'task' });
      });
    }

    return list;
  }, [events, scheduledTasks, typeFilter, selectedActivity]);

  // Generate calendar grid days for current month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonthNum = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding to reach 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonthNum = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStartDate) return;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          activity: newActivity,
          startDate: newStartDate,
          endDate: newEndDate || newStartDate,
          type: newType,
        }),
      });
      if (res.ok) {
        setCreateModalOpen(false);
        setNewTitle('');
        setNewStartDate('');
        setNewEndDate('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Database C — Event And Calendar (Libur Nasional & Cuti Bersama)</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kalender & Agenda Kerja {year}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan Event, Libur Nasional, Cuti Bersama resmi Indonesia, serta Tugas To-Do List terjadwal (Workflow 3).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Controls */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition"
              title="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Hari Ini
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Event</span>
          </button>
        </div>
      </div>

      {/* Filter and View Toggles */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Type pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider">Tipe:</span>
          {(['all', 'holiday', 'leave', 'event', 'task'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === t
                  ? t === 'holiday'
                    ? 'bg-rose-500 text-white'
                    : t === 'leave'
                    ? 'bg-amber-500 text-white'
                    : t === 'task'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {t === 'all'
                ? 'Semua'
                : t === 'holiday'
                ? '🔴 Libur Nasional'
                : t === 'leave'
                ? '🟡 Cuti Bersama'
                : t === 'task'
                ? '🟢 To-Do List (WF 3)'
                : '🔵 Event Kerja'}
            </button>
          ))}
        </div>

        {/* Activity Select */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Activity:</label>
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {allActivities.map((act) => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>

          {/* View mode */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 ml-2">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                viewMode === 'month' ? 'bg-white shadow-xs text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                viewMode === 'agenda' ? 'bg-white shadow-xs text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            {DAYS_HEADER.map((d, i) => (
              <div
                key={d}
                className={`py-2.5 ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-indigo-500' : ''}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
            {calendarDays.map((cell) => {
              const isToday = cell.dateStr === todayStr;

              // Items falling on this day
              const dayItems = combinedItems.filter((item) => {
                if (!item.startDate) return false;
                if (item.isRange && item.endDate) {
                  return item.startDate <= cell.dateStr && cell.dateStr <= item.endDate;
                }
                return item.startDate === cell.dateStr;
              });

              return (
                <div
                  key={cell.dateStr}
                  className={`min-h-[110px] sm:min-h-[130px] p-1.5 flex flex-col justify-between transition ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/40 text-slate-400 dark:bg-slate-950/20 dark:text-slate-600'
                      : isToday
                      ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold pr-1">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  {/* Badges for events/tasks */}
                  <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                    {dayItems.slice(0, 3).map((item, idx) => {
                      const isHoliday = item.itemType === 'holiday';
                      const isLeave = item.itemType === 'leave';
                      const isTask = item.itemType === 'task';

                      return (
                        <div
                          key={item.id || idx}
                          onClick={() => setSelectedItem(item)}
                          className={`cursor-pointer rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate transition ${
                            isHoliday
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/80 dark:text-rose-300'
                              : isLeave
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-300'
                              : isTask
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300'
                          }`}
                          title={item.title}
                        >
                          {isHoliday && '🔴 '}
                          {isLeave && '🟡 '}
                          {isTask && '✓ '}
                          {item.title}
                        </div>
                      );
                    })}

                    {dayItems.length > 3 && (
                      <div
                        onClick={() => setSelectedItem(dayItems[3])}
                        className="cursor-pointer text-[9px] font-semibold text-slate-400 hover:text-indigo-600 px-1"
                      >
                        +{dayItems.length - 3} lainnya...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Daftar Agenda Kegiatan & Libur ({combinedItems.length} item)
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {combinedItems.slice(0, 50).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition cursor-pointer dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      item.itemType === 'holiday'
                        ? 'bg-rose-500'
                        : item.itemType === 'leave'
                        ? 'bg-amber-500'
                        : item.itemType === 'task'
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {item.activity} {item.description ? `• ${item.description}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {item.dateRaw || item.startDate}
                  </span>
                  <span
                    className={`block text-[10px] font-bold uppercase ${
                      item.itemType === 'holiday'
                        ? 'text-rose-600'
                        : item.itemType === 'leave'
                        ? 'text-amber-600'
                        : item.itemType === 'task'
                        ? 'text-emerald-600'
                        : 'text-indigo-600'
                    }`}
                  >
                    {item.itemType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span
                className={`text-[10px] font-bold uppercase rounded-md px-2 py-0.5 ${
                  selectedItem.itemType === 'holiday'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : selectedItem.itemType === 'leave'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : selectedItem.itemType === 'task'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                }`}
              >
                {selectedItem.itemType === 'task' ? 'To-Do List Terjadwal (WF 3)' : selectedItem.itemType}
              </span>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedItem.title}
              </h3>

              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedItem.dateRaw || selectedItem.startDate || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kategori Activity:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedItem.activity}
                  </span>
                </div>
                {selectedItem.status && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedItem.status}
                    </span>
                  </div>
                )}
                {selectedItem.statusKipApp && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status KipApp:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {selectedItem.statusKipApp}
                    </span>
                  </div>
                )}
              </div>

              {selectedItem.note && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase">Catatan:</h5>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    {selectedItem.note}
                  </p>
                </div>
              )}

              {selectedItem.description && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase">Keterangan:</h5>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    {selectedItem.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Agenda / Event Baru
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Judul Event / Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="cth: Pelatihan Petugas Sakernas"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Activity</label>
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    placeholder="Sakernas, Susenas..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Tipe</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="event">Event Kerja</option>
                    <option value="holiday">Libur Nasional</option>
                    <option value="leave">Cuti Bersama</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Simpan Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

