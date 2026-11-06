'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  StickyNote as StickyIcon,
  Flame,
  CheckSquare,
  FileText,
  Calendar as CalendarIcon,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Task, StickyNote, CalendarEvent, DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [activeStickies, setActiveStickies] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick inline sticky note input
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteArea, setQuickNoteArea] = useState<'Personal' | 'Family' | 'Business' | 'Side Hustle'>('Personal');
  const [savingNote, setSavingNote] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data.stats);
        setTodayTasks(json.data.todayTasks || []);
        setOverdueTasks(json.data.overdueTasks || []);
        setUrgentTasks(json.data.urgentTasks || []);
        setTodayEvents(json.data.todayEvents || []);
        setActiveStickies(json.data.activeStickies || []);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener('data-updated', handleUpdate);
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, []);

  const handleToggleTaskDone = async (task: Task) => {
    const newProgress = task.progress === 'Done' ? 'Not Started' : 'Done';
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });
      fetchData();
    } catch (e) {
      console.error('Error toggling task:', e);
    }
  };

  const handleCreateQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteTitle.trim()) return;

    try {
      setSavingNote(true);
      await fetch('/api/sticky-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickNoteTitle.trim(),
          area: quickNoteArea,
          priority: 'Medium',
          color: 'amber',
        }),
      });
      setQuickNoteTitle('');
      fetchData();
    } catch (e) {
      console.error('Failed to create quick note:', e);
    } finally {
      setSavingNote(false);
    }
  };

  const handleConvertSticky = async (stickyId: string) => {
    try {
      const res = await fetch(`/api/sticky-notes/${stickyId}/convert`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error('Failed to convert sticky note:', e);
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-700/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Workflow 5 — Daily Planning Hub</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang di MySpace
          </h1>
          <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed">
            Hari ini <span className="font-semibold text-white">{todayFormatted}</span>.
            Semua integrasi To-Do List, Sticky Notes, dan Kalender berjalan dalam prinsip{' '}
            <span className="underline decoration-indigo-300 decoration-2">Single Source of Truth</span>.
          </p>
        </div>

        {/* Ambient Decorative element */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase">Total Tugas</span>
            <CheckSquare className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {stats ? stats.totalTasks : '...'}
          </p>
          <span className="mt-1 text-[11px] text-slate-400">Database Tasks</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase">Selesai</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats ? stats.doneTasks : '...'}
          </p>
          <span className="mt-1 text-[11px] text-slate-400">Status Done</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase">Prioritas / Urgent</span>
            <Flame className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats ? stats.urgentTasks : '...'}
          </p>
          <span className="mt-1 text-[11px] text-slate-400">Very Urgent / High</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase">Overdue</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats ? stats.overdueTasks : '...'}
          </p>
          <span className="mt-1 text-[11px] text-slate-400">Lewat Tenggat</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase">Sticky Notes</span>
            <StickyIcon className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-400">
            {stats ? stats.activeStickyNotes : '...'}
          </p>
          <span className="mt-1 text-[11px] text-slate-400">Catatan Aktif</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase">Dokumentasi</span>
            <FileText className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            {stats ? stats.totalNotes : '...'}
          </p>
          <span className="mt-1 text-[11px] text-slate-400">Notes🤓 Tersimpan</span>
        </div>
      </div>

      {/* Main Grid: Today Planner & Quick Capture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Daily Planner (Today Agenda, Overdue Alert, Urgent Tasks) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Task Banner if any */}
          {overdueTasks.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    Tugas Perlu Perhatian ({overdueTasks.length} Overdue)
                  </h3>
                </div>
                <Link
                  href="/tasks?filter=overdue"
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 inline-flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {overdueTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl bg-white/80 p-3 shadow-xs dark:bg-slate-900/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleToggleTaskDone(task)}
                        className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-emerald-500"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                        {task.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        {task.finishAtRaw || task.finishAt}
                      </span>
                      <span className="text-[10px] text-slate-400">{task.activity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agenda & Tasks Today */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Agenda & Tugas Hari Ini
                </h2>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                <span>Buka Kalender</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Events for today */}
            {todayEvents.length > 0 ? (
              <div className="mt-4 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Agenda / Libur Terjadwal
                </span>
                {todayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`flex items-center justify-between rounded-xl p-3 border ${
                      evt.type === 'holiday'
                        ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                        : evt.type === 'leave'
                        ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{evt.title}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase rounded-md px-2 py-0.5 bg-white/60 dark:bg-black/30">
                      {evt.activity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400 italic">
                Tidak ada agenda kegiatan khusus untuk tanggal hari ini.
              </p>
            )}

            {/* Tasks due today */}
            <div className="mt-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tugas Jatuh Tempo Hari Ini ({todayTasks.length})
              </span>
              {todayTasks.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTaskDone(task)}
                          className={`h-4 w-4 rounded border flex items-center justify-center transition ${
                            task.progress === 'Done'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {task.progress === 'Done' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                        <span
                          className={`text-xs font-medium ${
                            task.progress === 'Done'
                              ? 'line-through text-slate-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {task.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                        {task.activity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400 italic">
                  Semua tugas hari ini telah beres atau tidak ada tenggat hari ini.
                </p>
              )}
            </div>
          </div>

          {/* Urgent & In-Progress Tasks Board Preview */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tugas Prioritas & Sedang Dikerjakan
                </h3>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                <span>Buka Task Board</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {urgentTasks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200 p-3.5 hover:shadow-xs transition dark:border-slate-800 dark:bg-slate-800/30"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase rounded-md px-2 py-0.5 ${
                        t.progress === 'Very Urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                      }`}
                    >
                      {t.progress}
                    </span>
                    <span className="text-[10px] text-slate-400">{t.activity}</span>
                  </div>
                  <h4 className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                    {t.name}
                  </h4>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                    <span>KipApp: {t.statusKipApp}</span>
                    <button
                      onClick={() => handleToggleTaskDone(t)}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Tandai Selesai
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Sticky Notes Quick Capture & Converted Workflow */}
        <div className="space-y-6">
          {/* Workflow 1: Quick Capture Sticky Input */}
          <div className="rounded-2xl border border-amber-200/90 bg-linear-to-b from-amber-50 to-amber-100/40 p-5 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-slate-900 shadow-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
              <StickyIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold">Quick Capture Note (WF 1)</h3>
            </div>
            <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-400/80">
              Tangkap ide atau catatan singkat tanpa wajib mengisi form panjang.
            </p>

            <form onSubmit={handleCreateQuickNote} className="mt-3 space-y-2.5">
              <input
                type="text"
                placeholder="Tulis ide atau pengingat cepat..."
                value={quickNoteTitle}
                onChange={(e) => setQuickNoteTitle(e.target.value)}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-800 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex items-center gap-2">
                <select
                  value={quickNoteArea}
                  onChange={(e) => setQuickNoteArea(e.target.value as any)}
                  className="rounded-xl border border-amber-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-amber-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Personal">Personal</option>
                  <option value="Family">Family</option>
                  <option value="Business">Business</option>
                  <option value="Side Hustle">Side Hustle</option>
                </select>
                <button
                  type="submit"
                  disabled={savingNote || !quickNoteTitle.trim()}
                  className="flex-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  {savingNote ? 'Menyimpan...' : '+ Tangkap'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Sticky Notes with Workflow 2 Convert button */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <StickyIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Catatan Cepat Aktif
                </h3>
              </div>
              <Link
                href="/sticky"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {activeStickies.map((sticky) => (
                <div
                  key={sticky.id}
                  className={`rounded-xl p-3.5 border transition ${
                    sticky.color === 'amber'
                      ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60'
                      : sticky.color === 'emerald'
                      ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/60'
                      : sticky.color === 'sky'
                      ? 'bg-sky-50/80 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/60'
                      : 'bg-purple-50/80 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase rounded-md px-1.5 py-0.5 bg-white/70 dark:bg-black/40 text-slate-700 dark:text-slate-300">
                      {sticky.area}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {sticky.priority}
                    </span>
                  </div>
                  <h4 className="mt-2 text-xs font-semibold text-slate-900 dark:text-white">
                    {sticky.title}
                  </h4>
                  {sticky.content && (
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                      {sticky.content}
                    </p>
                  )}

                  {/* Workflow 2 Button */}
                  <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {sticky.date ? `Tgl: ${sticky.date}` : 'Tanpa tanggal'}
                    </span>
                    <button
                      onClick={() => handleConvertSticky(sticky.id)}
                      className="rounded-lg bg-indigo-600/10 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white dark:bg-indigo-900/40 dark:text-indigo-300 transition"
                      title="Konversi Sticky Note menjadi Task formal"
                    >
                      Konversi ke Task →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KipApp Status Sync Widget */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pelaporan SKP KipApp BPS
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Monitoring kesiapan tugas harian untuk diinput ke portal KipApp BPS.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                <span className="block text-xs text-slate-400">Pending</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">Siap Input</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                <span className="block text-xs text-slate-400">Added</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Tercatat</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                <span className="block text-xs text-slate-400">Not Add</span>
                <span className="text-sm font-bold text-slate-500">Internal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

