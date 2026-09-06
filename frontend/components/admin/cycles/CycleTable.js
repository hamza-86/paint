'use client';

import React from 'react';
import Link from 'next/link';

export default function CycleTable({ cycles, onActivateClick, onCloseClick }) {
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
    if (days < 30) return `${days}d`;
    const months = Math.round(days / 30.44);
    return `~${months}mo`;
  };

  const renderStatusBadge = (cycle) => {
    const status = cycle.computed_status || (cycle.isActive ? 'active' : 'inactive');
    const isPastEnd = new Date(cycle.endDate) <= new Date();

    if (cycle.isActive) {
      if (isPastEnd) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Ended (Needs Close)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }

    if (status === 'upcoming') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Upcoming
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {status === 'ended' ? 'Ended' : 'Closed'}
      </span>
    );
  };

  return (
    <div className="hidden md:block overflow-hidden bg-white rounded-xl border border-slate-200 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3">Cycle Period</th>
              <th scope="col" className="px-3 py-3.5">Duration</th>
              <th scope="col" className="px-3 py-3.5">Status</th>
              <th scope="col" className="px-3 py-3.5">Created</th>
              <th scope="col" className="py-3.5 pl-3 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cycles.map((cycle) => {
              const isActive = cycle.isActive;
              const isPastEnd = new Date(cycle.endDate) <= new Date();

              return (
                <tr key={cycle.id || cycle._id} className="hover:bg-slate-50/60 transition-colors group">
                  {/* Period */}
                  <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? (isPastEnd ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse') : 'bg-slate-300'}`} />
                      <div>
                        <Link href={`/admin/cycles/${cycle.id || cycle._id}`} className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                          {formatDate(cycle.startDate)} → {formatDate(cycle.endDate)}
                        </Link>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{(cycle.id || cycle._id)?.slice(0, 12)}…</div>
                      </div>
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                      {getDuration(cycle.startDate, cycle.endDate)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    {renderStatusBadge(cycle)}
                  </td>

                  {/* Created */}
                  <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-500">
                    {formatDate(cycle.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/cycles/${cycle.id || cycle._id}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="View cycle details"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>

                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => onCloseClick(cycle)}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-md border border-amber-200 transition-colors cursor-pointer"
                        >
                          Close Cycle
                        </button>
                      ) : isPastEnd ? (
                        <span
                          title="Cannot activate a cycle whose end date has passed"
                          className="px-2.5 py-1 text-xs font-medium text-slate-400 bg-slate-50 rounded-md border border-slate-200 cursor-not-allowed"
                        >
                          Ended
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onActivateClick(cycle)}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
