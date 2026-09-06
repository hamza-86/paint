'use client';

import React from 'react';
import Link from 'next/link';

/**
 * CompanyRewardsSummary
 * Displays manufacturer reward program totals and company breakdown.
 */
export default function CompanyRewardsSummary({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-28 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  const totals = data?.totals || { totalEntries: 0, totalSaleValue: 0, totalQuantitySold: 0 };
  const byCompany = data?.byCompany || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Company Rewards & Procurement
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manufacturer incentive programs & physical stock sources
          </p>
        </div>
        <Link
          href="/admin/company-rewards"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View Entries &rarr;
        </Link>
      </div>

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Reward Entries
          </span>
          <span className="text-lg font-black text-slate-900">
            {totals.totalEntries} logs
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Turnover Logged
          </span>
          <span className="text-lg font-black text-emerald-700">
            ₹{totals.totalSaleValue.toLocaleString()}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Liters / Units Sold
          </span>
          <span className="text-lg font-black text-blue-700">
            {totals.totalQuantitySold.toLocaleString()} units
          </span>
        </div>
      </div>

      {/* Top Companies List */}
      {byCompany.length === 0 ? (
        <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          No company reward entries recorded yet.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {byCompany.slice(0, 5).map((comp) => (
            <div
              key={comp.companyId}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 block">
                  {comp.companyName}
                </span>
                <span className="text-[11px] text-slate-400">
                  {comp.entriesCount} entries • {comp.totalRewardItemsCount} gift types
                </span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-slate-900 block">
                  ₹{comp.totalSaleValue.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500">
                  {comp.totalQuantitySold} units
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
