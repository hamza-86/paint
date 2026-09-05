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

export default function SaleCardList({ sales = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="space-y-3 md:hidden">
        {[1, 2, 3].map((n) => (
          <div key={n} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3 animate-pulse">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-slate-200 rounded-md" />
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="h-4 w-36 bg-slate-100 rounded-md" />
            <div className="h-4 w-28 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (!sales || sales.length === 0) return null;

  return (
    <div className="space-y-3 md:hidden">
      {sales.map((sale) => {
        const lineCount = sale.lineItems?.length || 0;

        return (
          <div
            key={sale.id}
            className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  {formatDate(sale.date)}
                </span>
                <div className="text-[11px] text-slate-400 font-mono">
                  #{sale.id.slice(-6).toUpperCase()}
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                +{(sale.totalPoints || 0)} pts
              </span>
            </div>

            {/* Customer & Painter */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-50">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Customer
                </span>
                <p className="font-semibold text-slate-800 truncate">
                  {sale.customer?.name || '—'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {sale.customer?.mobile || ''}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Painter
                </span>
                <p className="font-semibold text-slate-800 truncate">
                  {sale.painter?.firstName || '—'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {sale.painter?.mobile || ''}
                </p>
              </div>
            </div>

            {/* Total & Action */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  {lineCount} {lineCount === 1 ? 'Item' : 'Items'}
                </span>
                <p className="text-sm font-bold text-slate-900">
                  ₹{(sale.totalAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <Link
                href={`/admin/sales/${sale.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                <span>View Invoice</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
