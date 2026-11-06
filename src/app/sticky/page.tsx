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
  MoreVertical,
  X,
  Clock,
  User,
  Palette
} from 'lucide-react';
import { StickyNote, StickyArea, StickyPriority, StickyStatus } from '@/lib/types';
import { IndonesianDatePicker, formatIndonesianDate } from '@/components/ui/IndonesianDatePicker';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { RichNotionEditor } from '@/components/ui/RichNotionEditor';

const COLOR_OPTIONS: { id: StickyNote['color']; label: string; bgClass: string; borderClass: string }[] = [
  { id: 'amber', label: 'Kuning Amber', bgClass: 'bg-amber-100', borderClass: 'border-amber-400' },
  { id: 'emerald', label: 'Hijau Emerald', bgClass: 'bg-emerald-100', borderClass: 'border-emerald-400' },
  { id: 'sky', label: 'Biru Sky', bgClass: 'bg-sky-100', borderClass: 'border-sky-400' },
  { id: 'purple', label: 'Ungu Lavender', bgClass: 'bg-purple-100', borderClass: 'border-purple-400' },
  { id: 'rose', label: 'Merah Rose', bgClass: 'bg-rose-100', borderClass: 'border-rose-400' },
  { id: 'orange', label: 'Oranye Sunset', bgClass: 'bg-orange-100', borderClass: 'border-orange-400' },
];

const AREA_OPTIONS = [
  { value: 'Personal', label: 'Personal' },
  { value: 'Family', label: 'Family' },
  { value: 'Business', label: 'Business' },
  { value: 'Side Hustle', label: 'Side Hustle' },
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low Priority' },
  { value: 'Medium', label: 'Medium Priority' },
  { value: 'High', label: 'High Priority' },
];

const STATUS_OPTIONS = [
  { value: 'Not started', label: 'Not started' },
  { value: 'In progress', label: 'In progress' },
  { value: 'Done', label: 'Done' },
];

