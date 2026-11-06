'use client';

import React, { useState } from 'react';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickCaptureModal } from '@/components/ui/QuickCaptureModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);

  return (
    <html lang="id">
      <head>
        <title>MySpace — Personal Dashboard</title>
        <meta
          name="description"
          content="Integrated Personal Productivity System: To-Do List, Sticky Notes, Calendar, Media Storage & Docs"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 min-h-screen">
        <div className="flex min-h-screen">
          {/* Responsive Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onOpenQuickCapture={() => setQuickCaptureOpen(true)}
          />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col pb-20 lg:pb-0 min-w-0">
            <Navbar
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              onOpenQuickCapture={() => setQuickCaptureOpen(true)}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
          </div>
        </div>

        {/* Global Quick Capture Modal */}
        <QuickCaptureModal
          isOpen={quickCaptureOpen}
          onClose={() => setQuickCaptureOpen(false)}
          onSuccess={() => {
            // Dispatch custom event to notify active view to re-fetch
            window.dispatchEvent(new CustomEvent('data-updated'));
          }}
        />
      </body>
    </html>
  );
}

