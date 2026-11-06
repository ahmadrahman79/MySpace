'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  StickyNote as StickyIcon,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Trash2,
  Edit2,
  Tag,
  Check,
  RotateCcw,
  X
} from 'lucide-react';
import { StickyNote, StickyArea, StickyPriority, StickyStatus } from '@/lib/types';

const AREAS: StickyArea[] = ['Personal', 'Family', 'Business', 'Side Hustle'];
const PRIORITIES: StickyPriority[] = ['Low', 'Medium', 'High'];

export default function StickyNotesPage() {
  const [stickies, setStickies] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [showConvertedOnly, setShowConvertedOnly] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSticky, setEditingSticky] = useState<StickyNote | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [area, setArea] = useState<StickyArea>('Personal');
  const [priority, setPriority] = useState<StickyPriority>('Medium');
  const [status, setStatus] = useState<StickyStatus>('Not started');
  const [date, setDate] = useState('');
  const [color, setColor] = useState<'amber' | 'emerald' | 'sky' | 'purple' | 'rose' | 'orange'>('amber');
  const [formLoading, setFormLoading] = useState(false);
  const [convertSuccessMessage, setConvertSuccessMessage] = useState<string | null>(null);

  const fetchStickies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sticky-notes');
      const data = await res.json();
      if (data.success) {
        setStickies(data.data);
      }
    } catch (e) {
      console.error('Error fetching sticky notes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStickies();
    const handleUpdate = () => fetchStickies();
    window.addEventListener('data-updated', handleUpdate);
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, []);

  const openCreateModal = () => {
    setEditingSticky(null);
    setTitle('');
    setContent('');
    setArea('Personal');
    setPriority('Medium');
    setStatus('Not started');
    setDate('');
    setColor('amber');
    setModalOpen(true);
  };

  const openEditModal = (s: StickyNote) => {
    setEditingSticky(s);
    setTitle(s.title);
    setContent(s.content);
    setArea(s.area);
    setPriority(s.priority);
    setStatus(s.status);
    setDate(s.date || '');
    setColor(s.color);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setFormLoading(true);
      if (editingSticky) {
        const res = await fetch(`/api/sticky-notes/${editingSticky.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            area,
            priority,
            status,
            date: date || null,
            color,
          }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchStickies();
        }
      } else {
        const res = await fetch('/api/sticky-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            area,
            priority,
            status,
            date: date || null,
            color,
          }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchStickies();
        }
      }
    } catch (err) {
      console.error('Error saving sticky note:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah yakin ingin menghapus Sticky Note ini?')) return;
    try {
      const res = await fetch(`/api/sticky-notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStickies();
      }
    } catch (e) {
      console.error('Failed to delete sticky:', e);
    }
  };

  const handleToggleComplete = async (sticky: StickyNote) => {
    try {
      const newCompleted = !sticky.completed;
      await fetch(`/api/sticky-notes/${sticky.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: newCompleted,
          status: newCompleted ? 'Done' : 'Not started',
        }),
      });
      fetchStickies();
    } catch (e) {
      console.error('Failed to toggle completion:', e);
    }
  };

  // Workflow 2: Convert Sticky Note to Task
  const handleConvertToTask = async (stickyId: string) => {
    try {
      const res = await fetch(`/api/sticky-notes/${stickyId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: 'Administrasi' }),
      });
      const data = await res.json();
      if (data.success) {
        setConvertSuccessMessage(`Berhasil dikonversi menjadi Task: "${data.data.task.name}"`);
        setTimeout(() => setConvertSuccessMessage(null), 5000);
        fetchStickies();
      }
    } catch (e) {
      console.error('Failed to convert sticky note:', e);
    }
  };

  const filteredStickies = useMemo(() => {
    return stickies.filter((s) => {
      const matchSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.toLowerCase().includes(search.toLowerCase());
      const matchArea = selectedArea === 'All' || s.area === selectedArea;
      const matchPriority = selectedPriority === 'All' || s.priority === selectedPriority;
      const matchConverted = showConvertedOnly ? Boolean(s.convertedToTaskId) : true;
      return matchSearch && matchArea && matchPriority && matchConverted;
    });
  }, [stickies, search, selectedArea, selectedPriority, showConvertedOnly]);

  const getColorStyles = (c: string) => {
    switch (c) {
      case 'amber':
        return 'bg-amber-100/90 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800/80 dark:text-amber-100';
      case 'emerald':
        return 'bg-emerald-100/90 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800/80 dark:text-emerald-100';
      case 'sky':
        return 'bg-sky-100/90 border-sky-300 text-sky-950 dark:bg-sky-950/40 dark:border-sky-800/80 dark:text-sky-100';
      case 'purple':
        return 'bg-purple-100/90 border-purple-300 text-purple-950 dark:bg-purple-950/40 dark:border-purple-800/80 dark:text-purple-100';
      case 'rose':
        return 'bg-rose-100/90 border-rose-300 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800/80 dark:text-rose-100';
      case 'orange':
      default:
        return 'bg-orange-100/90 border-orange-300 text-orange-950 dark:bg-orange-950/40 dark:border-orange-800/80 dark:text-orange-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <StickyIcon className="h-3.5 w-3.5" />
            <span>Database B — Sticky Notes</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Quick Capture & Sticky Notes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menangkap tugas sederhana, ide kilat, dan catatan cepat yang dapat dikonversi menjadi To-Do List (Workflow 2).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>+ Sticky Baru</span>
        </button>
      </div>

      {/* Success Notification for Workflow 2 */}
      {convertSuccessMessage && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>{convertSuccessMessage}</span>
          </div>
          <button onClick={() => setConvertSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Area Tabs */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
        {/* Area Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider">Area:</span>
          {['All', ...AREAS].map((ar) => (
            <button
              key={ar}
              onClick={() => setSelectedArea(ar)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedArea === ar
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {ar}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowConvertedOnly(!showConvertedOnly)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
                showConvertedOnly
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300'
                  : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              {showConvertedOnly ? '✓ Menampilkan Hasil Konversi' : 'Semua Status'}
            </button>
          </div>
        </div>

        {/* Search & Priority Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari isi sticky note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Prioritas:</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">Semua Prioritas</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sticky Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStickies.map((sticky) => {
          const colorClass = getColorStyles(sticky.color);
          const isConverted = Boolean(sticky.convertedToTaskId);

          return (
            <div
              key={sticky.id}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${colorClass}`}
            >
              <div>
                {/* Top badges & controls */}
                <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-white/60 dark:bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {sticky.area}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        sticky.priority === 'High'
                          ? 'bg-rose-500 text-white'
                          : sticky.priority === 'Medium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-400 text-white'
                      }`}
                    >
                      {sticky.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => openEditModal(sticky)}
                      className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sticky.id)}
                      className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 text-rose-700 dark:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <h3 className="mt-3 text-sm font-bold tracking-tight leading-snug">
                  {sticky.title}
                </h3>
                {sticky.content && (
                  <p className="mt-2 text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
                    {sticky.content}
                  </p>
                )}
              </div>

              {/* Bottom footer */}
              <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] opacity-80">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{sticky.date ? sticky.date : 'Tanpa tanggal'}</span>
                  </span>

                  <button
                    onClick={() => handleToggleComplete(sticky)}
                    className="flex items-center gap-1 text-[11px] font-semibold hover:underline"
                  >
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${sticky.completed ? 'text-emerald-700 dark:text-emerald-400 fill-emerald-100' : ''}`}
                    />
                    <span>{sticky.completed ? 'Selesai' : 'Belum'}</span>
                  </button>
                </div>

                {/* Workflow 2: Convert Action Button */}
                <div>
                  {isConverted ? (
                    <div className="flex items-center gap-1 rounded-xl bg-indigo-600/15 dark:bg-indigo-900/40 px-2.5 py-1 text-[11px] font-semibold text-indigo-900 dark:text-indigo-200">
                      <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Terkonversi ke To-Do List</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConvertToTask(sticky.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white transition active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Konversi Menjadi Task (WF 2)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStickies.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <StickyIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tidak ada Sticky Notes
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan tombol "+ Sticky Baru" di atas untuk menambahkan catatan atau ide cepat.
          </p>
        </div>
      )}

      {/* Create / Edit Sticky Note Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSticky ? 'Edit Sticky Note' : 'Buat Sticky Note Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Judul Catatan / Ide <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Isi Catatan / Detail
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Area</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value as StickyArea)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as StickyPriority)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tanggal Pengingat (Opsional)
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Warna Sticky</label>
                  <div className="mt-1.5 flex gap-2">
                    {(['amber', 'emerald', 'sky', 'purple', 'rose', 'orange'] as const).map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-6 w-6 rounded-full border-2 transition ${
                          color === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                        } ${
                          c === 'amber' ? 'bg-amber-300' :
                          c === 'emerald' ? 'bg-emerald-300' :
                          c === 'sky' ? 'bg-sky-300' :
                          c === 'purple' ? 'bg-purple-300' :
                          c === 'rose' ? 'bg-rose-300' : 'bg-orange-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
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
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Sticky'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

