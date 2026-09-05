'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/auth';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

const BREADCRUMB_MAP = {
  '/admin': 'Dashboard Overview',
  '/admin/painters': 'Painters Management',
  '/admin/items': 'Catalog Items',
  '/admin/sales': 'Sales & Points Tracking',
  '/admin/rewards': 'Rewards & Inventory',
  '/admin/companies': 'Partner Companies',
  '/admin/cycles': 'Reward Cycles',
  '/admin/settings': 'Shop Settings',
};

export default function AdminHeader({ onOpenMobileMenu }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // TanStack Query hook to read current user from /api/auth/me
  const { data: user, isLoading } = useCurrentUser();

  const currentTitle =
    BREADCRUMB_MAP[pathname] ||
    (pathname.startsWith('/admin/')
      ? pathname.replace('/admin/', '').charAt(0).toUpperCase() +
        pathname.replace('/admin/', '').slice(1)
      : 'Admin Dashboard');

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logoutUser(router);
  };

  const adminEmail = user?.email || (isLoading ? 'Loading...' : 'Shop Admin');
  const avatarInitial = user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'A';

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left Side: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Open mobile navigation"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
              Admin
            </span>
            <span className="hidden sm:inline-block text-slate-300 text-xs">
              /
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {currentTitle}
            </h2>
          </div>
        </div>

        {/* Right Side: Admin Profile Badge & Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* User Profile Info */}
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-600 to-amber-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
              {avatarInitial}
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight max-w-[180px] truncate">
                {adminEmail}
              </span>
              <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
                Shop Owner
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Logout Button */}
          <button
            id="admin-logout-btn"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
            aria-label="Sign out of admin session"
          >
            {loggingOut ? (
              <span className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-slate-500 group-hover:text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            )}
            <span className="hidden sm:inline">
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
