'use client';

import React, { useState } from 'react';

/**
 * SalesTrendChart
 * Responsive SVG chart showing daily sales trend for the active cycle.
 */
export default function SalesTrendChart({ trend = [], isLoading }) {
  const [metric, setMetric] = useState('totalAmount'); // 'totalAmount' | 'salesCount' | 'totalPoints'
  const [hoveredBar, setHoveredBar] = useState(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  const hasData = Array.isArray(trend) && trend.length > 0;

  // Compute scale max
  const maxValue = hasData
    ? Math.max(...trend.map((d) => d[metric] || 0), 1)
    : 1;

  const metricLabel = {
    totalAmount: 'Sales Value (₹)',
    salesCount: 'Sales Count',
    totalPoints: 'Points Earned',
  }[metric];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Sales Performance Trend
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily activity in current cycle
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('totalAmount')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              metric === 'totalAmount'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue (₹)
          </button>
          <button
            type="button"
            onClick={() => setMetric('salesCount')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              metric === 'salesCount'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Count
          </button>
          <button
            type="button"
            onClick={() => setMetric('totalPoints')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              metric === 'totalPoints'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Points
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="h-52 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">No Sales Data Yet</p>
          <p className="text-xs text-slate-400 max-w-xs mt-0.5">
            Daily trends will appear here once sales are logged in this cycle.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Active tooltip */}
          <div className="h-6 mb-2">
            {hoveredBar ? (
              <div className="text-xs text-slate-700 flex items-center gap-3">
                <span className="font-bold text-slate-900">{hoveredBar.date}:</span>
                <span className="text-emerald-700 font-semibold">₹{hoveredBar.totalAmount.toLocaleString()}</span>
                <span className="text-slate-500">• {hoveredBar.salesCount} sales</span>
                <span className="text-amber-600 font-semibold">• {hoveredBar.totalPoints} pts</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Hover over bars to inspect daily metrics ({metricLabel})
              </span>
            )}
          </div>

          {/* SVG Bars Container */}
          <div className="h-44 flex items-end gap-2 pt-4 border-b border-slate-200 pb-1">
            {trend.map((item, idx) => {
              const val = item[metric] || 0;
              const heightPct = Math.max(8, Math.round((val / maxValue) * 100));

              return (
                <div
                  key={item.date || idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredBar(item)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div className="w-full max-w-[40px] flex flex-col items-center justify-end h-full">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        metric === 'totalAmount'
                          ? 'bg-emerald-500 group-hover:bg-emerald-600'
                          : metric === 'salesCount'
                          ? 'bg-blue-500 group-hover:bg-blue-600'
                          : 'bg-amber-500 group-hover:bg-amber-600'
                      } ${hoveredBar?.date === item.date ? 'ring-2 ring-slate-900/20' : ''}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center mt-1">
                    {item.date?.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
