'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar as CalendarIcon,
  X,
  Tag,
  Check,
  Flame,
  Activity,
  Layers,
  CalendarRange,
  Sun,
  Flag,
  ListTodo,
  Info,
  Edit2,
  Trash2,
  Link as LinkIcon,
  CheckSquare
} from 'lucide-react';
import { CalendarEvent, Task } from '@/lib/types';
import { IndonesianDatePicker, formatIndonesianDate } from '@/components/ui/IndonesianDatePicker';
import { ActivitySelect } from '@/components/ui/ActivitySelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_SHORT_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

type ViewMode = 'year' | 'month' | 'week' | 'day';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 5));
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail panel visibility
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-05');
  const [selectedDateDetailOpen, setSelectedDateDetailOpen] = useState(false);

  // Filters for calendar categories
  const [showHolidays, setShowHolidays] = useState(true);
  const [showTasks, setShowTasks] = useState(true);

  // Modal states
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newActivity, setNewActivity] = useState('Umum');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newType, setNewType] = useState<'event' | 'holiday' | 'leave'>('event');
  const [newDescription, setNewDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eRes, tRes] = await Promise.all([
        fetch(`/api/events?year=${year}&includeTasks=true`),
        fetch('/api/tasks')
      ]);
      const [eData, tData] = await Promise.all([
        eRes.json(),
        tRes.json()
      ]);

      if (eData.success) {
        setEvents(eData.data.events);
      }
      if (tData.success) {
        setTasks(tData.data);
      }
    } catch (e) {
      console.error('Failed to fetch calendar & tasks:', e);
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

  // Scheduled tasks that have a finishAt date connected to calendar
  const scheduledTasks = useMemo(() => {
    return tasks
      .filter(t => t.finishAt || t.finishAtRaw)
      .map(t => ({
        id: `task-${t.id}`,
        taskId: t.id,
        title: t.name,
        activity: t.activity,
        startDate: (t.finishAt || t.finishAtRaw || '').split('T')[0],
        endDate: (t.finishAt || t.finishAtRaw || '').split('T')[0],
        progress: t.progress,
        priority: t.priority,
        itemType: 'task',
        type: 'task',
        note: t.note
      }));
  }, [tasks]);

  // Combined events & tasks
  const allItems = useMemo(() => {
    const list: any[] = [];
    if (showHolidays) {
      events.forEach(e => list.push({ ...e, itemType: e.type }));
    }
    if (showTasks) {
      scheduledTasks.forEach(t => list.push(t));
    }
    return list;
  }, [events, scheduledTasks, showHolidays, showTasks]);

  // Holiday & Leave check helpers
  const isHoliday = (dateStr: string) => {
    return events.some(e => {
      const match = e.startDate === dateStr || (e.isRange && e.startDate && e.endDate && e.startDate <= dateStr && dateStr <= e.endDate);
      return match && (e.type === 'holiday' || e.activity === 'Libur Nasional');
    });
  };

  const isLeave = (dateStr: string) => {
    return events.some(e => {
      const match = e.startDate === dateStr || (e.isRange && e.startDate && e.endDate && e.startDate <= dateStr && dateStr <= e.endDate);
      return match && (e.type === 'leave' || e.activity === 'Cuti Bersama');
    });
  };

  const getDayHolidaysOrLeaves = (dateStr: string) => {
    return events.filter(e => {
      const match = e.startDate === dateStr || (e.isRange && e.startDate && e.endDate && e.startDate <= dateStr && dateStr <= e.endDate);
      return match && (e.type === 'holiday' || e.type === 'leave' || e.activity === 'Libur Nasional' || e.activity === 'Cuti Bersama');
    });
  };

  const getDayTasksAndEvents = (dateStr: string) => {
    return allItems.filter(item => {
      if (!item.startDate) return false;
      if (item.isRange && item.endDate) {
        return item.startDate <= dateStr && dateStr <= item.endDate;
      }
      return item.startDate === dateStr;
    });
  };

  // Toggle task completed directly from Calendar!
  const handleToggleTask = async (taskId: string, currentProgress: string) => {
    const newProgress = currentProgress === 'Done' ? 'Not Started' : 'Done';
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress })
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: newProgress as any } : t));
    } catch (err) {
      console.error('Failed to toggle task from calendar:', err);
    }
  };

  // Current selected day items
  const selectedDayItems = useMemo(() => {
    return getDayTasksAndEvents(selectedDate);
  }, [allItems, selectedDate]);

  // Navigation handlers
  const prevPeriod = () => {
    if (viewMode === 'year') {
      setCurrentDate(new Date(year - 1, month, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d.toISOString().split('T')[0]);
      setCurrentDate(d);
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split('T')[0]);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'year') {
      setCurrentDate(new Date(year + 1, month, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d.toISOString().split('T')[0]);
      setCurrentDate(d);
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
      setCurrentDate(d);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Mini calendar generator for current month
  const miniCalendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: true });
    }

    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length);
    for (let d = 1; d <= remaining; d++) {
      const m = month + 2 > 12 ? 1 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // 7 Day columns for Weekly Schedule
  const weekColumns = useMemo(() => {
    const base = new Date(selectedDate);
    let day = base.getDay() - 1;
    if (day === -1) day = 6;

    const monday = new Date(base);
    monday.setDate(base.getDate() - day);

    const cols: { dateStr: string; dayNum: number; dayName: string; isSelected: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      cols.push({
        dateStr,
        dayNum: d.getDate(),
        dayName: DAYS_SHORT_ID[i],
        isSelected: dateStr === selectedDate
      });
    }
    return cols;
  }, [selectedDate]);

  const handleOpenEditEvent = (ev: any) => {
    setSelectedItem(null);
    setEditingEventId(ev.id);
    setNewTitle(ev.title || ev.name || '');
    setNewActivity(ev.activity || 'Umum');
    setNewStartDate(ev.startDate || ev.finishAt || selectedDate);
    setNewEndDate(ev.endDate || ev.startDate || selectedDate);
    setNewType(ev.type || 'event');
    setNewDescription(ev.description || '');
    setEditModalOpen(true);
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setFormLoading(true);
      const payload = {
        title: newTitle,
        activity: newActivity,
        startDate: newStartDate,
        endDate: newEndDate || newStartDate,
        type: newType,
        description: newDescription,
      };

      if (editingEventId) {
        const res = await fetch(`/api/events/${editingEventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setEditModalOpen(false);
          fetchData();
        }
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setCreateModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      console.error('Error saving event:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus agenda kegiatan ini?')) return;
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
      setEditModalOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (e) {
      console.error('Failed to delete event:', e);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* 1. TOP HEADER: 1 BARIS COMPACT (Sesuai Permintaan User: Judul fitur pada kalender tidak terlalu besar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
        {/* Left: 1 Baris Judul & Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-600 shrink-0" />
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white whitespace-nowrap">
              My Calendar
            </h1>
          </div>
          <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px]">
              {scheduledTasks.length} Tugas To-Do Terhubung
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-[11px]">
              {events.length} Acara
            </span>
          </div>
        </div>

        {/* Center: View Mode Pills (1 Baris) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('year')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition ${
              viewMode === 'year' ? 'bg-white text-emerald-900 dark:bg-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tahunan
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition ${
              viewMode === 'month' ? 'bg-white text-emerald-900 dark:bg-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition ${
              viewMode === 'week' ? 'bg-white text-emerald-900 dark:bg-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mingguan
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition ${
              viewMode === 'day' ? 'bg-white text-emerald-900 dark:bg-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Harian
          </button>
        </div>

        {/* Right: Controls & Add Event Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <button
              onClick={prevPeriod}
              className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition border border-slate-200 dark:border-slate-700"
            >
              ‹
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold"
            >
              Hari Ini
            </button>
            <button
              onClick={nextPeriod}
              className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition border border-slate-200 dark:border-slate-700"
            >
              ›
            </button>
            <span className="ml-1 text-xs font-black">
              {viewMode === 'year'
                ? `Tahun ${year}`
                : viewMode === 'month'
                ? `${MONTH_NAMES_ID[month]} ${year}`
                : formatIndonesianDate(selectedDate)}
            </span>
          </div>

          <button
            onClick={() => {
              setEditingEventId(null);
              setNewTitle('');
              setNewActivity('Umum');
              setNewStartDate(selectedDate);
              setNewEndDate(selectedDate);
              setNewType('event');
              setNewDescription('');
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Acara</span>
          </button>
        </div>
      </div>

      {/* 2. LEGEND / KETERANGAN */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <Info className="h-3.5 w-3.5 text-emerald-600" />
          <span>Keterangan:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-5 rounded-md bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              01
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Libur Nasional (<strong className="text-red-600">Kotak Merah</strong>)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 px-1 rounded-md bg-white border border-slate-300 text-slate-800 text-[10px] font-bold flex items-center gap-1">
              <span>02</span>
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Cuti Bersama (Kotak Putih + Titik Merah)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 px-1.5 rounded-md bg-[#c5f836] text-slate-950 text-[10px] font-black flex items-center">
              ✓ To-Do
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Tugas Terjadwal (Checklist Aktif)
            </span>
          </div>
        </div>
      </div>

      {/* VIEW BULANAN DENGAN INTEGRASI TO-DO LIST & KOTAK DETAIL TERSEMBUNYI */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className={`${selectedDateDetailOpen ? 'lg:col-span-8' : 'lg:col-span-12'} rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition-all duration-300`}>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-base font-black text-slate-900 dark:text-white">
                {MONTH_NAMES_ID[month]} {year}
              </span>
              {selectedDateDetailOpen && (
                <button
                  onClick={() => setSelectedDateDetailOpen(false)}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition"
                >
                  Tutup Detail
                </button>
              )}
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-black text-slate-400 mb-2 py-1 border-b border-slate-100 dark:border-slate-800">
              {DAYS_SHORT_ID.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {miniCalendarDays.map((cell, idx) => {
                const holiday = isHoliday(cell.dateStr);
                const leave = isLeave(cell.dateStr);
                const isSelected = cell.dateStr === selectedDate;
                const dayItems = getDayTasksAndEvents(cell.dateStr);
                const holidayItems = getDayHolidaysOrLeaves(cell.dateStr);
                const dayTasks = dayItems.filter(item => item.itemType === 'task');

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDate(cell.dateStr);
                      setSelectedDateDetailOpen(true);
                      if (holidayItems.length > 0) setSelectedItem(holidayItems[0]);
                      else if (dayItems.length > 0) setSelectedItem(dayItems[0]);
                    }}
                    className={`min-h-[90px] sm:min-h-[105px] rounded-2xl p-2 flex flex-col justify-between cursor-pointer transition-all border ${
                      holiday
                        ? 'bg-red-500 text-white border-red-600 shadow-sm hover:bg-red-600'
                        : leave
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:border-emerald-500 shadow-xs'
                        : isSelected && selectedDateDetailOpen
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-200'
                        : !cell.isCurrentMonth
                        ? 'bg-slate-50/50 text-slate-300 dark:text-slate-600 border-dashed border-slate-100 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs sm:text-sm font-black ${
                          holiday ? 'text-white' : isSelected ? 'text-emerald-700 font-extrabold' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {cell.day}
                        </span>
                        {leave && !holiday && (
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                      {holiday && (
                        <span className="text-[9px] font-black uppercase bg-white/20 text-white px-1.5 py-0.5 rounded">
                          Libur
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-1 overflow-hidden">
                      {holidayItems.map((h, hIdx) => (
                        <div
                          key={`h-${hIdx}`}
                          className="text-[9px] font-black px-1.5 py-0.5 rounded truncate bg-white text-red-600 shadow-2xs"
                        >
                          {h.title}
                        </div>
                      ))}

                      {/* CONNECTED TO-DO TASKS WITH CHECKBOX ON CALENDAR */}
                      {dayTasks.slice(0, 2).map((t, tIdx) => {
                        const isDone = t.progress === 'Done';
                        return (
                          <div
                            key={`t-${tIdx}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTask(t.taskId, t.progress);
                            }}
                            className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded truncate cursor-pointer transition ${
                              isDone
                                ? 'bg-slate-200/80 text-slate-500 line-through'
                                : 'bg-[#c5f836] text-slate-950 hover:bg-[#bbf028]'
                            }`}
                            title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                          >
                            <span className="shrink-0">{isDone ? '✓' : '○'}</span>
                            <span className="truncate">{t.title}</span>
                          </div>
                        );
                      })}

                      {dayItems.length > 3 && (
                        <div className="text-[8px] font-bold text-slate-400 pl-1">
                          +{dayItems.length - 2} lainnya
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DETAIL KEGIATAN: HANYA MUNCUL KETIKA TANGGAL DIPILIH */}
          {selectedDateDetailOpen && (
            <div className="lg:col-span-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Detail Tanggal Terpilih
                    </span>
                    <div className="text-xs font-bold text-emerald-600 mt-0.5">
                      {formatIndonesianDate(selectedDate)}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDateDetailOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Items list with To-Do Connection */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Agenda & To-Do ({selectedDayItems.length})</span>
                    <button
                      onClick={() => {
                        setEditingEventId(null);
                        setNewTitle('');
                        setNewActivity('Umum');
                        setNewStartDate(selectedDate);
                        setNewEndDate(selectedDate);
                        setNewType('event');
                        setNewDescription('');
                        setCreateModalOpen(true);
                      }}
                      className="text-[11px] text-emerald-600 hover:underline"
                    >
                      + Tambah Agenda
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {selectedDayItems.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-3 text-center">
                        Tidak ada agenda atau tugas pada tanggal ini.
                      </p>
                    ) : (
                      selectedDayItems.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-start justify-between gap-2 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                        >
                          <div
                            onClick={() => setSelectedItem(item)}
                            className="flex items-start gap-2.5 flex-1 cursor-pointer truncate"
                          >
                            <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {item.itemType === 'task' ? '✓' : '★'}
                            </div>
                            <div className="flex flex-col truncate">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {item.title || item.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {item.activity} {item.progress ? `• ${item.progress}` : ''}
                              </span>
                            </div>
                          </div>

                          {item.itemType !== 'task' && (
                            <button
                              onClick={() => handleOpenEditEvent(item)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 transition"
                              title="Edit Kegiatan"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL WITH GAMBAR 1 SEARCHABLE DROPDOWNS */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingEventId ? 'Edit Agenda / Acara' : 'Tambah Agenda Baru'}
              </h3>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Judul Agenda *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Rapat Koordinasi Wilayah"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Searchable Activity Dropdown (Gambar 1 style) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Aktivitas</label>
                  <div className="mt-1">
                    <ActivitySelect value={newActivity} onChange={setNewActivity} />
                  </div>
                </div>

                {/* Indonesian Date Picker Popover */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal</label>
                  <div className="mt-1">
                    <IndonesianDatePicker
                      value={newStartDate || selectedDate}
                      onChange={setNewStartDate}
                      placeholder="Pilih tanggal..."
                    />
                  </div>
                </div>
              </div>

              {/* Tipe Acara Dropdown (Gambar 1 style) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tipe Acara</label>
                <div className="mt-1">
                  <SearchableSelect
                    value={newType}
                    options={[
                      { value: 'event', label: 'Agenda Kerja / Acara' },
                      { value: 'holiday', label: 'Hari Libur Nasional' },
                      { value: 'leave', label: 'Hari Cuti Bersama' },
                    ]}
                    onChange={(val) => setNewType(val as any)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi / Catatan</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                {editingEventId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(editingEventId)}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Hapus Acara
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(false);
                      setEditModalOpen(false);
                    }}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-xs transition"
                  >
                    {formLoading ? 'Menyimpan...' : 'Simpan Acara'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-800">
                {selectedItem.activity || selectedItem.type || 'Event'}
              </span>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedItem.title || selectedItem.name}
              </h3>
              <p className="text-xs text-slate-500">
                Tanggal: <strong className="text-slate-800 dark:text-slate-200">{formatIndonesianDate(selectedItem.startDate || selectedItem.finishAt)}</strong>
              </p>
              {selectedItem.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                  {selectedItem.description}
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {selectedItem.itemType !== 'task' ? (
                <button
                  onClick={() => handleOpenEditEvent(selectedItem)}
                  className="rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Kegiatan</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
