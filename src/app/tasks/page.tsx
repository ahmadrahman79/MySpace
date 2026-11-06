'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react';
import { Task, TaskProgress, KipAppStatus, TaskPriority } from '@/lib/types';

const ACTIVITIES = [
  'All',
  'Administrasi',
  'Dasar',
  'DLS',
  'Humas',
  'Latsar',
  'Podes',
  'Polkam',
  'Sakernas',
  'Sektoral',
  'Seruti Tw 2 & Tw 4',
  'Sensus Ekonomi',
  'SNLIK',
  'Supas',
  'Susenas-Seruti',
  'Tambahan',
  'ZI',
  'DTSEN'
];

const PROGRESS_COLUMNS: TaskProgress[] = [
  'Very Urgent',
  'Not Started',
  'Doing',
  'Waiting on External',
  'Done'
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('All');
  const [selectedProgress, setSelectedProgress] = useState('All');
  const [selectedKipApp, setSelectedKipApp] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [activity, setActivity] = useState('Administrasi');
  const [progress, setProgress] = useState<TaskProgress>('Not Started');
  const [finishAt, setFinishAt] = useState('');
  const [statusKipApp, setStatusKipApp] = useState<KipAppStatus>('Pending');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [formLoading, setFormLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const handleUpdate = () => fetchTasks();
    window.addEventListener('data-updated', handleUpdate);
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setName('');
    setActivity('Administrasi');
    setProgress('Not Started');
    setFinishAt('');
    setStatusKipApp('Pending');
    setNote('');
    setPriority('Medium');
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setName(task.name);
    setActivity(task.activity);
    setProgress(task.progress);
    setFinishAt(task.finishAt || '');
    setStatusKipApp(task.statusKipApp);
    setNote(task.note || '');
    setPriority(task.priority);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setFormLoading(true);
      if (editingTask) {
        // Update
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            activity,
            progress,
            finishAt: finishAt || null,
            statusKipApp,
            note,
            priority,
          }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchTasks();
        }
      } else {
        // Create
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            activity,
            progress,
            finishAt: finishAt || null,
            statusKipApp,
            note,
            priority,
          }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchTasks();
        }
      }
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah yakin ingin menghapus tugas ini?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
      }
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  const handleQuickProgress = async (id: string, newProgress: TaskProgress) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });
      fetchTasks();
    } catch (e) {
      console.error('Failed to update progress:', e);
    }
  };

  const handleQuickKipApp = async (id: string, newStatus: KipAppStatus) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusKipApp: newStatus }),
      });
      fetchTasks();
    } catch (e) {
      console.error('Failed to update KipApp status:', e);
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.note.toLowerCase().includes(search.toLowerCase());
      const matchActivity = selectedActivity === 'All' || t.activity === selectedActivity;
      const matchProgress = selectedProgress === 'All' || t.progress === selectedProgress;
      const matchKipApp = selectedKipApp === 'All' || t.statusKipApp === selectedKipApp;
      return matchSearch && matchActivity && matchProgress && matchKipApp;
    });
  }, [tasks, search, selectedActivity, selectedProgress, selectedKipApp]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Database A — Daily Task Management</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Task Management Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola {tasks.length} pekerjaan, prioritas, tanggal penyelesaian (Finish at), dan status KipApp BPS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'board'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Tugas Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama tugas atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Activity Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Activity:</label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {ACTIVITIES.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* KipApp Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">KipApp:</label>
            <select
              value={selectedKipApp}
              onChange={(e) => setSelectedKipApp(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All KipApp</option>
              <option value="Pending">Pending</option>
              <option value="Added">Added</option>
              <option value="Not Add">Not Add</option>
            </select>
          </div>

          {(search || selectedActivity !== 'All' || selectedProgress !== 'All' || selectedKipApp !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedActivity('All');
                setSelectedProgress('All');
                setSelectedKipApp('All');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {PROGRESS_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.progress === col);
            const colColor =
              col === 'Very Urgent'
                ? 'border-rose-200 bg-rose-50/40 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300'
                : col === 'Not Started'
                ? 'border-slate-200 bg-slate-50/50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
                : col === 'Doing'
                ? 'border-indigo-200 bg-indigo-50/40 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-300'
                : col === 'Waiting on External'
                ? 'border-amber-200 bg-amber-50/40 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300'
                : 'border-emerald-200 bg-emerald-50/40 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300';

            return (
              <div
                key={col}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 p-3 min-w-[260px]"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between rounded-xl px-3 py-2 border mb-3 ${colColor}`}>
                  <span className="text-xs font-bold tracking-tight">{col}</span>
                  <span className="rounded-full bg-white/80 dark:bg-black/40 px-2 py-0.5 text-[11px] font-bold">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Items */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                  {colTasks.slice(0, 30).map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {task.activity}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => openEditModal(task)}
                            className="rounded p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="rounded p-1 text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="mt-2 text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                        {task.name}
                      </h4>

                      {task.note && (
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {task.note}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{task.finishAtRaw || task.finishAt || 'Tanpa tgl'}</span>
                        </span>

                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${
                            task.statusKipApp === 'Added'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : task.statusKipApp === 'Pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          KipApp: {task.statusKipApp}
                        </span>
                      </div>

                      {/* Quick Move Select */}
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Pindah:</span>
                        <select
                          value={task.progress}
                          onChange={(e) => handleQuickProgress(task.id, e.target.value as TaskProgress)}
                          className="bg-slate-50 text-[10px] rounded px-1.5 py-0.5 border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                        >
                          {PROGRESS_COLUMNS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {colTasks.length > 30 && (
                    <p className="text-center text-[10px] text-slate-400 py-1">
                      Menampilkan 30 dari {colTasks.length} tugas...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tugas</th>
                  <th className="px-4 py-3 font-semibold">Activity</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Finish at</th>
                  <th className="px-4 py-3 font-semibold">Status KipApp</th>
                  <th className="px-4 py-3 font-semibold">Prioritas</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.slice(0, 100).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white max-w-sm">
                        {t.name}
                      </div>
                      {t.note && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">{t.note}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {t.activity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.progress}
                        onChange={(e) => handleQuickProgress(t.id, e.target.value as TaskProgress)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                      >
                        {PROGRESS_COLUMNS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {t.finishAtRaw || t.finishAt || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.statusKipApp}
                        onChange={(e) => handleQuickKipApp(t.id, e.target.value as KipAppStatus)}
                        className={`rounded-md px-2 py-1 text-xs font-semibold border ${
                          t.statusKipApp === 'Added'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : t.statusKipApp === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Added">Added</option>
                        <option value="Not Add">Not Add</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          t.priority === 'High'
                            ? 'bg-rose-100 text-rose-700'
                            : t.priority === 'Medium'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(t)}
                          className="rounded p-1 text-slate-400 hover:text-indigo-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="rounded p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTasks.length > 100 && (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
              Menampilkan 100 dari {filteredTasks.length} tugas. Gunakan filter atau pencarian untuk mencari lebih spesifik.
            </div>
          )}
        </div>
      )}

      {/* Task Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTask ? 'Edit Tugas' : 'Buat Tugas Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nama Tugas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Activity</label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {ACTIVITIES.filter((a) => a !== 'All').map((act) => (
                      <option key={act} value={act}>{act}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Progress</label>
                  <select
                    value={progress}
                    onChange={(e) => setProgress(e.target.value as TaskProgress)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {PROGRESS_COLUMNS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Finish at (Kalender)</label>
                  <input
                    type="date"
                    value={finishAt}
                    onChange={(e) => setFinishAt(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Status KipApp</label>
                  <select
                    value={statusKipApp}
                    onChange={(e) => setStatusKipApp(e.target.value as KipAppStatus)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Added">Added</option>
                    <option value="Not Add">Not Add</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Catatan / Note</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

