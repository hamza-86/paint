'use client';

import React from 'react';
import Link from 'next/link';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));
  } catch {
    return '—';
  }
};

export default function ActiveCycleBanner({ activeCycle, isLoading }) {
  if (isLoading) {
    return (
      <div className="h-14 bg-slate-100/80 rounded-2xl animate-pulse border border-slate-200/60" />
    );
  }

  if (!activeCycle) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              No Active Reward Cycle
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Sales cannot be recorded without an active reward cycle. Create or activate a cycle first.
            </p>
          </div>
        </div>
        <Link
          href="/admin/cycles"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs shrink-0"
        >
          Manage Cycles
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Current Reward Cycle
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
              ● Active
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">
            {formatDate(activeCycle.startDate)} → {formatDate(activeCycle.endDate)}
          </p>
        </div>
      </div>
      <div className="text-xs text-slate-500 flex items-center gap-2">
        <span>All sales will be credited under this cycle</span>
        <Link
          href="/admin/cycles"
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          View cycles →
        </Link>
      </div>
    </div>
  );
}
