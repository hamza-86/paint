'use client';

import { usePainterPortalEligibility } from '@/lib/hooks/usePainterPortal';

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

export default function PainterPointsPage() {
  const { data: eligRes, isLoading, isError, error } = usePainterPortalEligibility();
  const data = eligRes?.data;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-lg w-1/4"></div>
        <div className="h-48 bg-slate-800 rounded-2xl"></div>
        <div className="h-64 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-950/40 border border-rose-800/60 p-6 rounded-2xl text-center">
        <p className="text-rose-400 font-semibold mb-2">Unable to load points</p>
        <p className="text-slate-400 text-sm">
          {error?.message || 'Please check your connection or log in again.'}
        </p>
      </div>
    );
  }

  const currentPoints = data?.currentPoints ?? 0;
  const currentCycle = data?.currentCycle;
  const eligible = data?.eligible;
  const tier = data?.tier;
  const suggestedRewardName = data?.suggestedRewardName;
  const nextTier = data?.nextTier;

  // Calculate progress toward next tier
  let progressPercent = 0;
  if (nextTier && nextTier.minPoints > 0) {
    progressPercent = Math.min(100, Math.round((currentPoints / nextTier.minPoints) * 100));
  } else if (tier && tier.maxPoints > 0) {
    progressPercent = Math.min(100, Math.round((currentPoints / tier.maxPoints) * 100));
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>⭐</span>
          <span>My Points & Cycle Target</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your accumulated points in the active cycle and track your reward tier progress.
        </p>
      </div>

      {/* Hero Points Card */}
      <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-800/50 p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
              Active Cycle Points
            </span>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {currentPoints}
              </span>
              <span className="text-xl font-bold text-indigo-300">Points</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Derived strictly from recorded sales in the active cycle.
            </p>
          </div>

          {currentCycle ? (
            <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl sm:text-right">
              <div className="flex sm:justify-end items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-400 uppercase">
                  Current Cycle
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200 mt-1">
                {formatDate(currentCycle.startDate)} — {formatDate(currentCycle.endDate)}
              </p>
            </div>
          ) : (
            <div className="bg-amber-950/40 border border-amber-800/40 px-4 py-2 rounded-2xl">
              <span className="text-xs font-semibold text-amber-300">
                No active reward cycle
              </span>
            </div>
          )}
        </div>

        {/* Next Tier Progress Bar */}
        {nextTier && (
          <div className="mt-8 pt-6 border-t border-indigo-900/50 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">
                Progress to <strong className="text-white">{nextTier.suggestedRewardName}</strong>
              </span>
              <span className="text-indigo-400 font-bold">
                {currentPoints} / {nextTier.minPoints} pts ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-3 rounded-full transition-all duration-500 shadow-sm shadow-emerald-400/30"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-400">
              You need <strong className="text-emerald-400">{nextTier.pointsNeeded}</strong> more points to qualify for this next tier!
            </p>
          </div>
        )}
      </div>

      {/* Reward Tier Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Qualifying Tier */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h2 className="text-base font-bold text-white">Current Qualifying Tier</h2>
          </div>

          {eligible && tier ? (
            <div className="space-y-3 bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-emerald-400">
                  Target Achieved
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {tier.minPoints} – {tier.maxPoints} pts
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Suggested Reward:</p>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {suggestedRewardName}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                You have reached this reward threshold! The shop admin will assign physical reward units upon distribution.
              </p>
            </div>
          ) : (
            <div className="space-y-2 bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl">
              <span className="text-xs uppercase font-bold text-amber-400">
                Not Yet Qualified
              </span>
              <p className="text-xs text-slate-300">
                You have not yet reached the minimum points for the entry reward tier.
              </p>
            </div>
          )}
        </div>

        {/* Rules & Transparency */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">ℹ️</span>
            <h2 className="text-base font-bold text-white">How Points Work</h2>
          </div>

          <div className="space-y-2.5 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">•</span>
              <p>
                <strong className="text-slate-200">Cycle-Bound:</strong> Points are earned from paint sales recorded in the active cycle only.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">•</span>
              <p>
                <strong className="text-slate-200">Automatic Crediting:</strong> Whenever a sale is tagged to your name, points are credited automatically using the item catalog values at the time of purchase.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">•</span>
              <p>
                <strong className="text-slate-200">Suggested vs Actual:</strong> Tiers show your <em>suggested target</em>. Actual reward delivery is recorded separately once assigned by the shop.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">•</span>
              <p>
                <strong className="text-slate-200">Zero Mutation:</strong> Point totals are calculated directly from verified customer receipts and cannot be manually modified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
