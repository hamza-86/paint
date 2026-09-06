'use client';

import React from 'react';
import Link from 'next/link';

/**
 * TopPaintersCard
 * Real-time painter leaderboard for the active cycle.
 */
export default function TopPaintersCard({ painters = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasData = Array.isArray(painters) && painters.length > 0;

  const rankBadges = {
    1: 'bg-amber-100 text-amber-800 border-amber-300 font-black',
    2: 'bg-slate-200 text-slate-800 border-slate-300 font-black',
    3: 'bg-amber-700/20 text-amber-900 border-amber-700/30 font-black',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Top Performing Painters
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Leaderboard for active cycle
          </p>
        </div>
        <Link
          href="/admin/painters"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All &rarr;
        </Link>
      </div>

      {!hasData ? (
        <div className="h-52 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">No Sales Recorded</p>
          <p className="text-xs text-slate-400 max-w-xs mt-0.5">
            Leaderboard will populate as painters earn points from sales.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {painters.map((p) => {
            const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Painter';
            const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase() || 'P';

            return (
              <div
                key={p.painterId}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank indicator */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                      rankBadges[p.rank] || 'bg-slate-50 text-slate-600 border-slate-200 font-semibold'
                    }`}
                  >
                    {p.rank}
                  </span>

                  {/* Avatar */}
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photoUrl}
                      alt={fullName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <Link
                      href={`/admin/painters/${p.painterId}`}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 truncate block transition-colors"
                    >
                      {fullName}
                    </Link>
                    <span className="text-xs text-slate-400">
                      {p.salesCount} {p.salesCount === 1 ? 'sale' : 'sales'} • ₹{p.salesValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Points badge */}
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                    {p.points} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
