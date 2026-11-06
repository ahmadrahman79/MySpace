'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikeIcon,
  Code as CodeIcon,
  Highlighter,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  List as BulletListIcon,
  ListOrdered as NumberedListIcon,
  CheckSquare as TaskListIcon,
  Quote,
  Table as TableIcon,
  Minus,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  ChevronDown,
  Plus,
  Trash2,
  Sparkles,
  FileText
} from 'lucide-react';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
  onFocusModeToggle?: () => void;
  isFocusMode?: boolean;
  saveStatus?: 'saved' | 'saving' | 'unsaved' | 'error';
}

export function RichTextEditor({
  initialContent = '',
  onChange,
  placeholder = 'Mulai menulis dokumen, instruksi, atau ketik "/" untuk perintah cepat...',
  minHeight = '360px',
  readOnly = false,
  onFocusModeToggle,
  isFocusMode = false,
  saveStatus = 'saved',
}: RichTextEditorProps) {
  const [bubbleMenuPos, setBubbleMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(1);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Convert markdown tables/plain text to basic HTML if needed
  const prepareInitialContent = (raw: string) => {
    if (!raw) return '<p></p>';
    if (raw.trim().startsWith('<') && raw.includes('>')) return raw;
    // Basic Markdown conversion for legacy records
    const lines = raw.split('\n');
    let html = '';
    let inTable = false;
    let tableHtml = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (trimmed.includes('---')) continue; // Skip markdown separator
        if (!inTable) {
          inTable = true;
          tableHtml = '<table class="editor-table"><tbody>';
        }
        const cells = trimmed.split('|').slice(1, -1);
        tableHtml += '<tr>' + cells.map(c => `<td><p>${c.trim()}</p></td>`).join('') + '</tr>';
      } else {
        if (inTable) {
          tableHtml += '</tbody></table>';
          html += tableHtml;
          inTable = false;
          tableHtml = '';
        }
        if (trimmed.startsWith('# ')) {
          html += `<h1>${trimmed.slice(2)}</h1>`;
        } else if (trimmed.startsWith('## ')) {
          html += `<h2>${trimmed.slice(3)}</h2>`;
        } else if (trimmed.startsWith('### ')) {
          html += `<h3>${trimmed.slice(4)}</h3>`;
        } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('* [ ] ')) {
          html += `<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>${trimmed.slice(6)}</p></li></ul>`;
        } else if (trimmed.startsWith('- [x] ') || trimmed.startsWith('* [x] ')) {
          html += `<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>${trimmed.slice(6)}</p></li></ul>`;
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          html += `<ul><li><p>${trimmed.slice(2)}</p></li></ul>`;
        } else if (/^\d+\.\s/.test(trimmed)) {
          html += `<ol><li><p>${trimmed.replace(/^\d+\.\s/, '')}</p></li></ol>`;
        } else if (trimmed) {
          html += `<p>${trimmed}</p>`;
        } else {
          html += `<p></p>`;
        }
      }
    }
    if (inTable) {
      tableHtml += '</tbody></table>';
      html += tableHtml;
    }
    return html || '<p></p>';
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-emerald-600 underline font-medium hover:text-emerald-700' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false, HTMLAttributes: { class: 'editor-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: prepareInitialContent(initialContent),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setReadingTime(Math.max(1, Math.ceil(words / 200)));
      onChange?.(html);

      // Check for Slash command trigger
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n');
      const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);

      if (slashMatch) {
        setSlashFilter(slashMatch[1].toLowerCase());
        const coords = editor.view.coordsAtPos(from);
        if (editorWrapperRef.current) {
          const wrapperRect = editorWrapperRef.current.getBoundingClientRect();
          setSlashMenuPos({
            top: coords.bottom - wrapperRect.top + 8,
            left: Math.max(10, coords.left - wrapperRect.left),
          });
          setShowSlashMenu(true);
        }
      } else {
        setShowSlashMenu(false);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to && editorWrapperRef.current) {
        const startCoords = editor.view.coordsAtPos(from);
        const endCoords = editor.view.coordsAtPos(to);
        const wrapperRect = editorWrapperRef.current.getBoundingClientRect();
        const centerLeft = (startCoords.left + endCoords.left) / 2 - wrapperRect.left;
        const top = startCoords.top - wrapperRect.top - 48;

        setBubbleMenuPos({
          top: Math.max(8, top),
          left: Math.min(Math.max(20, centerLeft - 140), wrapperRect.width - 320),
        });
      } else {
        setBubbleMenuPos(null);
        setShowBlockDropdown(false);
      }
    },
  });

  // Calculate stats on load
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setReadingTime(Math.max(1, Math.ceil(words / 200)));
    }
  }, [editor]);

  // Insert Table
  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  // Link handler
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan tautan URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Execute Slash command
  const executeSlash = (action: () => void) => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n');
    const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);
    if (slashMatch) {
      const slashLength = slashMatch[0].length;
      editor.chain().focus().deleteRange({ from: from - slashLength, to: from }).run();
    }
    action();
    setShowSlashMenu(false);
  };

  if (!editor) return null;

  // Slash command items
  const slashItems = [
    { title: 'Teks Biasa', desc: 'Mulai menulis paragraf biasa', icon: FileText, action: () => editor.chain().focus().setParagraph().run() },
    { title: 'Heading 1', desc: 'Judul bagian besar', icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { title: 'Heading 2', desc: 'Sub-judul tingkat 2', icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { title: 'Heading 3', desc: 'Sub-judul tingkat 3', icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { title: 'Daftar Poin (Bulleted List)', desc: 'Daftar bullet sederhana', icon: BulletListIcon, action: () => editor.chain().focus().toggleBulletList().run() },
    { title: 'Daftar Nomor (Numbered List)', desc: 'Daftar dengan nomor berurutan', icon: NumberedListIcon, action: () => editor.chain().focus().toggleOrderedList().run() },
    { title: 'To-do List (Checklist)', desc: 'Daftar tugas dengan kotak centang', icon: TaskListIcon, action: () => editor.chain().focus().toggleTaskList().run() },
    { title: 'Tabel (Google Sheet / Notion)', desc: 'Sisipkan tabel baris & kolom', icon: TableIcon, action: insertTable },
    { title: 'Kutipan (Quote)', desc: 'Blok kutipan catatan penting', icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run() },
    { title: 'Garis Pembatas (Divider)', desc: 'Garis horizontal pemisah konten', icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run() },
  ].filter(i => i.title.toLowerCase().includes(slashFilter) || i.desc.toLowerCase().includes(slashFilter));

  // Determine current active block label
  const getCurrentBlockLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    if (editor.isActive('bulletList')) return 'Bulleted List';
    if (editor.isActive('orderedList')) return 'Numbered List';
    if (editor.isActive('taskList')) return 'To-do List';
    if (editor.isActive('blockquote')) return 'Quote';
    return 'Normal Text';
  };

  return (
    <div
      ref={editorWrapperRef}
      className={`relative rounded-2xl border transition-all duration-300 ${
        isFocusMode
          ? 'fixed inset-0 z-50 rounded-none border-none bg-white dark:bg-slate-950 p-6 sm:p-12 overflow-y-auto max-w-5xl mx-auto'
          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
      }`}
    >
      {/* TOP COMPACT TOOLBAR */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-2xl">
        {/* Formatting Actions */}
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Block Type Selector (Notion Style) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBlockDropdown(!showBlockDropdown)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <span>{getCurrentBlockLabel()}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showBlockDropdown && (
              <div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-xl z-30 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().setParagraph().run(); setShowBlockDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Normal Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setShowBlockDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Heading1 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Heading 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setShowBlockDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Heading2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Heading 2</span>
                </button>
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setShowBlockDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Heading3 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Heading 3</span>
                </button>
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowBlockDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <BulletListIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Bulleted List</span>
                </button>
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().toggleOrderedList().run(); setShowBlockDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <NumberedListIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Numbered List</span>
                </button>
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().toggleTaskList().run(); setShowBlockDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <TaskListIcon className="h-3.5 w-3.5 text-emerald-600" />
                  <span>To-do List</span>
                </button>
              </div>
            )}
          </div>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Inline Formats */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('bold') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Tebal (Ctrl+B)"
          >
            <BoldIcon className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('italic') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Miring (Ctrl+I)"
          >
            <ItalicIcon className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('underline') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Garis Bawah (Ctrl+U)"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('strike') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Coretan"
          >
            <StrikeIcon className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('highlight') ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Highlight Kuning"
          >
            <Highlighter className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={setLink}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('link') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Tautkan Link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Table Insertion & Control */}
          <button
            type="button"
            onClick={insertTable}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('table') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Sisipkan Tabel (Google Sheet / Notion)"
          >
            <TableIcon className="h-3.5 w-3.5" />
          </button>

          {editor.isActive('table') && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-white rounded"
                title="Tambah Baris"
              >
                +Baris
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-white rounded"
                title="Tambah Kolom"
              >
                +Kolom
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="px-1.5 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-white rounded"
                title="Hapus Tabel"
              >
                Hapus
              </button>
            </div>
          )}

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right Info: Stats, Auto-save status, Focus Mode */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {/* Auto-save Status Indicator */}
          <div className="flex items-center gap-1">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Menyimpan...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Tersimpan
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                Belum disimpan
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Gagal simpan
              </span>
            )}
          </div>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <span>{wordCount} kata</span>
          <span>•</span>
          <span>{readingTime} min baca</span>

          {onFocusModeToggle && (
            <button
              type="button"
              onClick={onFocusModeToggle}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 transition ml-1"
              title={isFocusMode ? 'Keluar Focus Mode' : 'Focus Mode (ChatGPT Writing Mode)'}
            >
              {isFocusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* FLOATING CONTEXTUAL BUBBLE MENU (NOTION & GAMBAR USER STYLE) */}
      {bubbleMenuPos && (
        <div
          style={{ top: `${bubbleMenuPos.top}px`, left: `${bubbleMenuPos.left}px` }}
          className="absolute z-40 flex items-center gap-1 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95"
        >
          {/* Format Buttons */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('bold') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200'
            }`}
          >
            <BoldIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('italic') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200'
            }`}
          >
            <ItalicIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('underline') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200'
            }`}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition ${
              editor.isActive('strike') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200'
            }`}
          >
            <StrikeIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className="p-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-amber-50 dark:text-slate-200"
          >
            <Highlighter className="h-3.5 w-3.5 text-amber-500" />
          </button>
          <button
            type="button"
            onClick={setLink}
            className="p-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200"
          >
            <LinkIcon className="h-3.5 w-3.5 text-emerald-600" />
          </button>
        </div>
      )}

      {/* SLASH COMMAND POPUP MENU ("/") */}
      {showSlashMenu && slashMenuPos && (
        <div
          style={{ top: `${slashMenuPos.top}px`, left: `${slashMenuPos.left}px` }}
          className="absolute z-50 w-72 max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-2xl animate-in fade-in zoom-in-95"
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Perintah Cepat / Blok Konten
          </div>
          {slashItems.length === 0 ? (
            <div className="px-2 py-2 text-xs text-slate-400">Tidak ada perintah yang cocok</div>
          ) : (
            slashItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => executeSlash(item.action)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700/80 flex items-start gap-2.5 transition text-slate-800 dark:text-slate-100"
                >
                  <div className="mt-0.5 p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* DOCUMENT WRITING CANVAS */}
      <div
        className="px-6 py-6 sm:px-10 sm:py-8 font-sans text-slate-800 dark:text-slate-100 selection:bg-emerald-100 selection:text-emerald-900"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} className="tiptap-doc focus:outline-none" />
      </div>
    </div>
  );
}
