'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, FileText, StickyNote, CalendarDays } from 'lucide-react';

const mobileNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/notes', label: 'Note', icon: FileText },
  { href: '/sticky', label: 'Sticky', icon: StickyNote },
  { href: '/calendar', label: 'Kalender', icon: CalendarDays },
];

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 px-2 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-1 text-[11px] font-medium transition ${
              isActive
                ? 'font-bold text-indigo-600 dark:text-indigo-400'
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
