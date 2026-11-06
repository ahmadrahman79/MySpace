'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, StickyNote, CalendarDays, FileText, UploadCloud } from 'lucide-react';

const mobileNavItems = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/sticky', label: 'Sticky', icon: StickyNote },
  { href: '/calendar', label: 'Kalender', icon: CalendarDays },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/resources', label: 'Media', icon: UploadCloud },
];

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/90 px-2 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 px-2 py-1 text-[11px] font-medium transition ${
              isActive
                ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

