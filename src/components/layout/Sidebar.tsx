'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sparkles,
  CheckSquare,
  Inbox,
  CalendarDays,
  BarChart3,
  Settings,
  Plus,
  ChevronDown,
  UploadCloud
} from 'lucide-react';
import { AppLogo } from '../ui/AppLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickCapture: () => void;
}

const mainNavItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Ask AI', href: '#ai', icon: Sparkles, isAction: true },
  { name: 'My tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Inbox', href: '/sticky', icon: Inbox },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Reports & Analytics', href: '/notes', icon: BarChart3 },
  { name: 'Links & Storage', href: '/resources', icon: UploadCloud },
];

const projectItems = [
  { name: 'Sakernas', color: 'bg-purple-500', count: 38, href: '/tasks?activity=Sakernas' },
  { name: 'Susenas-Seruti', color: 'bg-blue-500', count: 24, href: '/tasks?activity=Susenas-Seruti' },
  { name: 'Sektoral & Pemda', color: 'bg-teal-400', count: 18, href: '/tasks?activity=Sektoral' },
  { name: 'Administrasi BPS', color: 'bg-amber-500', count: 42, href: '/tasks?activity=Administrasi' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenQuickCapture }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container matching Image 1 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-100 bg-white dark:border-slate-800/60 dark:bg-slate-900 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* User Profile Header (Image 1 style) */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between rounded-2xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* User Avatar with online indicator */}
                <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-indigo-500/20 bg-linear-to-tr from-amber-400 via-orange-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  AA
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Ahmad Aulia
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Online
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition" />
          </div>
        </div>

        {/* Main Navigation (Image 1 style) */}
        <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onOpenQuickCapture();
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 transition group"
                >
                  <Icon className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition" />
                  <span>{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Section: My Projects (Image 1 style) */}
          <div className="pt-6 pb-2">
            <div className="flex items-center justify-between px-3.5 mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                My Projects
              </span>
              <button
                onClick={onOpenQuickCapture}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 transition"
              >
                <span>+ Add</span>
              </button>
            </div>

            <div className="space-y-1">
              {projectItems.map((proj) => (
                <Link
                  key={proj.name}
                  href={proj.href}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-xl px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${proj.color}`} />
                    <span className="truncate max-w-[130px]">{proj.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {proj.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom Sidebar (Image 1 style with purple promo card) */}
        <div className="p-4 space-y-3 border-t border-slate-100 dark:border-slate-800/60">
          <Link
            href="/resources"
            className="flex items-center gap-2.5 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Settings</span>
          </Link>

          {/* Purple Promo / Quick Card from Image 1 */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 p-4 text-white shadow-md shadow-indigo-600/15">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-100">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>MySpace</span>
            </div>
            <p className="mt-1 text-[11px] text-indigo-100/90 leading-snug">
              651 tugas & kalender tersinkronisasi otomatis dengan Cloud Supabase.
            </p>
            <button
              onClick={onOpenQuickCapture}
              className="mt-3 w-full rounded-xl bg-white py-1.5 text-center text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-50 transition"
            >
              + Quick Capture
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
