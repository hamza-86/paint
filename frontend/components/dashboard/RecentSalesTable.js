'use client';

import React from 'react';
import Link from 'next/link';

/**
 * RecentSalesTable
 * Displays the latest recorded paint shop sales.
 */
export default function RecentSalesTable({ sales = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="h-10 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const hasData = Array.isArray(sales) && sales.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Recent Sales Invoices
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest customer transactions recorded by painters
          </p>
        </div>
        <Link
          href="/admin/sales"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All &rarr;
        </Link>
      </div>

      {!hasData ? (
        <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-sm font-semibold text-slate-700">No Sales Recorded Yet</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Sales entered by painters or admins will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Painter</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 font-semibold text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sales.map((sale) => {
                const dateFormatted = new Date(sale.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                const painterName = sale.painter
                  ? `${sale.painter.firstName} ${sale.painter.lastName}`.trim()
                  : '—';

                return (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {dateFormatted}
                    </td>
                    <td className="py-3">
                      {sale.painter ? (
                        <Link
                          href={`/admin/painters/${sale.painter.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {painterName}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="text-xs">
                        <span className="font-medium text-slate-800">
                          {sale.customer?.name || 'Customer'}
                        </span>
                        {sale.customer?.mobile && (
                          <span className="text-slate-400 block">
                            {sale.customer.mobile}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        +{sale.totalPoints} pts
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
