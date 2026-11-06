'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  MoreHorizontal
} from 'lucide-react';
import { NoteItem, Task } from '@/lib/types';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { ActivitySelect } from '@/components/ui/ActivitySelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { formatIndonesianDate } from '@/components/ui/IndonesianDatePicker';
import { RichNotionEditor } from '@/components/ui/RichNotionEditor';

type SortField = 'title' | 'activity' | 'createdBy' | 'lastEditedTime';
type SortOrder = 'asc' | 'desc';

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // If selectedNote is NOT null -> Full Page Notion Editor (Gambar 3); if null -> List of Rows
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingActivity, setEditingActivity] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
            setSelectedNote(fresh);
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
    return [{ value: 'All', label: 'Semua Penulis' }, ...Array.from(set).map(a => ({ value: a, label: a }))];
  }, [notes]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredNotes = useMemo(() => {
    const list = notes.filter((n) => {
      const matchSearch =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
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

  const openNoteDetail = (n: NoteItem) => {
    setSelectedNote(n);
    setEditingTitle(n.title);
    setEditingActivity(n.activity);
    setEditingContent(n.content);
  };

  const handleCreateNewNote = async () => {
    try {
      const newNoteTemplate = {
        title: 'Untitled Note',
        activity: 'Administrasi',
        content: '# Judul Catatan Baru\n\nTuliskan ringkasan, panduan SOP, atau buat tabel sheet di bawah ini:\n\n| Kolom 1 | Kolom 2 |\n| :--- | :--- |\n| Baris 1 | Data A |\n',
        associatedTaskIds: []
      };
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNoteTemplate)
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        openNoteDetail(data.data);
      }
    } catch (e) {
      console.error('Failed to create new note:', e);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      setIsSaving(true);
      await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTitle,
          activity: editingActivity,
          content: editingContent,
        })
      });
      fetchData();
    } catch (e) {
      console.error('Failed to save note:', e);
    } finally {
      setIsSaving(false);
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

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* 1. NOTION FULL PAGE VIEW / EDIT STRICTLY AS GAMBAR 3 */}
      {selectedNote ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm p-6 sm:p-10 space-y-6 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-150">
          {/* Top Breadcrumb & Actions Bar (Gambar 3: Notes 🤓 / Title ... Edited just now ... Share) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedNote(null)}
                className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-900 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Notes 🤓</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 dark:text-slate-200 font-semibold truncate max-w-xs">
                {editingTitle}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                Terakhir diedit {formatIndonesianDate(selectedNote.lastEditedTime || selectedNote.createdAt)}
              </span>
              <button
                onClick={handleSaveNote}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Dokumen'}
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

          {/* Large Document Title (Gambar 3) */}
          <div>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              placeholder="Judul Catatan..."
              className="w-full text-2xl sm:text-4xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:outline-none placeholder:text-slate-300"
            />
          </div>

          {/* Properties Table (Gambar 3: Last Edited Time, Activity, Created By) */}
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
                  onChange={setEditingActivity}
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

          {/* Connected Tasks Section */}
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

          {/* RICH NOTION EDITOR BODY (Gambar 3 with Google Sheet Table & Text Formats) */}
          <div className="pt-2 space-y-2">
            <RichNotionEditor
              content={editingContent}
              onChange={setEditingContent}
              availableNotes={notes.filter(n => n.id !== selectedNote.id)}
              minHeight="420px"
              placeholder="Tuliskan isi catatan dokumen di sini..."
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
                Format dokumen Notion & Google Sheet terintegrasi. Klik baris untuk membuka penuh.
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
                  className="w-full rounded-lg border border-emerald-500/80 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-white"
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
                  options={allAuthors}
                  onChange={setSelectedAuthor}
                />
              </div>
            </div>
          </div>

          {/* TABLE DAFTAR BARIS CATATAN */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th
                      onClick={() => handleSort('title')}
                      className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Judul Catatan</span>
                        {sortField === 'title' && (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('activity')}
                      className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Aktivitas</span>
                        {sortField === 'activity' && (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('createdBy')}
                      className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Dibuat Oleh</span>
                        {sortField === 'createdBy' && (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('lastEditedTime')}
                      className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Terakhir Diedit</span>
                        {sortField === 'lastEditedTime' && (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                        )}
                      </div>
                    </th>

                    <th className="px-4 py-3 font-bold text-center">Tugas Terhubung</th>
                    <th className="px-4 py-3 font-bold text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredNotes.map((n) => (
                    <tr
                      key={n.id}
                      onClick={() => openNoteDetail(n)}
                      className="group cursor-pointer hover:bg-purple-50/40 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                          <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 transition">
                            {n.title}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {n.activity}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                        {n.createdBy || 'Ahmad Rahman'}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                        {formatIndonesianDate(n.lastEditedTime || n.createdAt)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="rounded-full bg-purple-50 text-purple-800 font-bold px-2 py-0.5 text-[11px]">
                          {n.associatedTaskIds?.length || 0} Tugas
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openNoteDetail(n)}
                            className="p-1 rounded text-slate-400 hover:text-purple-600 transition"
                            title="Buka Penuh"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="p-1 rounded text-rose-400 hover:text-rose-600 transition"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
