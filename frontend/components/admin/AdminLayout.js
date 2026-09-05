'use client';

import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

/**
 * AdminLayout — Shell Wrapper for all /admin routes.
 * Handles sidebar visibility, responsive layout canvas, and top header.
 */
export default function AdminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex">
      {/* Sidebar (Fixed Desktop + Slide-over Mobile) */}
      <AdminSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar width on md+) */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <AdminHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="py-4 px-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
          <p>
            Paint Shop Painter Management Platform &bull; Single Shop Edition &copy;{' '}
            {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}
