'use client';

import React from 'react';
import Link from 'next/link';

export default function CycleCardList({ cycles, onActivateClick, onCloseClick }) {
  const formatDate = (d) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      }).format(date);
    } catch { return '—'; }
  };

  const getDuration = (start, end) => {
    if (!start || !end) return null;
    const days = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} days`;
    const months = Math.round(days / 30.44);
    return `~${months} months`;
  };

  const renderStatusBadge = (cycle) => {
    const status = cycle.computed_status || (cycle.isActive ? 'active' : 'inactive');
    const isPastEnd = new Date(cycle.endDate) <= new Date();

    if (cycle.isActive) {
      if (isPastEnd) {
        return (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Ended
          </span>
        );
      }
      return (
        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }

    if (status === 'upcoming') {
      return (
        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Upcoming
        </span>
      );
    }

    return (
      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {status === 'ended' ? 'Ended' : 'Closed'}
      </span>
    );
  };

  return (
    <div className="md:hidden space-y-3">
      {cycles.map((cycle) => {
        const isActive = cycle.isActive;
        const isPastEnd = new Date(cycle.endDate) <= new Date();
        const cycleId = cycle.id || cycle._id;

        return (
          <div key={cycleId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${isActive ? (isPastEnd ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse') : 'bg-slate-300'}`} />
                <div>
                  <Link href={`/admin/cycles/${cycleId}`} className="font-semibold text-slate-900 hover:text-blue-600 text-sm">
                    {formatDate(cycle.startDate)} → {formatDate(cycle.endDate)}
                  </Link>
                  <div className="text-xs text-slate-400 font-mono">{cycleId?.slice(0, 12)}…</div>
                </div>
              </div>
              {renderStatusBadge(cycle)}
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
              <Link href={`/admin/cycles/${cycleId}`} className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1">
                View Details
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
              <div className="flex items-center gap-2">
                {isActive ? (
                  <button
                    type="button"
                    onClick={() => onCloseClick(cycle)}
                    className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors cursor-pointer"
                  >
                    Close Cycle
                  </button>
                ) : isPastEnd ? (
                  <span className="px-2.5 py-1 text-xs font-medium text-slate-400 bg-slate-50 rounded-md border border-slate-200 cursor-not-allowed">
                    Ended
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onActivateClick(cycle)}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
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
