'use client';

import React from 'react';
import StatCard from '@/components/admin/StatCard';

/**
 * DashboardStatCards
 * Displays high-level real-time KPI metrics.
 */
export default function DashboardStatCards({ summary, isLoading }) {
  const painters = summary?.painters;
  const currentCycle = summary?.currentCycle;
  const rewards = summary?.rewards;
  const companyRewards = summary?.companyRewards;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Key Business Indicators
          </h2>
          <p className="text-xs text-slate-500">
            Live aggregated metrics across painters, active cycle, and reward inventory
          </p>
        </div>
        {currentCycle ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Cycle Active ({currentCycle.daysRemaining}d left)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            No Active Cycle
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Active Painters */}
        <StatCard
          title="Active Painters"
          value={
            isLoading
              ? '...'
              : painters
              ? painters.active
              : '0'
          }
          subtitle={
            isLoading
              ? 'Loading painters...'
              : painters
              ? `${painters.total} registered (${painters.deactivated} inactive)`
              : 'No painters registered'
          }
          badge="Painters"
          accent="blue"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        {/* Cycle Sales Revenue */}
        <StatCard
          title="Cycle Sales Value"
          value={
            isLoading
              ? '...'
              : currentCycle
              ? `₹${currentCycle.totalSalesValue.toLocaleString()}`
              : '—'
          }
          subtitle={
            isLoading
              ? 'Calculating sales...'
              : currentCycle
              ? `${currentCycle.totalSales} sales recorded this cycle`
              : 'Start a cycle to record sales'
          }
          badge="Cycle Revenue"
          accent="emerald"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        {/* Cycle Points */}
        <StatCard
          title="Cycle Points Awarded"
          value={
            isLoading
              ? '...'
              : currentCycle
              ? currentCycle.totalPoints.toLocaleString()
              : '—'
          }
          subtitle={
            isLoading
              ? 'Loading points...'
              : currentCycle
              ? `${currentCycle.daysRemaining} days remaining in cycle`
              : 'No active cycle'
          }
          badge="Points"
          accent="amber"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          }
        />

        {/* Physical Reward Inventory */}
        <StatCard
          title="Reward Stock"
          value={
            isLoading
              ? '...'
              : rewards
              ? `${rewards.remainingQty} pcs`
              : '0 pcs'
          }
          subtitle={
            isLoading
              ? 'Checking inventory...'
              : rewards
              ? `${rewards.assignedQty} assigned (${rewards.totalAssignments} gifts issued)`
              : 'No inventory items'
          }
          badge="Inventory"
          accent="purple"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="14" x="3" y="8" rx="2" />
              <path d="M12 5a3 3 0 1 0-3 3" />
              <path d="M12 5a3 3 0 1 1 3 3" />
              <path d="M12 8v14" />
              <path d="M3 13h18" />
            </svg>
          }
        />
      </div>
    </section>
  );
}
