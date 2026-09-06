'use client';

import React from 'react';
import Link from 'next/link';

/**
 * RecentRewardsTable
 * Displays the latest physical rewards assigned to painters.
 */
export default function RecentRewardsTable({ rewards = [], isLoading }) {
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

  const hasData = Array.isArray(rewards) && rewards.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Recent Reward Assignments
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical items issued to eligible painters
          </p>
        </div>
        <Link
          href="/admin/rewards/assign"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Assign Reward &rarr;
        </Link>
      </div>

      {!hasData ? (
        <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-sm font-semibold text-slate-700">No Rewards Assigned Yet</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Gifts assigned to painters will be tracked here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Painter</th>
                <th className="pb-3 font-semibold">Reward</th>
                <th className="pb-3 font-semibold text-center">Qty</th>
                <th className="pb-3 font-semibold text-right">Points at Award</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rewards.map((r) => {
                const dateFormatted = new Date(r.assignedAt || r.createdAt).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric' }
                );

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {dateFormatted}
                    </td>
                    <td className="py-3">
                      {r.painterId ? (
                        <Link
                          href={`/admin/painters/${r.painterId}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {r.painterName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-slate-900">{r.painterName}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {r.rewardImageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.rewardImageUrl}
                            alt={r.rewardName}
                            className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <span className="font-medium text-slate-800">{r.rewardName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-900">
                      {r.qty}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {r.pointsAtAssignment} pts
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
