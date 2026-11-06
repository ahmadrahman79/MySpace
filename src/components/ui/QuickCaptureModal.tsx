'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckSquare,
  StickyNote as StickyIcon,
  Link as LinkIcon,
  Calendar,
  ChevronDown,
  Layers,
  Activity,
  AlertCircle
} from 'lucide-react';
import { StickyArea, StickyPriority, TaskProgress, KipAppStatus } from '@/lib/types';
import { IndonesianDatePicker } from '@/components/ui/IndonesianDatePicker';
import { ActivitySelect } from '@/components/ui/ActivitySelect';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ACTIVITIES = [
  'Administrasi', 'Dasar', 'DLS', 'Humas', 'Latsar', 'Podes', 'Polkam',
  'Sakernas', 'Sektoral', 'Seruti Tw 2 & Tw 4', 'Sensus Ekonomi',
  'SNLIK', 'Supas', 'Susenas-Seruti', 'Tambahan', 'ZI', 'DTSEN'
];

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'sticky' | 'task' | 'resource'>('task');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sticky Note State
  const [stickyTitle, setStickyTitle] = useState('');
  const [stickyContent, setStickyContent] = useState('');
  const [stickyArea, setStickyArea] = useState<StickyArea>('Personal');
  const [stickyPriority, setStickyPriority] = useState<StickyPriority>('Medium');
  const [stickyDate, setStickyDate] = useState('');

  // Task State
  const [taskName, setTaskName] = useState('');
  const [taskActivity, setTaskActivity] = useState('Administrasi');
  const [taskProgress, setTaskProgress] = useState<TaskProgress>('Not Started');
  const [taskFinishAt, setTaskFinishAt] = useState('');
  const [taskKipApp, setTaskKipApp] = useState<KipAppStatus>('Pending');
  const [taskNote, setTaskNote] = useState('');

  // Resource State
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resCategory, setResCategory] = useState('Sistem Kerja');

  if (!isOpen) return null;

  const handleSubmitSticky = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stickyTitle.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/sticky-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: stickyTitle,
          content: stickyContent,
          area: stickyArea,
          priority: stickyPriority,
          status: 'In progress',
          date: stickyDate || null,
          color: 'amber',
          completed: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menyimpan sticky note');

      setStickyTitle('');
      setStickyContent('');
      setStickyDate('');
      onSuccess?.();
      window.dispatchEvent(new Event('data-updated'));
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          activity: taskActivity,
          progress: taskProgress,
          finishAt: taskFinishAt || null,
          statusKipApp: taskKipApp,
          note: taskNote,
          priority: taskProgress === 'Very Urgent' ? 'High' : 'Medium',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menyimpan tugas');

      setTaskName('');
      setTaskFinishAt('');
      setTaskNote('');
      onSuccess?.();
      window.dispatchEvent(new Event('data-updated'));
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: resTitle,
          url: resUrl,
          category: resCategory,
          type: 'link',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menyimpan tautan');

      setResTitle('');
      setResUrl('');
      onSuccess?.();
      window.dispatchEvent(new Event('data-updated'));
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 dark:bg-slate-900 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Quick Capture
              </h2>
              <p className="text-[11px] text-slate-400">
                Tambah tugas, catatan cepat, atau tautan baru
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mt-4 flex rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'task'
                ? 'bg-white text-indigo-700 shadow-xs dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Task Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sticky')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'sticky'
                ? 'bg-white text-amber-700 shadow-xs dark:bg-slate-700 dark:text-amber-300'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <StickyIcon className="h-3.5 w-3.5" />
            <span>Sticky Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resource')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'resource'
                ? 'bg-white text-purple-700 shadow-xs dark:bg-slate-700 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Link</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Tab 1: Task Board */}
        {activeTab === 'task' && (
          <form onSubmit={handleSubmitTask} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Nama Tugas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth: Penyusunan laporan perjadin Sakernas"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Custom Styled Dropdowns for Activity and Progress */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Activity
                </label>
                <div className="mt-1">
                  <ActivitySelect
                    value={taskActivity}
                    onChange={setTaskActivity}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Progress
                </label>
                <div className="relative mt-1">
                  <select
                    value={taskProgress}
                    onChange={(e) => setTaskProgress(e.target.value as TaskProgress)}
                    className="w-full appearance-none rounded-2xl border border-sky-200 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/30 px-3.5 py-2.5 text-xs font-bold text-sky-950 dark:text-sky-200 focus:border-sky-500 focus:outline-none cursor-pointer pr-8"
                  >
                    <option value="Not Started" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Not Started</option>
                    <option value="Doing" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Doing</option>
                    <option value="Very Urgent" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Very Urgent</option>
                    <option value="Waiting on External" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Waiting on External</option>
                    <option value="Done" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Done</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-sky-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Custom Styled Date Picker and KipApp Dropdown */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Finish at (Kalender)
                </label>
                <div className="mt-1">
                  <IndonesianDatePicker
                    value={taskFinishAt}
                    onChange={setTaskFinishAt}
                    placeholder="Pilih tanggal..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status KipApp
                </label>
                <div className="relative mt-1">
                  <select
                    value={taskKipApp}
                    onChange={(e) => setTaskKipApp(e.target.value as KipAppStatus)}
                    className="w-full appearance-none rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs font-bold text-emerald-950 dark:text-emerald-200 focus:border-emerald-500 focus:outline-none cursor-pointer pr-8"
                  >
                    <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Pending</option>
                    <option value="Added" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Added</option>
                    <option value="Not Add" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Not Add</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-emerald-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Catatan Tambahan
              </label>
              <textarea
                rows={2}
                placeholder="Catatan pelaksanaan..."
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 py-3 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20 transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Tambahkan ke Task Management'}
              </button>
            </div>
          </form>
        )}

        {/* Form Tab 2: Sticky Note */}
        {activeTab === 'sticky' && (
          <form onSubmit={handleSubmitSticky} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Judul Catatan / Ide <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth: Cek surat pengantar pelatihan Sakernas"
                value={stickyTitle}
                onChange={(e) => setStickyTitle(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Detail Catatan
              </label>
              <textarea
                rows={3}
                placeholder="Detail catatan cepat..."
                value={stickyContent}
                onChange={(e) => setStickyContent(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Area
                </label>
                <div className="relative mt-1">
                  <select
                    value={stickyArea}
                    onChange={(e) => setStickyArea(e.target.value as StickyArea)}
                    className="w-full appearance-none rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/30 px-3.5 py-2.5 text-xs font-bold text-amber-950 dark:text-amber-200 focus:border-amber-500 focus:outline-none cursor-pointer pr-8"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Family">Family</option>
                    <option value="Business">Business</option>
                    <option value="Side Hustle">Side Hustle</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-amber-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Target
                </label>
                <div className="mt-1">
                  <IndonesianDatePicker
                    value={stickyDate}
                    onChange={setStickyDate}
                    placeholder="Pilih tanggal target..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-slate-900 hover:bg-slate-800 py-3 text-xs font-extrabold text-white shadow-md transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan ke Sticky Notes'}
              </button>
            </div>
          </form>
        )}

        {/* Form Tab 3: Resource */}
        {activeTab === 'resource' && (
          <form onSubmit={handleSubmitResource} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Judul Tautan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth: Portal Web BPS"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                URL / Link <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={resUrl}
                onChange={(e) => setResUrl(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 py-3 text-xs font-extrabold text-white shadow-md transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Tautan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
