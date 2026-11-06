'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
import { RichTextEditor } from '@/components/editor/RichTextEditor';

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

  // Task Writing Mode / Side Peek State
  const [sidePeekTask, setSidePeekTask] = useState<Task | null>(null);
  const [sidePeekNoteContent, setSidePeekNoteContent] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Multi-column Filters
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('All');
  const [selectedProgress, setSelectedProgress] = useState('All');
  const [selectedKipApp, setSelectedKipApp] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('finishAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
            setSidePeekTask(prev => prev ? { ...prev, ...fresh } : null);
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

  // Open Task Writing Mode / Side Peek
  const openSidePeek = (task: Task) => {
    setSidePeekTask(task);
    setSidePeekNoteContent(task.note || '');
    setAutoSaveStatus('saved');
    setIsFocusMode(false);
  };

  // Debounced Auto-save for Side Peek Task
  const triggerAutoSave = useCallback((taskData: Task, noteContent: string) => {
    setAutoSaveStatus('unsaved');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        const res = await fetch(`/api/tasks/${taskData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: taskData.name,
            activity: taskData.activity,
            progress: taskData.progress,
            finishAt: taskData.finishAt,
            statusKipApp: taskData.statusKipApp,
            priority: taskData.priority,
            note: noteContent
          })
        });
        if (res.ok) {
          setAutoSaveStatus('saved');
          setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData, note: noteContent } : t));
        } else {
          setAutoSaveStatus('error');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('error');
      }
    }, 1200);
  }, []);

  // Handle note content change in Writing Mode
  const handleEditorChange = (newContent: string) => {
    setSidePeekNoteContent(newContent);
    if (sidePeekTask) {
      triggerAutoSave(sidePeekTask, newContent);
    }
  };

  // Handle task property change in Writing Mode
  const handlePropertyChange = (field: keyof Task, val: any) => {
    if (!sidePeekTask) return;
    const updated = { ...sidePeekTask, [field]: val };
    setSidePeekTask(updated);
    triggerAutoSave(updated, sidePeekNoteContent);
  };

  // Submit task creation (Can be saved even if details are incomplete!)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        (t.note && t.note.toLowerCase().includes(search.toLowerCase()));
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
      {/* HEADER BAR */}
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

      {/* FILTER & SEARCH BAR */}
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

          {/* 2. Activity */}
          <div>
            <ActivitySelect
              value={selectedActivity}
              onChange={setSelectedActivity}
              includeAllOption={true}
            />
          </div>

          {/* 3. Progress */}
          <div>
            <SearchableSelect
              value={selectedProgress}
              options={[{ value: 'All', label: 'Semua Progress' }, ...PROGRESS_OPTIONS]}
              onChange={setSelectedProgress}
            />
          </div>

          {/* 4. KipApp */}
          <div>
            <SearchableSelect
              value={selectedKipApp}
              options={[{ value: 'All', label: 'Semua KipApp' }, ...KIPAPP_OPTIONS]}
              onChange={setSelectedKipApp}
            />
          </div>

          {/* 5. Priority */}
          <div>
            <SearchableSelect
              value={selectedPriority}
              options={[{ value: 'All', label: 'Semua Prioritas' }, ...PRIORITY_OPTIONS]}
              onChange={setSelectedPriority}
            />
          </div>
        </div>
      </div>

      {/* TABLE VIEW (RAPI, TANPA HORIZONTAL SCROLL / GESER KE SAMPING) */}
      <div className="w-full">
        {viewMode === 'table' ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm max-h-[75vh] flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="w-full table-fixed text-left text-xs border-collapse">
                <colgroup>
                  <col className="w-auto" />
                  <col className="w-32 sm:w-36" />
                  <col className="w-28 sm:w-32" />
                  <col className="w-28 sm:w-32" />
                  <col className="w-16 sm:w-20" />
                  <col className="w-16" />
                </colgroup>

                {/* STICKY TABLE HEADER */}
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 shadow-2xs">
                  <tr>
                    <th
                      onClick={() => handleSort('name')}
                      className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
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

                    <th onClick={() => handleSort('activity')} className="px-2.5 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none">
                      <span>Activity</span>
                    </th>

                    <th onClick={() => handleSort('progress')} className="px-2.5 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none">
                      <span>Progress</span>
                    </th>

                    <th onClick={() => handleSort('finishAt')} className="px-2.5 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none">
                      <span>Finish at</span>
                    </th>

                    <th className="px-2 py-3 font-bold text-center">Note</th>
                    <th className="px-2 py-3 font-bold text-right pr-3">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        Tidak ada tugas yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t) => {
                      const isSidePeekActive = sidePeekTask?.id === t.id;

                      return (
                        <tr
                          key={t.id}
                          className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                            isSidePeekActive ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : ''
                          }`}
                        >
                          {/* TASK NAME WITH HOVER '[ ◫ OPEN ]' BUTTON (Rapikan tanpa menggeser layar) */}
                          <td className="px-3 py-2.5 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                <span
                                  onClick={() => openSidePeek(t)}
                                  className="font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-emerald-600 transition"
                                  title={t.name}
                                >
                                  {t.name}
                                </span>
                              </div>

                              {/* Tombol [ ◫ OPEN ] */}
                              <button
                                type="button"
                                onClick={() => openSidePeek(t)}
                                className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-2xs hover:bg-slate-100 hover:border-slate-400 transition flex items-center gap-1 shrink-0"
                                title="Buka Detail & Writing Mode"
                              >
                                <span>◫</span>
                                <span>OPEN</span>
                              </button>
                            </div>
                          </td>

                          {/* INLINE ACTIVITY */}
                          <td className="px-2.5 py-2">
                            <div className="w-full">
                              <ActivitySelect
                                value={t.activity}
                                onChange={(val) => handleQuickActivity(t.id, val)}
                              />
                            </div>
                          </td>

                          {/* PROGRESS */}
                          <td className="px-2.5 py-2">
                            <div className="w-full">
                              <SearchableSelect
                                value={t.progress}
                                options={PROGRESS_OPTIONS}
                                onChange={(val) => handleQuickProgress(t.id, val as TaskProgress)}
                              />
                            </div>
                          </td>

                          {/* FINISH AT */}
                          <td className="px-2.5 py-2 text-slate-700 dark:text-slate-300 truncate font-medium text-[11px]">
                            {formatIndonesianDate(t.finishAt || t.finishAtRaw) || '-'}
                          </td>

                          {/* NOTE BADGE */}
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={() => openSidePeek(t)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                t.note ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {t.note ? 'Catatan' : '-'}
                            </button>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-2 py-2 text-right pr-3">
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
                    })
                  )}
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
                      <div key={t.id} onClick={() => openSidePeek(t)} className="p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-500 transition">
                        <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
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

      {/* TASK WRITING MODE & SIDE PEEK DRAWER (CHATGPT WRITING MODE & NOTION CANVAS) */}
      {sidePeekTask && (
        <>
          {/* Backdrop (klik luar untuk tutup) */}
          {!isFocusMode && (
            <div
              onClick={() => setSidePeekTask(null)}
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs transition-opacity duration-200"
            />
          )}

          <div
            className={`fixed transition-all duration-300 z-50 overflow-y-auto bg-white dark:bg-slate-900 shadow-2xl ${
              isFocusMode
                ? 'inset-0 p-6 sm:p-12 max-w-5xl mx-auto'
                : 'inset-y-0 right-0 w-full max-w-2xl lg:max-w-3xl border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in slide-in-from-right duration-200'
            }`}
          >
            {/* Header: Breadcrumbs, Auto-save status, Focus Mode, Close */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-400">My Tasks</span>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Writing Mode</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Save Status Indicator */}
                <div className="text-xs">
                  {autoSaveStatus === 'saving' && (
                    <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      Menyimpan...
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Tersimpan
                    </span>
                  )}
                  {autoSaveStatus === 'unsaved' && (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      Belum disimpan
                    </span>
                  )}
                  {autoSaveStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Gagal Simpan
                    </span>
                  )}
                </div>

                {/* Focus Mode Button */}
                <button
                  type="button"
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 transition"
                  title={isFocusMode ? 'Keluar Full-Screen Focus' : 'Focus Mode (Distraction-Free)'}
                >
                  {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSidePeekTask(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Tutup Writing Mode"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Title (Editable In-Place) */}
            <div className="py-4">
              <input
                type="text"
                value={sidePeekTask.name}
                onChange={(e) => handlePropertyChange('name', e.target.value)}
                className="w-full text-2xl sm:text-3xl font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none pb-1 placeholder:text-slate-300"
                placeholder="Judul Tugas..."
              />
            </div>

            {/* Task Properties Panel (Collapsible or Compact) */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 mb-6 space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Progress */}
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-slate-400 shrink-0">Progress</span>
                  <div className="flex-1">
                    <SearchableSelect
                      value={sidePeekTask.progress}
                      options={PROGRESS_OPTIONS}
                      onChange={(val) => handlePropertyChange('progress', val as TaskProgress)}
                    />
                  </div>
                </div>

                {/* Activity */}
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-slate-400 shrink-0">Activity</span>
                  <div className="flex-1">
                    <ActivitySelect
                      value={sidePeekTask.activity}
                      onChange={(val) => handlePropertyChange('activity', val)}
                    />
                  </div>
                </div>

                {/* Finish At (Indonesian Date Range Picker) */}
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-slate-400 shrink-0">Finish at</span>
                  <div className="flex-1">
                    <IndonesianDatePicker
                      value={sidePeekTask.finishAt}
                      isRange={true}
                      onRangeChange={(start, end) => handlePropertyChange('finishAt', `${start} s/d ${end}`)}
                      onChange={(val) => handlePropertyChange('finishAt', val)}
                      placeholder="Pilih rentang tanggal selesai..."
                    />
                  </div>
                </div>

                {/* Status KipApp */}
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-slate-400 shrink-0">Status KipApp</span>
                  <div className="flex-1">
                    <SearchableSelect
                      value={sidePeekTask.statusKipApp}
                      options={KIPAPP_OPTIONS}
                      onChange={(val) => handlePropertyChange('statusKipApp', val as KipAppStatus)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN DOCUMENT CANVAS (TIPTAP WRITING MODE) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Instruksi, Catatan Dokumen & Tabel
                </span>
                <span className="text-[11px] text-slate-400">
                  Ketik &quot;/&quot; untuk menu blok
                </span>
              </div>

              <RichTextEditor
                key={sidePeekTask.id}
                initialContent={sidePeekNoteContent}
                onChange={handleEditorChange}
                placeholder="Tulis instruksi tugas, panduan lengkap, buat tabel atau checklist..."
                minHeight="350px"
                saveStatus={autoSaveStatus}
                onFocusModeToggle={() => setIsFocusMode(!isFocusMode)}
                isFocusMode={isFocusMode}
              />
            </div>
          </div>
        </>
      )}

      {/* CREATE / EDIT TASK MODAL */}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Selesai (Finish at / Rentang Tanggal)
                </label>
                <div className="mt-1">
                  <IndonesianDatePicker
                    value={finishAt}
                    isRange={true}
                    onRangeChange={(start, end) => setFinishAt(`${start} s/d ${end}`)}
                    onChange={setFinishAt}
                    placeholder="Pilih rentang tanggal (Mulai s/d Selesai)..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Prioritas</label>
                  <div className="mt-1">
                    <SearchableSelect
                      value={priority}
                      options={PRIORITY_OPTIONS}
                      onChange={(val) => setPriority(val as TaskPriority)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-black shadow-xs transition"
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
