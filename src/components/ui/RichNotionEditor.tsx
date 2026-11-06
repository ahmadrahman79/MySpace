'use client';

import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  Plus,
  Trash2,
  Link as LinkIcon,
  Tag,
  Eye,
  Edit3,
  Columns
} from 'lucide-react';
import { NoteItem } from '@/lib/types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface RichNotionEditorProps {
  content: string;
  onChange: (val: string) => void;
  availableNotes?: NoteItem[];
  placeholder?: string;
  minHeight?: string;
}

export function RichNotionEditor({
  content,
  onChange,
  availableNotes = [],
  placeholder = 'Ketik catatan, panduan, atau tekan tombol format di atas...',
  minHeight = '320px',
}: RichNotionEditorProps) {
  const [tab, setTab] = useState<'edit' | 'split' | 'preview'>('edit');
  const [showTagMenu, setShowTagMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to insert formatting at cursor
  const insertFormat = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end) || 'teks';
    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onChange(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 40);
  };

  // Insert Google Sheet / Notion Style Table
  const insertTable = () => {
    const tableTemplate = `\n| Kolom 1 | Kolom 2 | Kolom 3 |\n| :--- | :--- | :--- |\n| Baris 1 | Data A | 100 |\n| Baris 2 | Data B | 200 |\n| Baris 3 | Data C | 300 |\n\n`;
    insertFormat(tableTemplate, '');
  };

  // Add a row to an existing markdown table
  const addTableRow = () => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const newRow = `| Baru | Data | 0 |\n`;
    const newContent = content.substring(0, pos) + newRow + content.substring(pos);
    onChange(newContent);
  };

  // Tag an existing note
  const handleTagNote = (note: NoteItem) => {
    const tagText = ` [📄 ${note.title}](/notes?id=${note.id}) `;
    insertFormat(tagText, '');
    setShowTagMenu(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex flex-wrap items-center gap-1">
          {/* Regular / Plain */}
          <button
            type="button"
            onClick={() => insertFormat('', '')}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Regular text"
          >
            Normal
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Bold */}
          <button
            type="button"
            onClick={() => insertFormat('**', '**')}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Bold (**teks**)"
          >
            <Bold className="h-3.5 w-3.5 font-black" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => insertFormat('*', '*')}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Italic (*teks*)"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>

          {/* Bold-Italic */}
          <button
            type="button"
            onClick={() => insertFormat('***', '***')}
            className="px-1.5 py-1 rounded-lg text-xs font-black italic text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Bold-Italic (***teks***)"
          >
            BI
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Headings: H1, H2, H3 */}
          <button
            type="button"
            onClick={() => insertFormat('\n# ')}
            className="px-1.5 py-1 rounded-lg text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertFormat('\n## ')}
            className="px-1.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertFormat('\n### ')}
            className="px-1.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Heading 3"
          >
            H3
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => insertFormat('\n- ')}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Poin / Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onClick={() => insertFormat('\n1. ')}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Nomor / Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>

          {/* Checklist */}
          <button
            type="button"
            onClick={() => insertFormat('\n- [ ] ')}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Cek List / Task Checkbox"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Google Sheet / Notion Style Table Insert */}
          <button
            type="button"
            onClick={insertTable}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
            title="Buat Tabel Seperti Google Sheet"
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>+ Tabel Sheet</span>
          </button>

          {/* Tag Existing Note */}
          {availableNotes.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTagMenu(!showTagMenu)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300"
                title="Tag Catatan dari Fitur Notes"
              >
                <Tag className="h-3.5 w-3.5" />
                <span>@ Tag Catatan</span>
              </button>

              {showTagMenu && (
                <div className="absolute left-0 mt-1 z-30 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 max-h-48 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    Pilih Catatan untuk di-Tag
                  </div>
                  {availableNotes.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleTagNote(n)}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 truncate block"
                    >
                      📄 {n.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Link Attachment */}
          <button
            type="button"
            onClick={() => insertFormat('[Judul Link](', 'https://...)')}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
            title="Lampirkan Link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* View Switcher: Edit, Split (Live), Preview */}
        <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`px-2 py-1 rounded-lg transition ${
              tab === 'edit' ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setTab('split')}
            className={`px-2 py-1 rounded-lg transition ${
              tab === 'split' ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Berdampingan
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-2 py-1 rounded-lg transition ${
              tab === 'preview' ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Pratinjau
          </button>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className={`grid ${tab === 'split' ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800' : 'grid-cols-1'}`}>
        {/* Editor Area */}
        {(tab === 'edit' || tab === 'split') && (
          <div className="p-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full h-full bg-transparent text-xs text-slate-900 dark:text-slate-100 font-mono leading-relaxed focus:outline-none resize-y"
            />
          </div>
        )}

        {/* Live Preview / Rendered Notion Area */}
        {(tab === 'preview' || tab === 'split') && (
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto" style={{ minHeight }}>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 pb-1 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <span>Hasil Tampilan Format & Tabel Sheet</span>
              {content.includes('|') && (
                <button
                  type="button"
                  onClick={addTableRow}
                  className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Tambah Baris Tabel</span>
                </button>
              )}
            </div>
            <MarkdownRenderer content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
