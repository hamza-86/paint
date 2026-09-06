'use client';

import Link from 'next/link';
import { usePainterPortalDashboard } from '@/lib/hooks/usePainterPortal';

// Helper to format currency in INR
function formatINR(val) {
  if (typeof val !== 'number') return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

// Helper to format date
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

export default function PainterDashboardPage() {
  const { data: dashRes, isLoading, isError, error } = usePainterPortalDashboard();
  const data = dashRes?.data;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-800 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-800 rounded-2xl"></div>
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
  const rewardEligibility = data?.rewardEligibility;
  const suggestedReward = data?.suggestedReward;
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
              {formatDate(currentCycle.startDate)} — {formatDate(currentCycle.endDate)}
            </p>
          </div>
        ) : (
          <div className="bg-amber-950/30 border border-amber-800/40 px-4 py-2 rounded-2xl self-start sm:self-center">
            <span className="text-xs font-semibold text-amber-300">
              No Active Cycle
            </span>
          </div>
        )}
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Current Points (Cycle Bound) */}
        <div className="bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-800/40 p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Current Cycle Points
            </span>
            <span className="text-2xl">⭐</span>
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
              <span>View Points & Tier Progress</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Reward Eligibility */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Reward Eligibility
              </span>
              <span className="text-2xl">🏆</span>
            </div>

            <div className="mt-4">
              {rewardEligibility?.eligible ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 text-xs font-bold">
                    <span>✓</span>
                    <span>Eligible for Reward</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-slate-400">Suggested Reward:</p>
                    <p className="text-lg font-extrabold text-white">
                      {suggestedReward || rewardEligibility.suggestedRewardName}
                    </p>
                  </div>
                  {rewardEligibility.tier && (
                    <p className="text-xs text-slate-500">
                      Tier Range: {rewardEligibility.tier.minPoints}–
                      {rewardEligibility.tier.maxPoints} pts
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/60 text-amber-300 text-xs font-bold">
                    <span>Keep Going</span>
                  </div>
                  <p className="text-sm text-slate-300 mt-2">
                    {rewardEligibility?.nextTier ? (
                      <>
                        Need{' '}
                        <span className="text-amber-400 font-bold">
                          {rewardEligibility.nextTier.pointsNeeded}
                        </span>{' '}
                        more points for{' '}
                        <span className="font-semibold text-white">
                          {rewardEligibility.nextTier.suggestedRewardName}
                        </span>
                      </>
                    ) : (
                      'Accumulate points from sales to qualify for rewards.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <Link
              href="/painter/points"
              className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1"
            >
              <span>View details</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Cycle Sales Activity */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cycle Sales Performance
              </span>
              <span className="text-2xl">📊</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {totalSales}
                </span>
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
              Total Physical Rewards Received: <strong className="text-white">{totalRewardsReceived}</strong>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <Link
              href="/painter/sales"
              className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1"
            >
              <span>View full sales history</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Recent Sales & Rewards Received */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sales */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
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
                        • {formatDate(sale.date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-xs">
                      {sale.lineItems?.map((li) => `${li.itemName} ×${li.quantity}`).join(', ')}
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

        {/* Rewards Received */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
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
                        🎁
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {reward.rewardName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Qty: {reward.qty} • Received on {formatDate(reward.date)}
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
