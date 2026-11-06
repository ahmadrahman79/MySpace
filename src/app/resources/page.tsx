'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  UploadCloud,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Tag,
  Sparkles,
  Server,
  Cloud,
  Database
} from 'lucide-react';
import { ResourceItem } from '@/lib/types';

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'link'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Sistem Kerja');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/resources');
      const data = await res.json();
      if (data.success) {
        setResources(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch resources:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');

      setUrl(data.data.url);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setUploadSuccess(`Gambar berhasil di-upload ke Object Storage (${data.data.provider})!`);
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    try {
      setFormLoading(true);
      const isImg = url.match(/\.(png|jpe?g|gif|webp|svg)/i) || url.includes('/uploads/') || url.includes('cloudinary');
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          url,
          category,
          description,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          type: isImg ? 'image' : 'link',
        }),
      });
      if (res.ok) {
        setTitle('');
        setUrl('');
        setDescription('');
        setTags('');
        fetchResources();
      }
    } catch (e) {
      console.error('Failed to save resource:', e);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus tautan/gambar ini?')) return;
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchResources();
      }
    } catch (e) {
      console.error('Failed to delete resource:', e);
    }
  };

  const handleCopyUrl = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Distinct Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return ['All', ...Array.from(set)];
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = selectedCategory === 'All' || r.category === selectedCategory;
      const matchType = typeFilter === 'all' || (typeFilter === 'image' ? r.type === 'image' : r.type !== 'image');
      return matchSearch && matchCategory && matchType;
    });
  }, [resources, search, selectedCategory, typeFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          <Cloud className="h-3.5 w-3.5" />
          <span>Object Storage & Media URL Database</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Links & Object Storage Manager
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Gambar disimpan di Object Storage gratis (Cloudinary / Supabase Storage / Uploadthing), sedangkan URL tersimpan di database teks.
        </p>
      </div>

      {/* Cloud Architecture Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400">
            <Cloud className="h-4 w-4" />
            <span>Cloudinary Free Tier</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-900/80 dark:text-indigo-300/80">
            25 GB kredit gratis per bulan, optimasi gambar & CDN cepat.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <Database className="h-4 w-4" />
            <span>Supabase Storage Free</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-900/80 dark:text-emerald-300/80">
            1 GB storage terpadu langsung dengan database Postgres Supabase.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400">
            <Server className="h-4 w-4" />
            <span>Uploadthing Free Tier</span>
          </div>
          <p className="mt-1 text-[11px] text-sky-900/80 dark:text-sky-300/80">
            2 GB gratis dengan integrasi Next.js native via environment keys.
          </p>
        </div>
      </div>

      {/* Main Grid: Form Input + Resource List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Upload & Add Link (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs h-fit space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Form Input Link & Gambar
          </h3>

          {uploadSuccess && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {uploadSuccess}
            </div>
          )}

          {/* Upload Button Box */}
          <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-5 text-center dark:border-indigo-900 dark:bg-indigo-950/20">
            <UploadCloud className="mx-auto h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-1" />
            <label className="cursor-pointer block text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline">
              <span>{uploadingImage ? 'Mengupload ke Object Storage...' : 'Upload File Gambar'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
            <p className="mt-1 text-[11px] text-slate-400">
              File dikirim ke Object Storage, lalu URL otomatis diisikan di bawah.
            </p>
          </div>

          <form onSubmit={handleSaveResource} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Judul Link / Gambar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth: Panduan Pelatihan Petugas SE2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                URL Tautan / URL Storage <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://... atau /uploads/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 w-full font-mono rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Kategori</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Tags (Koma)</label>
                <input
                  type="text"
                  placeholder="BPS, SE2026, Fasih"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Keterangan / Deskripsi</label>
              <textarea
                rows={2}
                placeholder="Deskripsi singkat..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {formLoading ? 'Menyimpan...' : 'Simpan ke Database Teks'}
            </button>
          </form>
        </div>

        {/* Right Gallery & Links List (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tautan, tags, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTypeFilter('all')}
                className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${
                  typeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setTypeFilter('image')}
                className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${
                  typeFilter === 'image' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Gambar
              </button>
              <button
                onClick={() => setTypeFilter('link')}
                className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${
                  typeFilter === 'link' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Link
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredResources.map((res) => {
              const isImg = res.type === 'image' || res.url.match(/\.(png|jpe?g|gif|webp|svg)/i);

              return (
                <div
                  key={res.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 hover:shadow-xs transition dark:border-slate-800 dark:bg-slate-800/40 flex flex-col justify-between"
                >
                  <div>
                    {/* Image Preview if image */}
                    {isImg && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 h-36 flex items-center justify-center">
                        <img
                          src={res.url}
                          alt={res.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {res.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {res.createdAt}
                      </span>
                    </div>

                    <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {res.title}
                    </h4>

                    {res.description && (
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {res.description}
                      </p>
                    )}

                    {res.tags && res.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {res.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyUrl(res.id, res.url)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                        title="Copy URL"
                      >
                        {copiedId === res.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-1 text-slate-400 hover:text-indigo-600 transition"
                        title="Buka URL"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <button
                      onClick={() => handleDelete(res.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredResources.length === 0 && (
            <p className="py-12 text-center text-xs text-slate-400 italic">
              Tidak ada tautan atau gambar yang cocok dengan pencarian.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

