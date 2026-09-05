'use client';

import React from 'react';
import PageHeader from '@/components/admin/PageHeader';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function AdminSettingsPage() {
  const { data: user, isLoading } = useCurrentUser();

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Shop owner profile, session security, and single-store configuration."
        badge="System Config"
      />

      {/* ── Section 1: Account Settings ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="border-b border-slate-100 pb-4 mb-5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Shop Owner Account
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin credentials used to authenticate and manage this paint shop.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Email Address
              </label>
              <input
                type="email"
                readOnly
                value={user?.email || (isLoading ? 'Loading…' : 'admin@paintshop.com')}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium cursor-not-allowed outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Single admin account for store owner.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role Permission
              </label>
              <input
                type="text"
                readOnly
                value="Admin (Full Access)"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium cursor-not-allowed outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Unrestricted owner access across all modules.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Change Password (Placeholder)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  disabled
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-100/60 text-slate-400 text-sm cursor-not-allowed outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  disabled
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-100/60 text-slate-400 text-sm cursor-not-allowed outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                Password updates will be connected to the backend in a future maintenance update.
              </span>
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Security & Session ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="border-b border-slate-100 pb-4 mb-5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Security & Authentication Architecture
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active security policies protecting shop data and painter accounts.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="font-semibold text-slate-800">Token Strategy</span>
              <p className="text-xs text-slate-500">
                Stateless JSON Web Tokens signed with HMAC-SHA256
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="font-semibold text-slate-800">Cookie Security</span>
              <p className="text-xs text-slate-500">
                HttpOnly & SameSite flags prevent cross-site scripting exposure
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              HttpOnly Cookie
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-semibold text-slate-800">Session Duration</span>
              <p className="text-xs text-slate-500">
                Default expiry for shop owner and painter tokens
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              24 Hours (1 Day)
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 3: Shop Information ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="border-b border-slate-100 pb-4 mb-5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Shop Architecture
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deployment and architecture parameters for this single-business installation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block mb-1">Architecture</span>
            <span className="font-bold text-slate-900 text-sm">
              Single-Store Mode
            </span>
            <span className="text-slate-500 block mt-1">No multi-tenant overhead</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block mb-1">Frontend Layer</span>
            <span className="font-bold text-slate-900 text-sm">
              Next.js 16 App Router
            </span>
            <span className="text-slate-500 block mt-1">Vercel edge deployment</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block mb-1">Backend REST API</span>
            <span className="font-bold text-slate-900 text-sm">
              Node.js + Express
            </span>
            <span className="text-slate-500 block mt-1">Render API service</span>
          </div>
        </div>
      </div>
    </div>
  );
}
