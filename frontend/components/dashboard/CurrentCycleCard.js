'use client';

import React from 'react';
import Link from 'next/link';

/**
 * CurrentCycleCard
 * Real-time operational card detailing the active reward cycle.
 */
export default function CurrentCycleCard({ currentCycle, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
        <div className="h-8 bg-slate-200 rounded w-1/2 mb-6" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!currentCycle) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-amber-300 p-6 sm:p-7 shadow-sm bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-1">
                Cycle Inactive
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Active Reward Cycle
              </h3>
              <p className="text-sm text-slate-600 max-w-xl mt-0.5">
                Painters cannot accumulate cycle points or be assigned tier rewards until a cycle is created and activated.
              </p>
            </div>
          </div>

          <Link
            href="/admin/cycles"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-sm shadow-sm transition-all shrink-0"
          >
            <span>Manage Cycles</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  const startDateFormatted = new Date(currentCycle.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endDateFormatted = new Date(currentCycle.endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Commission Period
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {startDateFormatted} — {endDateFormatted}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            All paint sales logged in this timeframe contribute towards tier progression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Remaining
            </span>
            <span className="text-2xl font-black text-slate-900">
              {currentCycle.daysRemaining} <span className="text-xs font-semibold text-slate-500">days</span>
            </span>
          </div>
          <Link
            href="/admin/cycles"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Cycle Settings"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Cycle Invoices
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {currentCycle.totalSales}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Approved sales transactions
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Cycle Gross Sales
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            ₹{currentCycle.totalSalesValue.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Paint purchase turnover
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Points Earned
          </span>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {currentCycle.totalPoints.toLocaleString()} pts
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Accrued across all painters
          </span>
        </div>
      </div>
    </div>
  );
}
