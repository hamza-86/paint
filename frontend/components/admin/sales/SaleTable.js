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

export default function SaleTable({ sales = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="h-4 w-32 bg-slate-200 rounded-md animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-4 w-28 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-3 w-40 bg-slate-100 rounded-md animate-pulse" />
              </div>
              <div className="h-4 w-24 bg-slate-100 rounded-md animate-pulse" />
              <div className="h-4 w-20 bg-slate-100 rounded-md animate-pulse" />
              <div className="h-6 w-16 bg-slate-100 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sales || sales.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3.5">Date & Invoice</th>
              <th className="px-5 py-3.5">Painter</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Items Summary</th>
              <th className="px-5 py-3.5 text-right">Amount</th>
              <th className="px-5 py-3.5 text-right">Points</th>
              <th className="px-5 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {sales.map((sale) => {
              const lineCount = sale.lineItems?.length || 0;
              const itemNames = (sale.lineItems || [])
                .map((li) => li.itemName || li.item?.name || 'Item')
                .slice(0, 2)
                .join(', ');
              const remainingCount = lineCount > 2 ? ` +${lineCount - 2} more` : '';

              return (
                <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Date & Ref */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">
                      {formatDate(sale.date)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      #{sale.id.slice(-6).toUpperCase()}
                    </div>
                  </td>

                  {/* Painter */}
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-800">
                      {sale.painter?.firstName || '—'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {sale.painter?.mobile || '—'}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-800">
                      {sale.customer?.name || '—'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {sale.customer?.mobile || '—'}
                    </div>
                  </td>

                  {/* Items summary */}
                  <td className="px-5 py-3.5 max-w-[220px]">
                    <div className="truncate text-slate-700 font-medium">
                      {itemNames || '—'}
                      {remainingCount && (
                        <span className="text-slate-400 font-normal">{remainingCount}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {lineCount} {lineCount === 1 ? 'item' : 'items'}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                    ₹{(sale.totalAmount || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Points */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      +{(sale.totalPoints || 0)} pts
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-center">
                    <Link
                      href={`/admin/sales/${sale.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <span>View</span>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
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
