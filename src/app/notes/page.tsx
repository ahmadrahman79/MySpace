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
  BookOpen
} from 'lucide-react';
import { NoteItem } from '@/lib/types';

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('All');

  // Modal / Edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [title, setTitle] = useState('');
  const [activity, setActivity] = useState('Umum');
  const [content, setContent] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (data.success) {
        setNotes(data.data);
        if (data.data.length > 0 && !selectedNote) {
          setSelectedNote(data.data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Distinct activities
  const allActivities = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.activity) set.add(n.activity);
    });
    return ['All', ...Array.from(set)];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
      const matchActivity = selectedActivity === 'All' || n.activity === selectedActivity;
      return matchSearch && matchActivity;
    });
  }, [notes, search, selectedActivity]);

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setActivity('Umum');
    setContent('');
    setModalOpen(true);
  };

  const openEditModal = (n: NoteItem) => {
    setEditingNote(n);
    setTitle(n.title);
    setActivity(n.activity);
    setContent(n.content);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setFormLoading(true);
      if (editingNote) {
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, activity, content }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchNotes();
        }
      } else {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, activity, content }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchNotes();
        }
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan dokumentasi ini?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedNote?.id === id) {
          setSelectedNote(null);
        }
        fetchNotes();
      }
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Database D — Notes🤓 (Long-form Notes & Dokumentasi)</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dokumentasi & Catatan Panjang
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kumpulan {notes.length} dokumen, SOP, akun sistem, dan pemikiran panjang berformat Markdown.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>+ Catatan Baru</span>
        </button>
      </div>

      {/* Main 2-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Left List Column (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col">
          {/* Search & Category Filter */}
          <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari dokumentasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {allActivities.slice(0, 6).map((act) => (
                <button
                  key={act}
                  onClick={() => setSelectedActivity(act)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition ${
                    selectedActivity === act
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Notes list */}
          <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[600px]">
            {filteredNotes.map((n) => {
              const isSelected = selectedNote?.id === n.id;
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedNote(n)}
                  className={`group cursor-pointer rounded-xl p-3 border transition ${
                    isSelected
                      ? 'border-purple-300 bg-purple-50/70 dark:border-purple-900 dark:bg-purple-950/40 shadow-xs'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {n.activity}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {n.lastEditedTime || n.createdAt}
                    </span>
                  </div>

                  <h4 className="mt-1.5 text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {n.title}
                  </h4>

                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {n.content.replace(/#+\s/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')}
                  </p>

                  {n.images && n.images.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400">
                      <ImageIcon className="h-3 w-3" />
                      <span>{n.images.length} Gambar terlampir</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Viewer Column (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col">
          {selectedNote ? (
            <div className="space-y-5">
              {/* Note Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {selectedNote.activity}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {selectedNote.createdBy}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {selectedNote.lastEditedTime || selectedNote.createdAt}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {selectedNote.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(selectedNote)}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNote.id)}
                    className="rounded-xl border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Note Markdown Content Body */}
              <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {selectedNote.content}
              </div>

              {/* Image Attachments Gallery */}
              {selectedNote.images && selectedNote.images.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <ImageIcon className="h-4 w-4 text-indigo-500" />
                    <span>Lampiran Gambar & Screenshot ({selectedNote.images.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedNote.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-48 object-contain bg-white dark:bg-slate-900 p-2"
                        />
                        <div className="p-2 text-center text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links section */}
              {selectedNote.links && selectedNote.links.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tautan Terkait:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                      >
                        <span>{link.title}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <FileText className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">Pilih catatan di sisi kiri untuk membaca isi dokumen</p>
            </div>
          )}
        </div>
      </div>

      {/* Note Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingNote ? 'Edit Dokumentasi' : 'Buat Dokumentasi Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Judul Catatan / Dokumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Activity</label>
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Isi Dokumen (Format Markdown didukung)
                </label>
                <textarea
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Judul Bagian&#10;&#10;- Poin 1&#10;- Poin 2&#10;&#10;Detail penjelasan..."
                  className="mt-1 w-full font-mono text-xs rounded-xl border border-slate-200 bg-white p-3 text-slate-900 focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Dokumentasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