export default function StickyNotesPage() {
  const [stickies, setStickies] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'running' | 'disqualified'>('running');
  const [selectedArea, setSelectedArea] = useState<string>('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSticky, setEditingSticky] = useState<StickyNote | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [area, setArea] = useState<StickyArea>('Personal');
  const [priority, setPriority] = useState<StickyPriority>('Medium');
  const [status, setStatus] = useState<StickyStatus>('In progress');
  const [color, setColor] = useState<StickyNote['color']>('amber');
  const [date, setDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);

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
    setStatus('In progress');
    setColor('amber');
    setDate('');
    setModalOpen(true);
  };

  const openEditModal = (sticky: StickyNote) => {
    setEditingSticky(sticky);
    setTitle(sticky.title);
    setContent(sticky.content);
    setArea(sticky.area);
    setPriority(sticky.priority);
    setStatus(sticky.status);
    setColor(sticky.color || 'amber');
    setDate(sticky.date || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setFormLoading(true);
      const payload = {
        title,
        content,
        area,
        priority,
        status,
        color,
        date: date || null,
      };

      if (editingSticky) {
        await fetch(`/api/sticky-notes/${editingSticky.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/sticky-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      fetchStickies();
    } catch (e) {
      console.error('Error saving sticky note:', e);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan tempel ini?')) return;
    try {
      await fetch(`/api/sticky-notes/${id}`, { method: 'DELETE' });
      fetchStickies();
    } catch (e) {
      console.error('Failed to delete sticky:', e);
    }
  };

  const handleToggleCompleted = async (sticky: StickyNote) => {
    try {
      const newCompleted = !sticky.completed;
      await fetch(`/api/sticky-notes/${sticky.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: newCompleted,
          status: newCompleted ? 'Done' : 'In progress',
        }),
      });
      fetchStickies();
    } catch (e) {
      console.error('Error toggling sticky completed:', e);
    }
  };

  const filteredStickies = useMemo(() => {
    return stickies.filter((s) => {
      const matchSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.toLowerCase().includes(search.toLowerCase());
      const matchArea = selectedArea === 'All' || s.area === selectedArea;
      const matchTab = activeTab === 'running' ? !s.completed : s.completed;
      return matchSearch && matchArea && matchTab;
    });
  }, [stickies, search, selectedArea, activeTab]);

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <StickyIcon className="h-5 w-5 text-amber-500" />
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Daily Operation — Sticky Notes
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Papan catatan cepat, ide, dan operasional harian Ahmad Rahman.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 text-xs font-black shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>+ Buat Catatan Tempel</span>
        </button>
      </div>

      {/* Filter Bar with Gambar 1 Searchable Dropdown */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ide atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-emerald-500/80 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <SearchableSelect
              value={selectedArea}
              options={[{ value: 'All', label: 'Semua Area' }, ...AREA_OPTIONS]}
              onChange={setSelectedArea}
            />
          </div>

          {/* Running vs Completed Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('running')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                activeTab === 'running' ? 'bg-white dark:bg-slate-900 text-amber-700 shadow-2xs font-black' : 'text-slate-600'
              }`}
            >
              Aktif ({stickies.filter(s => !s.completed).length})
            </button>
            <button
              onClick={() => setActiveTab('disqualified')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                activeTab === 'disqualified' ? 'bg-white dark:bg-slate-900 text-slate-900 shadow-2xs font-black' : 'text-slate-600'
              }`}
            >
              Selesai ({stickies.filter(s => s.completed).length})
            </button>
          </div>
        </div>
      </div>

      {/* STICKY NOTES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStickies.map((sticky) => {
          const colorStyles: Record<string, string> = {
            amber: 'bg-amber-50/90 border-amber-200 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100',
            emerald: 'bg-emerald-50/90 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100',
            sky: 'bg-sky-50/90 border-sky-200 text-sky-950 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-100',
            purple: 'bg-purple-50/90 border-purple-200 text-purple-950 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-100',
            rose: 'bg-rose-50/90 border-rose-200 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100',
            orange: 'bg-orange-50/90 border-orange-200 text-orange-950 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-100',
          };
          const cardCls = colorStyles[sticky.color] || colorStyles.amber;

          return (
            <div
              key={sticky.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between shadow-2xs transition hover:shadow-md ${cardCls}`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                    {sticky.area || 'Personal'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(sticky)}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 transition"
                      title="Edit"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(sticky.id)}
                      className="p-1 rounded text-rose-500 hover:text-rose-700 transition"
                      title="Hapus"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-black break-words">{sticky.title}</h3>
                <p className="mt-1.5 text-xs opacity-85 leading-relaxed break-words whitespace-pre-line">
                  {sticky.content}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px]">
                <span className="font-semibold opacity-70">
                  {formatIndonesianDate(sticky.date) || 'Hari Ini'}
                </span>
                <button
                  onClick={() => handleToggleCompleted(sticky)}
                  className={`h-6 px-2.5 rounded-full flex items-center gap-1 text-[10px] font-bold transition border ${
                    sticky.completed
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span>{sticky.completed ? '✓ Selesai' : '○ Tandai Selesai'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT STICKY MODAL WITH COLOR PICKER & NOTION FORMATS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingSticky ? 'Edit Operation' : 'New Operation'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Judul Operasi / Catatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Rencana Koordinasi Lapangan"
                  className="mt-1 w-full rounded-lg border border-emerald-500/80 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              {/* COLOR PICKER (Pengaturan Memilih Warna Sticky Note) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-amber-500" />
                  <span>Pilih Warna Sticky Note:</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setColor(c.id)}
                      className={`h-8 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition ${c.bgClass} ${c.borderClass} ${
                        color === c.id ? 'ring-2 ring-emerald-500 shadow-xs' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {color === c.id && <Check className="h-3 w-3 text-slate-900" />}
                      <span className="text-slate-900">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RICH NOTION EDITOR FOR STICKY DETAIL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detail & Format Catatan (Bold, Italic, Poin, Tabel)
                </label>
                <RichNotionEditor
                  content={content}
                  onChange={setContent}
                  minHeight="140px"
                  placeholder="Ketik catatan atau gunakan tombol format di atas..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Area</label>
                  <div className="mt-1">
                    <SearchableSelect
                      value={area}
                      options={AREA_OPTIONS}
                      onChange={(val) => setArea(val as StickyArea)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Target</label>
                  <div className="mt-1">
                    <IndonesianDatePicker
                      value={date}
                      onChange={setDate}
                      placeholder="Pilih tanggal..."
                    />
                  </div>
                </div>
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
                  className="rounded-full bg-slate-900 hover:bg-slate-800 px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
