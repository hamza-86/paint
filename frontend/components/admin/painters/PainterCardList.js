'use client';

import React from 'react';
import Link from 'next/link';

export default function PainterCardList({ painters, onStatusClick }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return '—';
    }
  };

  return (
    <div className="md:hidden space-y-3">
      {painters.map((painter) => {
        const isActive = painter.status === 'active';

        return (
          <div
            key={painter.id}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
          >
            {/* Top row: Avatar, Name, and Status */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {painter.photoUrl ? (
                  <img
                    src={painter.photoUrl}
                    alt={painter.firstName}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                    {painter.firstName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {painter.firstName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID: {painter.id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                {isActive ? 'Active' : 'Deactivated'}
              </span>
            </div>

            {/* Middle: Details */}
            <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 text-slate-400 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="font-medium text-slate-800">{painter.mobile}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 text-slate-400 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="truncate">{painter.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>
                <span>Joined {formatDate(painter.createdAt)}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Link
                href={`/admin/painters/${painter.id}`}
                className="flex-1 py-2 text-xs font-semibold text-center text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                View Profile
              </Link>
              <button
                type="button"
                onClick={() =>
                  onStatusClick(painter, isActive ? 'deactivate' : 'activate')
                }
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                  isActive
                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200/60'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200/60'
                }`}
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
