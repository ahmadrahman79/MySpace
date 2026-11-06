'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CheckSquare,
  Calendar,
  FileText,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Plus,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { AppLogo } from '../ui/AppLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onOpenQuickCapture: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onToggleCollapse, onOpenQuickCapture }) => {
  const pathname = usePathname();

  const isHomeActive = pathname === '/';
  const isTasksActive = pathname === '/tasks';
  const isCalendarActive = pathname === '/calendar';
  const isStickyActive = pathname === '/sticky';
  const isNotesActive = pathname === '/notes';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Hideable, Sticky & Fixed Sidebar (Never scrolls with content) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen ${
          isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 overflow-hidden border-none'
        }`}
      >
        <div className="w-64 flex flex-col h-full justify-between">
          {/* Top Section */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Top Header: Logo + App Name + Hide Toggle Button */}
            <div className="p-5 pb-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 shrink-0">
              <Link href="/" className="flex items-center gap-3">
                <AppLogo size={36} showText={true} />
              </Link>

              <button
                onClick={onToggleCollapse}
                className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                title="Sembunyikan Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* MAIN NAVIGATION: Home, My Tasks, Note, Sticky Note, Kalender */}
            <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Menu Utama
              </div>

              {/* 1. Home Dashboard (No flower icon) */}
              <Link
                href="/"
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs ${
                  isHomeActive
                    ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home className={`h-4 w-4 ${isHomeActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>Home Dashboard</span>
                </div>
              </Link>

              {/* 2. My Tasks */}
              <Link
                href="/tasks"
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isTasksActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className={`h-4 w-4 ${isTasksActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>My Tasks</span>
                </div>
              </Link>

              {/* 3. Note */}
              <Link
                href="/notes"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isNotesActive
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40'
                }`}
              >
                <FileText className={`h-4 w-4 ${isNotesActive ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>Note</span>
              </Link>

              {/* 4. Sticky Note */}
              <Link
                href="/sticky"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isStickyActive
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40'
                }`}
              >
                <StickyNote className={`h-4 w-4 ${isStickyActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                <span>Sticky Note</span>
              </Link>

              {/* 5. Kalender */}
              <Link
                href="/calendar"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isCalendarActive
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40'
                }`}
              >
                <Calendar className={`h-4 w-4 ${isCalendarActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                <span>Kalender</span>
              </Link>
            </div>
          </div>

          {/* BOTTOM PINNED SECTION STRICTLY AS GAMBAR 2 (ALWAYS VISIBLE) */}
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 space-y-3 z-10">
            {/* Quick Capture Button (Gambar 2: Purple pill with '+ + Quick Capture') */}
            <button
              onClick={() => {
                onOpenQuickCapture();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] hover:from-[#7c3aed] hover:to-[#4f46e5] text-white py-3 px-5 text-xs font-extrabold shadow-md shadow-indigo-600/20 transition active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>+ Quick Capture</span>
            </button>

            {/* Profile Bar (Gambar 2: Circle AR gradient avatar + Ahmad Rahman + ahmadrahman79@gmail.com) */}
            <div className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#ec4899] via-[#f43f5e] to-[#f97316] flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                AR
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                  Ahmad Rahman
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  ahmadrahman79@gmail.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
