'use client';

import React from 'react';
import Link from 'next/link';

export default function ItemCardList({ items, onEditClick, onStatusClick }) {
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '—';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(val);
    } catch {
      return `₹${val}`;
    }
  };

  return (
    <div className="md:hidden space-y-3">
      {items.map((item) => {
        const isActive = item.status === 'active';

        return (
          <div
            key={item.id}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
          >
            {/* Top row: Image, Name, and Status */}
            <div className="flex items-start gap-3">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 ${
                  item.imageUrl ? 'hidden' : ''
                }`}
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <line x1="12" x2="12" y1="2" y2="12" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/items/${item.id}`}
                    className="font-semibold text-slate-900 text-base hover:text-blue-600 truncate block"
                  >
                    {item.name}
                  </Link>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
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
                <div className="text-xs text-slate-500 mt-0.5">
                  {item.brand ? (
                    <span className="font-medium text-slate-700">{item.brand}</span>
                  ) : (
                    'Generic'
                  )}
                  {item.category && <span> • {item.category}</span>}
                </div>
              </div>
            </div>

            {/* Middle Row: Price & Points per unit */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Unit Price</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {formatCurrency(item.price)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Painter Reward</span>
                <div className="inline-flex items-center gap-1 text-amber-800 font-semibold">
                  <svg
                    className="w-3.5 h-3.5 text-amber-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {item.points} pts / unit
                </div>
              </div>
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <Link
                href={`/admin/items/${item.id}`}
                className="font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1"
              >
                View Details
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEditClick(item)}
                  className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                >
                  Edit
                </button>

                {isActive ? (
                  <button
                    type="button"
                    onClick={() => onStatusClick(item, 'deactivate')}
                    className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStatusClick(item, 'activate')}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                  >
                    Reactivate
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
