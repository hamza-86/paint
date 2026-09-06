'use client';

import React from 'react';
import Link from 'next/link';

/**
 * InventorySummaryCard
 * Displays physical reward inventory health & low-stock warnings.
 */
export default function InventorySummaryCard({ inventory, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-24 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  const totalQty = inventory?.totalQty || 0;
  const remainingQty = inventory?.remainingQty || 0;
  const assignedQty = inventory?.assignedQty || 0;
  const lowStockItems = inventory?.lowStockItems || [];

  const assignedPct = totalQty > 0 ? Math.round((assignedQty / totalQty) * 100) : 0;
  const remainingPct = totalQty > 0 ? 100 - assignedPct : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Reward Inventory Health
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Stock levels across physical gifts
            </p>
          </div>
          <Link
            href="/admin/reward-inventory"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Manage Inventory &rarr;
          </Link>
        </div>

        {/* Stock Distribution Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-emerald-700">Available: {remainingQty} pcs ({remainingPct}%)</span>
            <span className="text-purple-700">Assigned: {assignedQty} pcs ({assignedPct}%)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-purple-100 overflow-hidden flex">
            <div
              style={{ width: `${remainingPct}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Available: ${remainingQty}`}
            />
            <div
              style={{ width: `${assignedPct}%` }}
              className="bg-purple-500 h-full transition-all duration-500"
              title={`Assigned: ${assignedQty}`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>{inventory?.activeItems || 0} active catalog items</span>
            <span>Total received: {totalQty} pcs</span>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Low Stock Watchlist ({lowStockItems.length})
        </h4>

        {lowStockItems.length === 0 ? (
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            ✅ All active items have healthy stock levels (&gt; 2 units).
          </p>
        ) : (
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {lowStockItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-200/60 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <span className="font-semibold text-slate-800 truncate">
                    {item.name}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                    item.remainingQty === 0
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {item.remainingQty === 0 ? 'Out of Stock' : `${item.remainingQty} left`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
