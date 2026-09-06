'use client';

import { useState } from 'react';
import { usePainterPortalRewards, usePainterPortalCycles } from '@/lib/hooks/usePainterPortal';

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

export default function PainterRewardsPage() {
  const [page, setPage] = useState(1);
  const [cycleId, setCycleId] = useState('');

  const { data: cyclesRes } = usePainterPortalCycles();
  const cycles = cyclesRes?.data || [];

  const { data: rewardsRes, isLoading, isError, error } = usePainterPortalRewards({
    page,
    limit: 12,
    cycleId: cycleId || undefined,
  });

  const rewards = rewardsRes?.data?.rewards || [];
  const pagination = rewardsRes?.data?.pagination;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🎁</span>
            <span>Rewards Received</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Physical reward items actually distributed and delivered to you by the paint shop.
          </p>
        </div>

        {/* Cycle Filter */}
        {cycles.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="rewardCycleFilter" className="text-xs text-slate-400 font-medium">
              Cycle:
            </label>
            <select
              id="rewardCycleFilter"
              value={cycleId}
              onChange={(e) => {
                setCycleId(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Cycles</option>
              {cycles.map((c) => (
                <option key={c.cycle.id} value={c.cycle.id}>
                  {c.isCurrentCycle ? '★ ' : ''}
                  {formatDate(c.cycle.startDate)} — {formatDate(c.cycle.endDate)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Suggested vs Actual Distinction Notice */}
      <div className="bg-indigo-950/40 border border-indigo-800/40 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
        <span className="text-lg leading-none">💡</span>
        <div>
          <strong className="text-indigo-300">Actual Rewards vs Suggested Tiers:</strong>
          <span className="ml-1 text-slate-400">
            Tiers represent your target threshold based on points. The items below represent the{' '}
            <strong className="text-white">physical rewards actually handed over or assigned</strong> to you by the shop owner.
          </span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-slate-900 rounded-3xl border border-slate-800"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-950/40 border border-rose-800/60 p-6 rounded-2xl text-center">
          <p className="text-rose-400 font-semibold mb-1">Failed to load rewards</p>
          <p className="text-slate-400 text-sm">{error?.message || 'Please try again.'}</p>
        </div>
      ) : rewards.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center">
          <span className="text-4xl">🎁</span>
          <h2 className="text-base font-bold text-white mt-3">No rewards received yet</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {cycleId
              ? 'No rewards assigned in the selected cycle.'
              : 'Keep earning points from purchases to qualify for reward assignments from the shop.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-4">
                  {reward.imageUrl ? (
                    <img
                      src={reward.imageUrl}
                      alt={reward.rewardName}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-700/80 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-indigo-600/20 border border-amber-500/30 flex items-center justify-center text-3xl flex-shrink-0">
                      🎁
                    </div>
                  )}

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                        Delivered
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(reward.date)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white truncate" title={reward.rewardName}>
                      {reward.rewardName}
                    </h3>

                    <p className="text-xs text-slate-300">
                      Quantity Received: <strong className="text-white">{reward.qty} unit{reward.qty > 1 ? 's' : ''}</strong>
                    </p>

                    {reward.cycle && (
                      <p className="text-[11px] text-slate-400">
                        Cycle: {formatDate(reward.cycle.startDate)} — {formatDate(reward.cycle.endDate)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footnote: Points snapshot & notes */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-1 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>
                      Points at Assignment:{' '}
                      <strong className="text-indigo-400 font-semibold">{reward.pointsAtAssignment} pts</strong>
                    </span>
                    {reward.suggestedTierName && (
                      <span className="text-slate-400">
                        Tier: <span className="text-slate-200 font-medium">{reward.suggestedTierName}</span>
                      </span>
                    )}
                  </div>
                  {reward.notes && (
                    <p className="text-slate-400 italic mt-0.5">
                      Notes: {reward.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-900 text-xs text-slate-400">
              <span>
                Showing page <strong className="text-white">{pagination.page}</strong> of{' '}
                <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} rewards)
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
