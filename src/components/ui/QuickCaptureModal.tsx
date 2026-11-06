'use client';

import React, { useState } from 'react';
import { X, Sparkles, CheckSquare, StickyNote as StickyIcon, Link as LinkIcon, Image as ImageIcon, Upload } from 'lucide-react';
import { StickyArea, StickyPriority, TaskProgress, KipAppStatus } from '@/lib/types';

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
  const [activeTab, setActiveTab] = useState<'sticky' | 'task' | 'resource'>('sticky');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sticky Note State (Workflow 1)
  const [stickyTitle, setStickyTitle] = useState('');
  const [stickyContent, setStickyContent] = useState('');
  const [stickyArea, setStickyArea] = useState<StickyArea>('Personal');
  const [stickyPriority, setStickyPriority] = useState<StickyPriority>('Medium');
  const [stickyDate, setStickyDate] = useState('');
  const [stickyColor, setStickyColor] = useState<'amber' | 'emerald' | 'sky' | 'purple' | 'rose' | 'orange'>('amber');

  // Task State
  const [taskName, setTaskName] = useState('');
  const [taskActivity, setTaskActivity] = useState('Administrasi');
  const [taskProgress, setTaskProgress] = useState<TaskProgress>('Not Started');
  const [taskFinishAt, setTaskFinishAt] = useState('');
  const [taskKipApp, setTaskKipApp] = useState<KipAppStatus>('Pending');
  const [taskNote, setTaskNote] = useState('');

  // Resource / Media State
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resCategory, setResCategory] = useState('Sistem Kerja');
  const [resTags, setResTags] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to upload image');

      setResUrl(data.data.url);
      if (!resTitle) {
        setResTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

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
          title: stickyTitle.trim(),
          content: stickyContent.trim(),
          area: stickyArea,
          priority: stickyPriority,
          date: stickyDate || null,
          color: stickyColor,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save sticky note');

      // Reset
      setStickyTitle('');
      setStickyContent('');
      setStickyDate('');
      onSuccess?.();
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
          name: taskName.trim(),
          activity: taskActivity,
          progress: taskProgress,
          finishAt: taskFinishAt || null,
          statusKipApp: taskKipApp,
          note: taskNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create task');

      // Reset
      setTaskName('');
      setTaskNote('');
      setTaskFinishAt('');
      onSuccess?.();
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
          title: resTitle.trim(),
          url: resUrl.trim(),
          category: resCategory,
          tags: resTags,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save link/image');

      setResTitle('');
      setResUrl('');
      setResTags('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Capture</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('sticky')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'sticky'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <StickyIcon className="h-3.5 w-3.5" />
            <span>Sticky Note (WF 1)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'task'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Task Board</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resource')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'resource'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Link / Gambar</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Form Tab 1: Sticky Note (Workflow 1: Quick capture) */}
        {activeTab === 'sticky' && (
          <form onSubmit={handleSubmitSticky} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Judul Catatan / Ide <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth: Cek surat pengantar pelatihan Sakernas"
                value={stickyTitle}
                onChange={(e) => setStickyTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Isi Catatan / Keterangan Singkat
              </label>
              <textarea
                rows={2}
                placeholder="Tambahkan detail ide, pengingat, atau tautan..."
                value={stickyContent}
                onChange={(e) => setStickyContent(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Area</label>
                <select
                  value={stickyArea}
                  onChange={(e) => setStickyArea(e.target.value as StickyArea)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Personal">Personal</option>
                  <option value="Family">Family</option>
                  <option value="Business">Business</option>
                  <option value="Side Hustle">Side Hustle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Prioritas</label>
                <select
                  value={stickyPriority}
                  onChange={(e) => setStickyPriority(e.target.value as StickyPriority)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
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
                  value={stickyDate}
                  onChange={(e) => setStickyDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Warna Sticky</label>
                <div className="mt-1.5 flex gap-2">
                  {(['amber', 'emerald', 'sky', 'purple', 'rose', 'orange'] as const).map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setStickyColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        stickyColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan ke Sticky Notes'}
              </button>
            </div>
          </form>
        )}

        {/* Form Tab 2: Daily Task */}
        {activeTab === 'task' && (
          <form onSubmit={handleSubmitTask} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Nama Tugas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth: Penyusunan laporan perjadin Sakernas"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Activity</label>
                <select
                  value={taskActivity}
                  onChange={(e) => setTaskActivity(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {ACTIVITIES.map((act) => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Progress</label>
                <select
                  value={taskProgress}
                  onChange={(e) => setTaskProgress(e.target.value as TaskProgress)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Very Urgent">Very Urgent</option>
                  <option value="Not Started">Not Started</option>
                  <option value="Doing">Doing</option>
                  <option value="Waiting on External">Waiting on External</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Finish at (Kalender)
                </label>
                <input
                  type="date"
                  value={taskFinishAt}
                  onChange={(e) => setTaskFinishAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Status KipApp</label>
                <select
                  value={taskKipApp}
                  onChange={(e) => setTaskKipApp(e.target.value as KipAppStatus)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Added">Added</option>
                  <option value="Not Add">Not Add</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Catatan Tambahan</label>
              <textarea
                rows={2}
                placeholder="Catatan pelaksanaan..."
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Tambahkan ke Task Management'}
              </button>
            </div>
          </form>
        )}

        {/* Form Tab 3: Resource / Media & Image Upload */}
        {activeTab === 'resource' && (
          <form onSubmit={handleSubmitResource} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Judul Link / Gambar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth: Panduan Pelaksanaan Fasih 2026"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Object Storage Image Upload Box */}
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center dark:border-slate-700">
              <Upload className="mx-auto h-6 w-6 text-indigo-500 mb-1" />
              <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                <span>{uploadingImage ? 'Mengupload ke Object Storage...' : 'Upload Gambar ke Object Storage (Gratis)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
              <p className="mt-1 text-[11px] text-slate-400">
                Gambar disimpan di Object Storage (Cloudinary/Supabase/Uploadthing) & URL tersimpan di DB.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                URL Tautan / Hasil Upload <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://..."
                value={resUrl}
                onChange={(e) => setResUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Kategori</label>
                <select
                  value={resCategory}
                  onChange={(e) => setResCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Sistem Kerja">Sistem Kerja</option>
                  <option value="Survei & Sensus">Survei & Sensus</option>
                  <option value="Kinerja">Kinerja</option>
                  <option value="Dokumentasi">Dokumentasi</option>
                  <option value="Pribadi">Pribadi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Tags (Koma)</label>
                <input
                  type="text"
                  placeholder="Fasih, BPS, 2026"
                  value={resTags}
                  onChange={(e) => setResTags(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Link & URL Media'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

