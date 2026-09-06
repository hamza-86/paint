'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  useDashboardSummary,
  useTopPainters,
  useSalesTrend,
  useRecentSales,
  useRecentRewards,
  useInventorySummary,
  useCompanyRewardsSummary,
  useDashboardActivity,
} from '@/lib/hooks/useDashboard';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStatCards from '@/components/dashboard/DashboardStatCards';
import CurrentCycleCard from '@/components/dashboard/CurrentCycleCard';
import SalesTrendChart from '@/components/dashboard/SalesTrendChart';
import TopPaintersCard from '@/components/dashboard/TopPaintersCard';
import RecentSalesTable from '@/components/dashboard/RecentSalesTable';
import RecentRewardsTable from '@/components/dashboard/RecentRewardsTable';
import InventorySummaryCard from '@/components/dashboard/InventorySummaryCard';
import CompanyRewardsSummary from '@/components/dashboard/CompanyRewardsSummary';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User auth state
  const { data: user } = useCurrentUser();

  // Dashboard queries
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
  } = useDashboardSummary();

  const {
    data: topPaintersData,
    isLoading: isTopPaintersLoading,
  } = useTopPainters({ limit: 5 });

  const {
    data: salesTrendData,
    isLoading: isTrendLoading,
  } = useSalesTrend();

  const {
    data: recentSalesData,
    isLoading: isSalesLoading,
  } = useRecentSales({ limit: 5 });

  const {
    data: recentRewardsData,
    isLoading: isRewardsLoading,
  } = useRecentRewards({ limit: 5 });

  const {
    data: inventoryData,
    isLoading: isInventoryLoading,
  } = useInventorySummary();

  const {
    data: companyRewardsData,
    isLoading: isCompanyRewardsLoading,
  } = useCompanyRewardsSummary();

  const {
    data: activityData,
    isLoading: isActivityLoading,
  } = useDashboardActivity({ limit: 8 });

  // Handle manual dashboard refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const summary = summaryData?.data || summaryData;
  const currentCycle = summary?.currentCycle;
  const topPainters = topPaintersData?.data || topPaintersData || [];
  const salesTrend = salesTrendData?.data || salesTrendData || [];
  const recentSales = recentSalesData?.data || recentSalesData || [];
  const recentRewards = recentRewardsData?.data || recentRewardsData || [];
  const inventory = inventoryData?.data || inventoryData;
  const companyRewards = companyRewardsData?.data || companyRewardsData;
  const activities = activityData?.data || activityData || [];

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. Welcome & Control Header ───────────────────────────────────── */}
      <DashboardHeader
        user={user}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* ── 2. Top-Level KPI Summary Cards ─────────────────────────────────── */}
      <DashboardStatCards
        summary={summary}
        isLoading={isSummaryLoading}
      />

      {/* ── 3. Active Cycle Operational Banner ─────────────────────────────── */}
      <CurrentCycleCard
        currentCycle={currentCycle}
        isLoading={isSummaryLoading}
      />

      {/* ── 4. Main Analytics & Operational Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) — Sales Trends & Transaction Tables */}
        <div className="lg:col-span-2 space-y-8">
          {/* Sales Trend Chart */}
          <SalesTrendChart
            trend={salesTrend}
            isLoading={isTrendLoading}
          />

          {/* Recent Sales Table */}
          <RecentSalesTable
            sales={recentSales}
            isLoading={isSalesLoading}
          />

          {/* Recent Physical Rewards Assigned */}
          <RecentRewardsTable
            rewards={recentRewards}
            isLoading={isRewardsLoading}
          />
        </div>

        {/* Right Column (1 Col) — Leaderboard, Stock & Feeds */}
        <div className="lg:col-span-1 space-y-8">
          {/* Top Painters Leaderboard */}
          <TopPaintersCard
            painters={topPainters}
            isLoading={isTopPaintersLoading}
          />

          {/* Reward Inventory Health & Low Stock Watchlist */}
          <InventorySummaryCard
            inventory={inventory}
            isLoading={isInventoryLoading}
          />

          {/* Company Rewards & Procurement */}
          <CompanyRewardsSummary
            data={companyRewards}
            isLoading={isCompanyRewardsLoading}
          />

          {/* Live Multi-Event Activity Stream */}
          <ActivityFeed
            activities={activities}
            isLoading={isActivityLoading}
          />
        </div>
      </div>

      {/* ── 5. Quick Administrative Actions ────────────────────────────────── */}
      <section className="pt-4 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">
          Quick Management Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/sales"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                Record Sale
              </h3>
              <p className="text-xs text-slate-400">Award painter points</p>
            </div>
          </Link>

          <Link
            href="/admin/rewards/assign"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="14" x="3" y="8" rx="2" />
                <path d="M12 5a3 3 0 1 0-3 3" />
                <path d="M12 5a3 3 0 1 1 3 3" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                Assign Reward
              </h3>
              <p className="text-xs text-slate-400">Gift eligible painters</p>
            </div>
          </Link>

          <Link
            href="/admin/reward-inventory"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <line x1="12" x2="12" y1="12" y2="22" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                Reward Inventory
              </h3>
              <p className="text-xs text-slate-400">Track physical stock</p>
            </div>
          </Link>

          <Link
            href="/admin/cycles"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                Reward Cycles
              </h3>
              <p className="text-xs text-slate-400">Configure cycle dates</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
