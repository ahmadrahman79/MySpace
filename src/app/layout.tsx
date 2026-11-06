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
  // sidebarOpen: true by default on desktop, can be hidden/toggled anytime
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);

  return (
    <html lang="id">
      <head>
        <title>MySpace — Personal Productivity Dashboard</title>
        <meta
          name="description"
          content="Integrated Personal Productivity System: To-Do List, Sticky Notes, Calendar, Media Storage & Docs"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="bg-[#fbfbfe] text-slate-900 antialiased dark:bg-[#0c0e17] dark:text-slate-100 min-h-screen">
        <div className="flex min-h-screen">
          {/* Responsive & Collapsible Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onToggleCollapse={() => setSidebarOpen((prev) => !prev)}
            onOpenQuickCapture={() => setQuickCaptureOpen(true)}
          />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col pb-20 lg:pb-0 min-w-0 transition-all duration-300">
            <Navbar
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              onOpenQuickCapture={() => setQuickCaptureOpen(true)}
            />

            <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
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
        />
      </body>
    </html>
  );
}
