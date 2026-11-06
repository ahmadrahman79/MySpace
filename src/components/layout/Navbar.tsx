'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Moon, Sun, Search, Plus, Bell, PanelLeft, PanelLeftClose } from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenQuickCapture: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onToggleSidebar, onOpenQuickCapture }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-4 sm:px-8 bg-transparent backdrop-blur-md">
      {/* Left: Hide/Show Sidebar Toggle Button + Welcome Ahmad Rahman */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Sidebar Toggle for both mobile and desktop */}
        <button
          onClick={onToggleSidebar}
          className="rounded-2xl p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 shadow-xs transition"
          aria-label="Toggle Sidebar"
          title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>

        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Welcome back,</span>
          <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight">
            Ahmad Rahman
          </span>
        </div>
      </div>

      {/* Center Search Pill Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, notes, events..."
            className="w-full h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 pl-10 pr-12 text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition"
          />
          <kbd className="absolute right-3.5 inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Dark Mode & + Quick Capture */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleDarkMode}
          className="rounded-full p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shadow-xs transition"
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>

        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 px-4 py-2 text-xs font-bold shadow-md shadow-slate-900/10 active:scale-95 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Quick Capture</span>
        </button>
      </div>
    </header>
  );
};
