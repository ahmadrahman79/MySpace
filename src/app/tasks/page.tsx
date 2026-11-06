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
  Calendar,
  Clock,
  Sparkles,
  Trash2,
  Edit2,
  MoreVertical,
  MessageSquare,
  Paperclip,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Link as LinkIcon,
  Unlink,
  X,
  FileText,
  StickyNote as StickyIcon,
  PanelRightClose,
  Maximize2,
  Minimize2,
  ExternalLink
} from 'lucide-react';
import { Task, TaskProgress, KipAppStatus, TaskPriority, CalendarEvent, NoteItem, StickyNote } from '@/lib/types';
import { ActivitySelect } from '@/components/ui/ActivitySelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { IndonesianDatePicker, formatIndonesianDate } from '@/components/ui/IndonesianDatePicker';
import { RichNotionEditor } from '@/components/ui/RichNotionEditor';

const PROGRESS_OPTIONS = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'Doing', label: 'Doing' },
  { value: 'Very Urgent', label: 'Very Urgent' },
  { value: 'Waiting on External', label: 'Waiting on External' },
  { value: 'Done', label: 'Done' }
];

const KIPAPP_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Added', label: 'Added' },
  { value: 'Not Add', label: 'Not Add' }
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' }
];

type SortField = 'name' | 'activity' | 'progress' | 'finishAt' | 'statusKipApp' | 'priority' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [stickies, setStickies] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

  // Side Peek State (Gambar 4 & Gambar 5)
  const [sidePeekTask, setSidePeekTask] = useState<Task | null>(null);
  const [sidePeekNoteContent, setSidePeekNoteContent] = useState('');
  const [sidePeekSaving, setSidePeekSaving] = useState(false);

  // Multi-column Filters
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('All');
  const [selectedProgress, setSelectedProgress] = useState('All');
  const [selectedKipApp, setSelectedKipApp] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('finishAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Quick Create Modal
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
  const [originStickyNoteId, setOriginStickyNoteId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, eRes, nRes, sRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/events'),
        fetch('/api/notes'),
        fetch('/api/sticky-notes')
      ]);
      const [tData, eData, nData, sData] = await Promise.all([
        tRes.json(),
        eRes.json(),
        nRes.json(),
        sRes.json()
      ]);

      if (tData.success) {
        setTasks(tData.data);
        if (sidePeekTask) {
          const fresh = tData.data.find((t: Task) => t.id === sidePeekTask.id);
          if (fresh) {
            setSidePeekTask(fresh);
            setSidePeekNoteContent(fresh.note || '');
          }
        }
      }
      if (eData.success) setEvents(eData.data.events || []);
      if (nData.success) setNotes(nData.data);
      if (sData.success) setStickies(sData.data);
    } catch (e) {
      console.error('Error fetching tasks data:', e);
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

  const openCreateModal = () => {
    setEditingTask(null);
    setName('');
    setActivity('Administrasi');
    setProgress('Not Started');
    setFinishAt('');
    setStatusKipApp('Pending');
    setNote('');
    setPriority('Medium');
    setOriginStickyNoteId(null);
    setEventId(null);
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
    setOriginStickyNoteId(task.originStickyNoteId || null);
    setEventId(task.eventId || null);
    setModalOpen(true);
  };

  // Open Side Peek (Gambar 4 & Gambar 5)
  const openSidePeek = (task: Task) => {
    setSidePeekTask(task);
    setSidePeekNoteContent(task.note || '');
  };

  // Save Side Peek Changes
  const handleSaveSidePeek = async () => {
    if (!sidePeekTask) return;
    try {
      setSidePeekSaving(true);
      await fetch(`/api/tasks/${sidePeekTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sidePeekTask.name,
          activity: sidePeekTask.activity,
          progress: sidePeekTask.progress,
          finishAt: sidePeekTask.finishAt,
          statusKipApp: sidePeekTask.statusKipApp,
          priority: sidePeekTask.priority,
          note: sidePeekNoteContent
        })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to save side peek:', err);
    } finally {
      setSidePeekSaving(false);
    }
  };

  // Submit task creation (Can be saved even if details are incomplete!)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setName('Tugas Baru Tanpa Nama');
    }

    try {
      setFormLoading(true);
      const payload = {
        name: name.trim() || 'Tugas Baru',
        activity: activity || 'Administrasi',
        progress: progress || 'Not Started',
        finishAt: finishAt || null,
        statusKipApp: statusKipApp || 'Pending',
        note: note || '',
        priority: priority || 'Medium',
        originStickyNoteId,
        eventId,
      };

      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchData();
        }
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (e) {
      console.error('Error saving task:', e);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (sidePeekTask?.id === id) setSidePeekTask(null);
      fetchData();
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  const handleQuickProgress = async (id: string, newProgress: TaskProgress) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, progress: newProgress } : t));
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });
    } catch (e) {
      console.error('Failed to update progress:', e);
    }
  };

  const handleQuickActivity = async (id: string, newActivity: string) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, activity: newActivity } : t));
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: newActivity }),
      });
    } catch (e) {
      console.error('Failed to update activity:', e);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    const list = tasks.filter((t) => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.note.toLowerCase().includes(search.toLowerCase());
      const matchActivity = selectedActivity === 'All' || t.activity === selectedActivity;
      const matchProgress = selectedProgress === 'All' || t.progress === selectedProgress;
      const matchKipApp = selectedKipApp === 'All' || t.statusKipApp === selectedKipApp;
      const matchPriority = selectedPriority === 'All' || t.priority === selectedPriority;
      return matchSearch && matchActivity && matchProgress && matchKipApp && matchPriority;
    });

    list.sort((a, b) => {
      const valA = (a[sortField] || '') as string;
      const valB = (b[sortField] || '') as string;
      const cmp = valA.localeCompare(valB, undefined, { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [tasks, search, selectedActivity, selectedProgress, selectedKipApp, selectedPriority, sortField, sortOrder]);

  return (
    <div className="space-y-3 animate-fade-in pb-16">
      {/* HEADER BAR (Jarak dipadatkan agar tampilan tugas lebih lebar) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              My Tasks
            </h1>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            {filteredTasks.length} tugas
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-600'
              }`}
            >
              <TableIcon className="h-3 w-3" />
              <span>Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'board' ? 'bg-emerald-600 text-white' : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="h-3 w-3" />
              <span>Board</span>
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-black shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Buat Tugas</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR WITH GAMBAR 1 SEARCHABLE DROPDOWNS */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* 1. Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas / catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-emerald-500/80 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* 2. Activity (Gambar 1 style) */}
          <div>
            <ActivitySelect
              value={selectedActivity}
              onChange={setSelectedActivity}
              includeAllOption={true}
            />
          </div>

          {/* 3. Progress (Gambar 1 style) */}
          <div>
            <SearchableSelect
              value={selectedProgress}
              options={[{ value: 'All', label: 'Semua Progress' }, ...PROGRESS_OPTIONS]}
              onChange={setSelectedProgress}
            />
          </div>

          {/* 4. KipApp (Gambar 1 style) */}
          <div>
            <SearchableSelect
              value={selectedKipApp}
              options={[{ value: 'All', label: 'Semua KipApp' }, ...KIPAPP_OPTIONS]}
              onChange={setSelectedKipApp}
            />
          </div>

          {/* 5. Priority (Gambar 1 style) */}
          <div>
            <SearchableSelect
              value={selectedPriority}
              options={[{ value: 'All', label: 'Semua Prioritas' }, ...PRIORITY_OPTIONS]}
              onChange={setSelectedPriority}
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT: TABLE (OR BOARD) + NOTION SIDE PEEK (GAMBAR 4 & 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT / MAIN PANE: TABLE VIEW */}
        <div className={`${sidePeekTask ? 'lg:col-span-6' : 'lg:col-span-12'} transition-all duration-300`}>
          {viewMode === 'table' ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm max-h-[75vh] flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  {/* STICKY TABLE HEADER (Tetap terlihat meskipun di-scroll) */}
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 shadow-2xs">
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Aa Name</span>
                          {sortField === 'name' ? (
                            sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>

                      <th onClick={() => handleSort('activity')} className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none">
                        <span>Activity</span>
                      </th>

                      <th onClick={() => handleSort('progress')} className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none">
                        <span>Progress</span>
                      </th>

                      <th onClick={() => handleSort('finishAt')} className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none">
                        <span>Finish at (Kalender)</span>
                      </th>

                      <th className="px-3 py-3 font-bold text-center">Note</th>
                      <th className="px-3 py-3 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTasks.map((t) => {
                      const isSidePeekActive = sidePeekTask?.id === t.id;

                      return (
                        <tr
                          key={t.id}
                          className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                            isSidePeekActive ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : ''
                          }`}
                        >
                          {/* TASK NAME WITH GAMBAR 4 HOVER '[ ◫ OPEN ]' BUTTON */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                  {t.name}
                                </span>
                              </div>

                              {/* Tombol [ ◫ OPEN ] Muncul saat kursor diarahkan ke ujung judul taks (Gambar 4) */}
                              <button
                                type="button"
                                onClick={() => openSidePeek(t)}
                                className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-2xs hover:bg-slate-100 hover:border-slate-400 transition flex items-center gap-1 shrink-0"
                                title="Open in side peek (Buka di samping seperti Notion)"
                              >
                                <span>◫</span>
                                <span>OPEN</span>
                              </button>
                            </div>
                          </td>

                          {/* INLINE ACTIVITY (Gambar 1 style) */}
                          <td className="px-3 py-2.5">
                            <div className="w-36">
                              <ActivitySelect
                                value={t.activity}
                                onChange={(val) => handleQuickActivity(t.id, val)}
                              />
                            </div>
                          </td>

                          {/* PROGRESS (Gambar 1 style) */}
                          <td className="px-3 py-2.5">
                            <div className="w-32">
                              <SearchableSelect
                                value={t.progress}
                                options={PROGRESS_OPTIONS}
                                onChange={(val) => handleQuickProgress(t.id, val as TaskProgress)}
                              />
                            </div>
                          </td>

                          {/* FINISH AT (Indonesian Date Range) */}
                          <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium text-[11px]">
                            {formatIndonesianDate(t.finishAt || t.finishAtRaw) || '-'}
                          </td>

                          {/* NOTE BADGE */}
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => openSidePeek(t)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.note ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {t.note ? 'Ada Catatan' : 'No Notes'}
                            </button>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-600 transition"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="p-1 rounded text-rose-400 hover:text-rose-600 transition"
                                title="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* BOARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['Not Started', 'Doing', 'Done'].map((prog) => {
                const colTasks = filteredTasks.filter(t => t.progress === prog);
                return (
                  <div key={prog} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs font-black">
                      <span>{prog}</span>
                      <span>{colTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colTasks.map(t => (
                        <div key={t.id} onClick={() => openSidePeek(t)} className="p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                          <h4 className="text-xs font-bold">{t.name}</h4>
                          <span className="text-[10px] text-slate-400">{t.activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANE: NOTION SIDE PEEK VIEW STRICTLY MATCHING GAMBAR 5 */}
        {sidePeekTask && (
          <div className="lg:col-span-6 rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-xl space-y-5 animate-in fade-in slide-in-from-right-4 duration-200 max-h-[85vh] overflow-y-auto">
            {/* Top Side Peek Controls (Gambar 5: Share, Close) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Side Peek View
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveSidePeek}
                  disabled={sidePeekSaving}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1 text-xs font-bold shadow-xs transition"
                >
                  {sidePeekSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  onClick={() => setSidePeekTask(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                  title="Tutup Side Peek"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Editable Title (Gambar 5) */}
            <div>
              <input
                type="text"
                value={sidePeekTask.name}
                onChange={(e) => setSidePeekTask({ ...sidePeekTask, name: e.target.value })}
                className="w-full text-xl sm:text-2xl font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none pb-1"
                placeholder="Nama Tugas..."
              />
            </div>

            {/* Notion Properties Table (Gambar 5) */}
            <div className="space-y-2.5 py-2 text-xs">
              {/* Progress */}
              <div className="flex items-center">
                <span className="w-32 font-bold text-slate-400">Progress</span>
                <div className="w-44">
                  <SearchableSelect
                    value={sidePeekTask.progress}
                    options={PROGRESS_OPTIONS}
                    onChange={(val) => setSidePeekTask({ ...sidePeekTask, progress: val as TaskProgress })}
                  />
                </div>
              </div>

              {/* Activity */}
              <div className="flex items-center">
                <span className="w-32 font-bold text-slate-400">Activity</span>
                <div className="w-44">
                  <ActivitySelect
                    value={sidePeekTask.activity}
                    onChange={(val) => setSidePeekTask({ ...sidePeekTask, activity: val })}
                  />
                </div>
              </div>

              {/* Finish At (Rentang Tanggal Didukung!) */}
              <div className="flex items-center">
                <span className="w-32 font-bold text-slate-400">Finish at</span>
                <div className="w-64">
                  <IndonesianDatePicker
                    value={sidePeekTask.finishAt}
                    isRange={true}
                    onRangeChange={(start, end) => setSidePeekTask({ ...sidePeekTask, finishAt: `${start} s/d ${end}` })}
                    onChange={(val) => setSidePeekTask({ ...sidePeekTask, finishAt: val })}
                    placeholder="Pilih rentang tanggal selesai..."
                  />
                </div>
              </div>

              {/* Status KipApp */}
              <div className="flex items-center">
                <span className="w-32 font-bold text-slate-400">Status KipApp</span>
                <div className="w-44">
                  <SearchableSelect
                    value={sidePeekTask.statusKipApp}
                    options={KIPAPP_OPTIONS}
                    onChange={(val) => setSidePeekTask({ ...sidePeekTask, statusKipApp: val as KipAppStatus })}
                  />
                </div>
              </div>
            </div>

            {/* RICH NOTION EDITOR: GOOGLE SHEET TABLE + FORMAT TEKS + TAG NOTES (Gambar 5) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Catatan Panjang, Format & Tabel Google Sheet
                </span>
                <span className="text-[10px] text-slate-400">Format Notion</span>
              </div>

              <RichNotionEditor
                content={sidePeekNoteContent}
                onChange={setSidePeekNoteContent}
                availableNotes={notes}
                minHeight="280px"
                placeholder="Tuliskan catatan detail, tabel sheet, atau tag dokumen catatan di sini..."
              />
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT TASK MODAL (Can be saved even if details are incomplete!) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingTask ? 'Edit Tugas' : 'Tambah Tugas Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Tugas (Bisa disimpan langsung meski rincian belum lengkap)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Menyusun laporan perjadin Sakernas"
                  className="mt-1 w-full rounded-lg border border-emerald-500/80 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Aktivitas</label>
                  <div className="mt-1">
                    <ActivitySelect value={activity} onChange={setActivity} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Progress</label>
                  <div className="mt-1">
                    <SearchableSelect
                      value={progress}
                      options={PROGRESS_OPTIONS}
                      onChange={(val) => setProgress(val as TaskProgress)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Tanggal / Rentang
                  </label>
                  <div className="mt-1">
                    <IndonesianDatePicker
                      value={finishAt}
                      isRange={true}
                      onRangeChange={(start, end) => setFinishAt(`${start} s/d ${end}`)}
                      onChange={setFinishAt}
                      placeholder="Pilih rentang tanggal..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Status KipApp</label>
                  <div className="mt-1">
                    <SearchableSelect
                      value={statusKipApp}
                      options={KIPAPP_OPTIONS}
                      onChange={(val) => setStatusKipApp(val as KipAppStatus)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Catatan Cepat</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan tambahan..."
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-xs transition"
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
