'use client';

import React from 'react';
import Link from 'next/link';

export default function CycleCardList({ cycles, onActivateClick, onCloseClick }) {
  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
    } catch { return '—'; }
  };

  const getDuration = (start, end) => {
    if (!start || !end) return null;
    const days = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} days`;
    const months = Math.round(days / 30.44);
    return `~${months} months`;
  };

  return (
    <div className="md:hidden space-y-3">
      {cycles.map((cycle) => {
        const isActive = cycle.isActive;
        return (
          <div key={cycle.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <div>
                  <Link href={`/admin/cycles/${cycle.id}`} className="font-semibold text-slate-900 hover:text-blue-600 text-sm">
                    {formatDate(cycle.startDate)} → {formatDate(cycle.endDate)}
                  </Link>
                  <div className="text-xs text-slate-400 font-mono">{cycle.id?.slice(0, 12)}…</div>
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isActive ? 'Active' : 'Closed'}
              </span>
            </div>

            {/* Duration and Created */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block">Duration</span>
                <span className="font-semibold text-slate-800">{getDuration(cycle.startDate, cycle.endDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Created</span>
                <span className="font-semibold text-slate-800">{formatDate(cycle.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link href={`/admin/cycles/${cycle.id}`} className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1">
                View Details
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
              <div className="flex items-center gap-2">
                {isActive ? (
                  <button
                    type="button"
                    onClick={() => onCloseClick(cycle)}
                    className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors"
                  >
                    Close Cycle
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onActivateClick(cycle)}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
