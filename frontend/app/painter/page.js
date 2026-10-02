'use client';

import Link from 'next/link';
import { usePainterPortalDashboard, usePainterPortalRewardTiers } from '@/lib/hooks/usePainterPortal';

// Helper to format currency in INR
function formatINR(val) {
  if (typeof val !== 'number') return '\u20b90';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

// Helper to format date
function formatDate(d) {
  if (!d) return '\u2014';
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

/**
 * Determine the visual state of a reward tier relative to the painter's current points.
 *
 * Mirrors the backend findMatchingTier fallback logic:
 *   - Direct match [minPoints, maxPoints]      -> 'current'
 *   - Highest tier AND points > maxPoints      -> 'current'  (fallback: never say "no reward")
 *   - points > tier.maxPoints (lower tier)     -> 'completed'
 *   - Otherwise                                -> 'upcoming'
 */
function getTierState(tier, index, allTiers, currentPoints) {
  const isHighestTier = index === allTiers.length - 1;

  if (currentPoints >= tier.minPoints && currentPoints <= tier.maxPoints) {
    return 'current';
  }
  if (isHighestTier && currentPoints > tier.maxPoints) {
    return 'current';
  }
  if (currentPoints > tier.maxPoints) {
    return 'completed';
  }
  return 'upcoming';
}

// --------------------------------------------------------------------------
// RewardRoadmap component
// --------------------------------------------------------------------------
function RewardRoadmap({ currentPoints }) {
  const { data: tiersRes, isLoading, isError } = usePainterPortalRewardTiers();

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg animate-pulse space-y-4">
        <div className="h-5 bg-slate-800 rounded w-1/3" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-800 rounded-2xl" />
          <div className="h-16 bg-slate-800 rounded-2xl" />
          <div className="h-16 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">&#x1F5FA;&#xFE0F;</span>
          <h2 className="text-lg font-bold text-white">Reward Roadmap</h2>
        </div>
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4 text-center">
          <p className="text-rose-400 text-sm font-medium">Reward information could not be loaded.</p>
          <p className="text-slate-500 text-xs mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Already sorted ascending by the API; defensive re-sort on frontend.
  const tiers = (tiersRes?.data || []).slice().sort((a, b) => a.minPoints - b.minPoints);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x1F5FA;&#xFE0F;</span>
          <div>
            <h2 className="text-lg font-bold text-white">Reward Roadmap</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              See what rewards you qualify for at each point level
            </p>
          </div>
        </div>
        <Link
          href="/painter/points"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
        >
          <span>My Points</span>
          <span>&#x2192;</span>
        </Link>
      </div>

      {/* Empty state */}
      {tiers.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <span className="text-3xl block">&#x1F381;</span>
          <p className="text-slate-400 text-sm font-medium">No reward tiers available yet.</p>
          <p className="text-slate-500 text-xs">
            Rewards will appear here once the shop configures reward tiers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, index) => {
            const state = getTierState(tier, index, tiers, currentPoints);
            const isCurrent = state === 'current';
            const isCompleted = state === 'completed';
            const isHighestTier = index === tiers.length - 1;
            const nextTier = tiers[index + 1] || null;

            // Progress info — only for the current tier
            let progressPercent = 0;
            let pointsToNext = null;
            if (isCurrent) {
              const rangeSize = tier.maxPoints - tier.minPoints;
              progressPercent =
                rangeSize > 0
                  ? Math.min(100, Math.round(((currentPoints - tier.minPoints) / rangeSize) * 100))
                  : 100;
              if (nextTier) {
                pointsToNext = Math.max(0, nextTier.minPoints - currentPoints);
              }
            }

            return (
              <div
                key={tier.id}
                className={[
                  'rounded-2xl border p-4 transition-colors',
                  isCurrent
                    ? 'bg-indigo-950/60 border-indigo-600/60'
                    : isCompleted
                    ? 'bg-emerald-950/25 border-emerald-800/30'
                    : 'bg-slate-800/30 border-slate-700/40',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left side: range, badge, name, progress */}
                  <div className="flex-1 min-w-0">
                    {/* Range + state badge */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={[
                          'text-xs font-bold',
                          isCurrent
                            ? 'text-indigo-300'
                            : isCompleted
                            ? 'text-emerald-400'
                            : 'text-slate-500',
                        ].join(' ')}
                      >
                        {tier.minPoints} &ndash; {tier.maxPoints} Points
                      </span>

                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-700/70 border border-indigo-500/50 text-indigo-200 text-[10px] font-bold uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 inline-block" />
                          You&apos;re Here
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
                          &#x2713; Completed
                        </span>
                      )}
                      {state === 'upcoming' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/40 text-slate-400 text-[10px] font-semibold uppercase tracking-wide">
                          Upcoming
                        </span>
                      )}
                    </div>

                    {/* Reward name */}
                    <p
                      className={[
                        'font-extrabold text-base leading-tight',
                        isCurrent
                          ? 'text-white'
                          : isCompleted
                          ? 'text-emerald-300'
                          : 'text-slate-400',
                      ].join(' ')}
                    >
                      {tier.suggestedRewardName}
                    </p>

                    {/* Progress bar — current tier only */}
                    {isCurrent && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">
                            {currentPoints} / {tier.maxPoints} pts
                          </span>
                          <span className="text-indigo-300 font-semibold">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-violet-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        {nextTier ? (
                          <p className="text-[11px] text-slate-400">
                            <span className="text-amber-300 font-semibold">
                              {pointsToNext} more points
                            </span>{' '}
                            to reach{' '}
                            <span className="text-white font-semibold">
                              {nextTier.suggestedRewardName}
                            </span>
                          </p>
                        ) : isHighestTier ? (
                          <p className="text-[11px] text-emerald-400 font-semibold">
                            &#x1F3C6; Highest reward tier reached!
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Right side: image or status icon */}
                  {tier.imageUrl ? (
                    <img
                      src={tier.imageUrl}
                      alt={tier.suggestedRewardName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700/60 flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={[
                        'w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
                        isCurrent
                          ? 'bg-indigo-800/60'
                          : isCompleted
                          ? 'bg-emerald-900/40'
                          : 'bg-slate-800/60',
                      ].join(' ')}
                    >
                      {isCurrent ? '⭐' : isCompleted ? '✅' : '🎁'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Main dashboard page
// --------------------------------------------------------------------------
export default function PainterDashboardPage() {
  const { data: dashRes, isLoading, isError, error } = usePainterPortalDashboard();
  const data = dashRes?.data;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-800 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 bg-slate-800 rounded-2xl"></div>
          <div className="h-40 bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="h-64 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-950/40 border border-rose-800/60 p-6 rounded-2xl text-center">
        <p className="text-rose-400 font-semibold mb-2">Unable to load dashboard</p>
        <p className="text-slate-400 text-sm">
          {error?.message || 'Please check your connection or log in again.'}
        </p>
      </div>
    );
  }

  const painter = data?.painter;
  const currentCycle = data?.currentCycle;
  const currentPoints = data?.currentPoints ?? 0;
  const totalSales = data?.totalSales ?? 0;
  const totalSalesValue = data?.totalSalesValue ?? 0;
  const totalRewardsReceived = data?.totalRewardsReceived ?? 0;
  const recentSales = data?.recentSales || [];
  const recentRewards = data?.recentRewards || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          {painter?.photoUrl ? (
            <img
              src={painter.photoUrl}
              alt={painter.firstName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {painter?.firstName?.[0] || 'P'}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome, {painter?.firstName || 'Painter'}!
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Check your current cycle points and track rewards in real time.
            </p>
          </div>
        </div>

        {/* Current Cycle Badge */}
        {currentCycle ? (
          <div className="bg-slate-800/80 border border-slate-700/70 px-4 py-2.5 rounded-2xl self-start sm:self-center">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Active Cycle
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {formatDate(currentCycle.startDate)} &mdash; {formatDate(currentCycle.endDate)}
            </p>
          </div>
        ) : (
          <div className="bg-amber-950/30 border border-amber-800/40 px-4 py-2 rounded-2xl self-start sm:self-center">
            <span className="text-xs font-semibold text-amber-300">No Active Cycle</span>
          </div>
        )}
      </div>

      {/* Hero Metrics Row — 2 cards (Eligibility card removed, replaced by Roadmap below) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Current Cycle Points */}
        <div className="bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-800/40 p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Current Cycle Points
            </span>
            <span className="text-2xl">&#x2B50;</span>
          </div>
          <div className="mt-4">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {currentPoints}
            </span>
            <span className="text-indigo-300 text-sm ml-2 font-medium">Points</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Calculated strictly from eligible sales in the active cycle.
          </p>
          <div className="mt-4 pt-3 border-t border-indigo-900/40">
            <Link
              href="/painter/points"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
            >
              <span>View Points &amp; Tier Progress</span>
              <span>&#x2192;</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Cycle Sales Performance */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cycle Sales Performance
              </span>
              <span className="text-2xl">&#x1F4CA;</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalSales}</span>
                <p className="text-xs text-slate-400 mt-0.5">Purchases</p>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                  {formatINR(totalSalesValue)}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">Total Value</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Total Physical Rewards Received:{' '}
              <strong className="text-white">{totalRewardsReceived}</strong>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <Link
              href="/painter/sales"
              className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1"
            >
              <span>View full sales history</span>
              <span>&#x2192;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Reward Roadmap — full-width section replacing old Reward Eligibility card */}
      <RewardRoadmap currentPoints={currentPoints} />

      {/* Two-Column Section: Recent Sales & Rewards Received */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sales */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">&#x1F4CB;</span>
              <h2 className="text-lg font-bold text-white">Recent Sales</h2>
            </div>
            <Link
              href="/painter/sales"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              View All
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No sales recorded in the current cycle yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-slate-800/50 border border-slate-700/40 p-3.5 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {sale.customer?.name || 'Customer Purchase'}
                      </span>
                      <span className="text-xs text-slate-400">
                        &bull; {formatDate(sale.date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-xs">
                      {sale.lineItems?.map((li) => `${li.itemName} x${li.quantity}`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-xs font-bold">
                      +{sale.totalPoints} pts
                    </span>
                    <p className="text-xs font-medium text-slate-300 mt-1">
                      {formatINR(sale.totalAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rewards Actually Received */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">&#x1F381;</span>
              <h2 className="text-lg font-bold text-white">Rewards Actually Received</h2>
            </div>
            <Link
              href="/painter/rewards"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              View All
            </Link>
          </div>

          {recentRewards.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No rewards assigned yet. Keep accumulating points!
            </div>
          ) : (
            <div className="space-y-3">
              {recentRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="bg-slate-800/50 border border-slate-700/40 p-3.5 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {reward.imageUrl ? (
                      <img
                        src={reward.imageUrl}
                        alt={reward.rewardName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
                        &#x1F381;
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white">{reward.rewardName}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Qty: {reward.qty} &bull; Received on {formatDate(reward.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/50 text-emerald-400 text-[11px] font-semibold">
                      Delivered
                    </span>
                    {reward.pointsAtAssignment > 0 && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        at {reward.pointsAtAssignment} pts
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}