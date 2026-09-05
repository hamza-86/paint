'use client';

import React from 'react';
import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { usePainters } from '@/lib/hooks/usePainters';

export default function AdminDashboardPage() {
  const { data: user, isLoading } = useCurrentUser();
  const { data: paintersData, isLoading: isPaintersLoading } = usePainters({
    page: 1,
    limit: 1,
  });

  const counts = paintersData?.counts;
  const totalPainters = counts ? counts.total : '—';
  const activePainters = counts ? counts.active : '—';

  const greetingName = user?.email
    ? user.email.split('@')[0]
    : 'Admin';

  return (
    <div className="space-y-8">
      {/* ── 1. Welcome Banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Paint Shop Management Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Welcome back{isLoading ? '...' : `, ${greetingName}`}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Manage your painters, sales, points and rewards from one central place.
            View real-time shop performance and configure commission cycles.
          </p>
        </div>

        {/* Decorative background visual */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ── 2. Stat Cards (Honest Placeholders — No Fake Numbers) ────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Shop Overview & Metrics
          </h2>
          <span className="text-xs text-slate-400">
            Awaiting active cycle data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Painters */}
          <StatCard
            title="Total Painters"
            value={isPaintersLoading ? '...' : totalPainters}
            subtitle={
              counts && counts.total > 0
                ? `${counts.total} registered in platform`
                : 'No painters registered yet'
            }
            badge="Registry"
            accent="blue"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />

          {/* Active Painters */}
          <StatCard
            title="Active Painters"
            value={isPaintersLoading ? '...' : activePainters}
            subtitle={
              counts && counts.active > 0
                ? `${counts.active} active & earning points`
                : '0 active in current period'
            }
            badge="Activity"
            accent="emerald"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />

          {/* Current Cycle Points */}
          <StatCard
            title="Cycle Points"
            value="—"
            subtitle="Cycle not started"
            badge="Points"
            accent="amber"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            }
          />

          {/* Total Sales */}
          <StatCard
            title="Total Sales"
            value="—"
            subtitle="No sales recorded yet"
            badge="Revenue"
            accent="purple"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── 3. Quick Actions ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/painters"
            className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  Add Painter
                </h3>
                <p className="text-xs text-slate-400">Register new painter</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Painters &rarr;
            </span>
          </Link>

          <Link
            href="/admin/items"
            className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <line x1="12" x2="12" y1="12" y2="22" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Add Item
                </h3>
                <p className="text-xs text-slate-400">Paint catalog & points</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Catalog &rarr;
            </span>
          </Link>

          <Link
            href="/admin/sales"
            className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" x2="12" y1="18" y2="12" />
                  <line x1="9" x2="15" y1="15" y2="15" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                  Record Sale
                </h3>
                <p className="text-xs text-slate-400">Award painter points</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Sales &rarr;
            </span>
          </Link>

          <Link
            href="/admin/rewards"
            className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="14" x="3" y="8" rx="2" />
                  <path d="M12 5a3 3 0 1 0-3 3" />
                  <path d="M12 5a3 3 0 1 1 3 3" />
                  <path d="M3 12h18" />
                  <path d="M12 8v14" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                  Add Reward
                </h3>
                <p className="text-xs text-slate-400">Inventory & tiers</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Rewards &rarr;
            </span>
          </Link>
        </div>
      </section>

      {/* ── 4. Two-Column Dashboard Content ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Reward Cycle (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="font-bold text-base text-slate-900">
                Current Reward Cycle
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Inactive
              </span>
            </div>

            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Period Name:</span>
                <span className="font-medium text-slate-400">None Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Start Date:</span>
                <span className="font-medium text-slate-400">—</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">End Date:</span>
                <span className="font-medium text-slate-400">—</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Status:</span>
                <span className="font-medium text-amber-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Awaiting setup
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 leading-relaxed">
              Create a reward cycle to define the period during which painter sales accrue points for rewards.
            </p>
          </div>

          <Link
            href="/admin/cycles"
            className="mt-6 w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center transition-colors shadow-xs"
          >
            Configure Cycles &rarr;
          </Link>
        </div>

        {/* Recent Activity (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="font-bold text-base text-slate-900">
                Recent Activity
              </h2>
              <span className="text-xs text-slate-400">Live feed</span>
            </div>

            {/* Empty State for Recent Activity */}
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                No recent activity yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Sales records, painter registrations, points allocation, and reward disbursements will automatically populate here.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Audit log ready</span>
            <Link
              href="/admin/sales"
              className="text-blue-600 hover:underline font-semibold"
            >
              View Sales History &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
