'use client';

import { useState } from 'react';
import { usePainterPortalSales, usePainterPortalCycles } from '@/lib/hooks/usePainterPortal';

function formatINR(val) {
  if (typeof val !== 'number') return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(d);
  }
}

export default function PainterSalesPage() {
  const [page, setPage] = useState(1);
  const [cycleId, setCycleId] = useState('');

  const { data: cyclesRes } = usePainterPortalCycles();
  const cycles = cyclesRes?.data || [];

  const { data: salesRes, isLoading, isError, error } = usePainterPortalSales({
    page,
    limit: 10,
    cycleId: cycleId || undefined,
  });

  const sales = salesRes?.data?.sales || [];
  const pagination = salesRes?.data?.pagination;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Cycle Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📋</span>
            <span>My Sales History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Verified purchases credited to your account and points earned.
          </p>
        </div>

        {/* Cycle Filter Dropdown */}
        {cycles.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="cycleFilter" className="text-xs text-slate-400 font-medium">
              Cycle:
            </label>
            <select
              id="cycleFilter"
              value={cycleId}
              onChange={(e) => {
                setCycleId(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Cycles ({cycles.length})</option>
              {cycles.map((c) => (
                <option key={c.cycle.id} value={c.cycle.id}>
                  {c.isCurrentCycle ? '★ ' : ''}
                  {formatDate(c.cycle.startDate)} — {formatDate(c.cycle.endDate)}
                  {c.isCurrentCycle ? ' (Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl border border-slate-800"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-950/40 border border-rose-800/60 p-6 rounded-2xl text-center">
          <p className="text-rose-400 font-semibold mb-1">Failed to load sales</p>
          <p className="text-slate-400 text-sm">{error?.message || 'Please try again.'}</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center">
          <span className="text-4xl">🛒</span>
          <h2 className="text-base font-bold text-white mt-3">No sales found</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {cycleId
              ? 'No sales recorded in the selected cycle.'
              : 'You do not have any purchases credited to your account yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-md hover:border-slate-700/80 transition-colors space-y-4"
            >
              {/* Sale Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                    {formatDate(sale.date)}
                  </span>
                  {sale.customer?.name && (
                    <span className="text-xs text-slate-400">
                      Customer: <strong className="text-slate-200">{sale.customer.name}</strong>
                    </span>
                  )}
                  {sale.cycle && (
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      • {formatDate(sale.cycle.startDate)} to {formatDate(sale.cycle.endDate)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-xs font-extrabold">
                    +{sale.totalPoints} pts
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {formatINR(sale.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Line Items Breakdown */}
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Purchased Items ({sale.lineItems?.length || 0})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sale.lineItems?.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/50 border border-slate-700/40 px-3 py-2 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-200">{item.itemName}</span>
                        <span className="text-slate-400 ml-1.5 font-normal">
                          × {item.quantity} ({formatINR(item.pricePerUnit)}/ea)
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-indigo-400 font-bold">+{item.pointsEarned} pts</span>
                        <span className="text-slate-400 ml-2">{formatINR(item.lineTotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-900 text-xs text-slate-400">
              <span>
                Showing page <strong className="text-white">{pagination.page}</strong> of{' '}
                <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} sales)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
