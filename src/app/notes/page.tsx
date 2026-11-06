'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  FileText,
  Search,
  Plus,
  Tag,
  Calendar,
  User,
  ExternalLink,
  Image as ImageIcon,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Link as LinkIcon,
  MessageSquare,
  Share2,
  Lock,
  MoreHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { NoteItem, Task } from '@/lib/types';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { ActivitySelect } from '@/components/ui/ActivitySelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { formatIndonesianDate } from '@/components/ui/IndonesianDatePicker';
import { RichTextEditor } from '@/components/editor/RichTextEditor';

type SortField = 'title' | 'activity' | 'createdBy' | 'lastEditedTime';
type SortOrder = 'asc' | 'desc';

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Note -> Document Writing Mode
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingActivity, setEditingActivity] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('lastEditedTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Link Task state in Full Note View
  const [showLinkTaskDropdown, setShowLinkTaskDropdown] = useState(false);
  const [taskToLink, setTaskToLink] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [nRes, tRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/tasks')
      ]);
      const [nData, tData] = await Promise.all([
        nRes.json(),
        tRes.json()
      ]);

      if (nData.success) {
        setNotes(nData.data);
        if (selectedNote) {
          const fresh = nData.data.find((n: NoteItem) => n.id === selectedNote.id);
          if (fresh) {
            setSelectedNote(prev => prev ? { ...prev, ...fresh } : null);
          }
        }
      }
      if (tData.success) setTasks(tData.data);
    } catch (e) {
      console.error('Failed to fetch notes & tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allAuthors = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.createdBy) set.add(n.createdBy);
    });
    return Array.from(set).map(a => ({ value: a, label: a }));
  }, [notes]);

  const handleSelectNote = (note: NoteItem) => {
    setSelectedNote(note);
    setEditingTitle(note.title);
    setEditingContent(note.content || '');
    setEditingActivity(note.activity || 'General');
    setAutoSaveStatus('saved');
    setIsFocusMode(false);
  };

  // Debounced Auto-Save
  const triggerAutoSave = useCallback((noteId: string, title: string, activity: string, content: string) => {
    setAutoSaveStatus('unsaved');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        const res = await fetch(`/api/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            activity,
            content,
            lastEditedTime: new Date().toISOString()
          })
        });
        if (res.ok) {
          setAutoSaveStatus('saved');
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title, activity, content } : n));
        } else {
          setAutoSaveStatus('error');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('error');
      }
    }, 1200);
  }, []);

  const handleTitleChange = (val: string) => {
    setEditingTitle(val);
    if (selectedNote) {
      triggerAutoSave(selectedNote.id, val, editingActivity, editingContent);
    }
  };

  const handleActivityChange = (val: string) => {
    setEditingActivity(val);
    if (selectedNote) {
      triggerAutoSave(selectedNote.id, editingTitle, val, editingContent);
    }
  };

  const handleContentChange = (val: string) => {
    setEditingContent(val);
    if (selectedNote) {
      triggerAutoSave(selectedNote.id, editingTitle, editingActivity, val);
    }
  };

  const handleCreateNewNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Catatan Dokumen Baru',
          activity: 'General',
          createdBy: 'Ahmad Rahman',
          content: '<p>Mulai menulis catatan di sini...</p>',
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotes([data.data, ...notes]);
        handleSelectNote(data.data);
      }
    } catch (e) {
      console.error('Failed to create new note:', e);
    }
  };

  const handleManualSave = async () => {
    if (!selectedNote) return;
    try {
      setAutoSaveStatus('saving');
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTitle,
          activity: editingActivity,
          content: editingContent,
          lastEditedTime: new Date().toISOString()
        })
      });
      if (res.ok) {
        setAutoSaveStatus('saved');
        fetchData();
      } else {
        setAutoSaveStatus('error');
      }
    } catch (e) {
      console.error('Failed to save note:', e);
      setAutoSaveStatus('error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan dokumentasi ini?')) return;
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      fetchData();
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  };

  const handleLinkTask = async (taskId: string) => {
    if (!selectedNote || !taskId) return;
    const current = selectedNote.associatedTaskIds || [];
    if (current.includes(taskId)) return;
    const updated = [...current, taskId];

    try {
      await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ associatedTaskIds: updated })
      });
      setSelectedNote({ ...selectedNote, associatedTaskIds: updated });
      setShowLinkTaskDropdown(false);
      setTaskToLink('');
      fetchData();
    } catch (e) {
      console.error('Failed to link task:', e);
    }
  };

  const handleUnlinkTask = async (taskId: string) => {
    if (!selectedNote) return;
    const current = selectedNote.associatedTaskIds || [];
    const updated = current.filter(id => id !== taskId);

    try {
      await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ associatedTaskIds: updated })
      });
      setSelectedNote({ ...selectedNote, associatedTaskIds: updated });
      fetchData();
    } catch (e) {
      console.error('Failed to unlink task:', e);
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

  // Multi-column filter & sort
  const filteredNotes = useMemo(() => {
    const list = notes.filter((n) => {
      const matchSearch =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        (n.content && n.content.toLowerCase().includes(search.toLowerCase())) ||
        (n.activity && n.activity.toLowerCase().includes(search.toLowerCase()));
      const matchActivity = selectedActivity === 'All' || n.activity === selectedActivity;
      const matchAuthor = selectedAuthor === 'All' || n.createdBy === selectedAuthor;
      return matchSearch && matchActivity && matchAuthor;
    });

    list.sort((a, b) => {
      const valA = (a[sortField] || '') as string;
      const valB = (b[sortField] || '') as string;
      const cmp = valA.localeCompare(valB, undefined, { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [notes, search, selectedActivity, selectedAuthor, sortField, sortOrder]);

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* 1. DOCUMENT WRITING MODE (CHATGPT WRITING MODE / NOTION CANVAS) */}
      {selectedNote ? (
        <div
          className={`transition-all duration-300 ${
            isFocusMode
              ? 'fixed inset-0 z-50 p-6 sm:p-12 bg-white dark:bg-slate-950 overflow-y-auto max-w-5xl mx-auto'
              : 'rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm p-6 sm:p-10 space-y-6 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-150'
          }`}
        >
          {/* Top Breadcrumb & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedNote(null)}
                className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Notes 🤓</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 dark:text-slate-200 font-semibold truncate max-w-xs">
                {editingTitle}
              </span>
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
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={isFocusMode ? 'Keluar Focus Mode' : 'Focus Mode (Distraction-Free)'}
              >
                {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              <button
                onClick={handleManualSave}
                disabled={autoSaveStatus === 'saving'}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                Simpan Dokumen
              </button>

              <button
                onClick={() => handleDelete(selectedNote.id)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                title="Hapus Dokumen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Document Title Canvas */}
          <div>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Judul Dokumen Catatan..."
              className="w-full text-2xl sm:text-4xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:outline-none placeholder:text-slate-300"
            />
          </div>

          {/* Properties Table (Last Edited, Activity, Created By) */}
          {!isFocusMode && (
            <div className="space-y-3 py-2 text-xs border-y border-slate-100 dark:border-slate-800">
              <div className="flex items-center">
                <span className="w-36 font-semibold text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Last Edited Time</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatIndonesianDate(selectedNote.lastEditedTime || selectedNote.createdAt)}
                </span>
              </div>

              <div className="flex items-center">
                <span className="w-36 font-semibold text-slate-400 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Activity</span>
                </span>
                <div className="w-44">
                  <ActivitySelect
                    value={editingActivity}
                    onChange={handleActivityChange}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-36 font-semibold text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>Created By</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedNote.createdBy || 'Ahmad Rahman'}
                </span>
              </div>
            </div>
          )}

          {/* Connected Tasks Section */}
          {!isFocusMode && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <LinkIcon className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Tugas Terhubung ({selectedNote.associatedTaskIds?.length || 0})</span>
                </div>
                <button
                  onClick={() => setShowLinkTaskDropdown(!showLinkTaskDropdown)}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  {showLinkTaskDropdown ? 'Batal' : '+ Hubungkan Tugas'}
                </button>
              </div>

              {showLinkTaskDropdown && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <select
                    value={taskToLink}
                    onChange={(e) => setTaskToLink(e.target.value)}
                    className="flex-1 rounded-lg border border-emerald-500 bg-white px-3 py-1.5 text-xs text-slate-900"
                  >
                    <option value="">Pilih tugas untuk dihubungkan...</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.activity})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleLinkTask(taskToLink)}
                    disabled={!taskToLink}
                    className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold"
                  >
                    Hubungkan
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {(!selectedNote.associatedTaskIds || selectedNote.associatedTaskIds.length === 0) ? (
                  <span className="text-slate-400 italic">Belum ada tugas terhubung.</span>
                ) : (
                  selectedNote.associatedTaskIds.map((tId) => {
                    const t = tasks.find(item => item.id === tId);
                    return (
                      <div key={tId} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold">
                        <span>✓ {t ? t.name : tId}</span>
                        <button onClick={() => handleUnlinkTask(tId)} className="text-slate-400 hover:text-rose-500">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* MAIN DOCUMENT CANVAS (TIPTAP WRITING MODE) */}
          <div className="pt-2 space-y-2">
            <RichTextEditor
              key={selectedNote.id}
              initialContent={editingContent}
              onChange={handleContentChange}
              placeholder="Mulai menulis dokumen, instruksi, buat tabel, checklist, atau ketik '/' untuk menu cepat..."
              minHeight="420px"
              saveStatus={autoSaveStatus}
              onFocusModeToggle={() => setIsFocusMode(!isFocusMode)}
              isFocusMode={isFocusMode}
            />
          </div>
        </div>
      ) : (
        /* 2. DEFAULT VIEW: DAFTAR BARIS CATATAN DENGAN HEADER & MULTI-KOLOM SORTING */
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Daftar Catatan & Dokumentasi
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Format dokumen Notion & ChatGPT Writing Mode. Klik baris untuk membuka penuh.
              </p>
            </div>

            <button
              onClick={handleCreateNewNote}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Buat Catatan Baru</span>
            </button>
          </div>

          {/* Multi-column Filters with Gambar 1 Dropdown */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari judul atau isi catatan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-emerald-500/80 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <ActivitySelect
                  value={selectedActivity}
                  onChange={setSelectedActivity}
                  includeAllOption={true}
                />
              </div>

              <div>
                <SearchableSelect
                  value={selectedAuthor}
                  options={[{ value: 'All', label: 'Semua Penulis' }, ...allAuthors]}
                  onChange={setSelectedAuthor}
                />
              </div>
            </div>
          </div>

          {/* TABLE OF NOTES (RAPI, TABLE-FIXED TANPA HORIZONTAL SCROLL) */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-auto" />
                <col className="w-32 sm:w-36" />
                <col className="w-28 sm:w-32" />
                <col className="w-32 sm:w-36" />
                <col className="w-16" />
              </colgroup>

              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th
                    onClick={() => handleSort('title')}
                    className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Judul Dokumen</span>
                      {sortField === 'title' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('activity')}
                    className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Activity</span>
                      {sortField === 'activity' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('createdBy')}
                    className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Created By</span>
                      {sortField === 'createdBy' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('lastEditedTime')}
                    className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Last Edited</span>
                      {sortField === 'lastEditedTime' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                      )}
                    </div>
                  </th>

                  <th className="px-3 py-3 font-bold text-right pr-4">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredNotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada catatan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredNotes.map((note) => (
                    <tr
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      className="group hover:bg-purple-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-purple-500 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white truncate" title={note.title}>
                            {note.title}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 truncate">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-[11px]">
                          {note.activity || 'General'}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300 truncate">
                        {note.createdBy || 'Ahmad Rahman'}
                      </td>

                      <td className="px-3 py-3 text-slate-500 text-[11px] truncate">
                        {formatIndonesianDate(note.lastEditedTime || note.createdAt)}
                      </td>

                      <td className="px-3 py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="p-1 rounded text-rose-400 hover:text-rose-600 transition"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
