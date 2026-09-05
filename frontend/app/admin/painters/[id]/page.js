'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/admin/PageHeader';
import StatusConfirmModal from '@/components/admin/painters/StatusConfirmModal';
import {
  usePainter,
  useDeactivatePainter,
  useActivatePainter,
} from '@/lib/hooks/usePainters';
import {
  usePainterHistory,
  usePainterHistoryCycles,
  usePainterHistorySales,
} from '@/lib/hooks/usePainterHistory';
import { usePainterCurrentRewardTier } from '@/lib/hooks/useRewardTiers';

export default function PainterDetailPage() {
  const params = useParams();
  const id = params?.id;

  const { data, isLoading, isError, error } = usePainter(id);
  const painter = data?.painter;

  // History queries
  const { data: historyData, isLoading: isHistoryLoading } = usePainterHistory(id);
  const { data: cyclesData, isLoading: isCyclesLoading } = usePainterHistoryCycles(id);
  const { data: eligibilityData, isLoading: isEligibilityLoading } = usePainterCurrentRewardTier(id);
  const currentEligibility = eligibilityData?.data;

  // Sales table state
  const [selectedCycleId, setSelectedCycleId] = useState('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: salesData, isLoading: isSalesLoading } = usePainterHistorySales(id, {
    page,
    limit: 10,
    cycleId: selectedCycleId,
    search,
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: 'deactivate',
  });
  const [toastMessage, setToastMessage] = useState('');

  const deactivateMutation = useDeactivatePainter();
  const activateMutation = useActivatePainter();

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const handleStatusToggle = () => {
    if (!painter) return;
    setConfirmModal({
      isOpen: true,
      actionType: painter.status === 'active' ? 'deactivate' : 'activate',
    });
  };

  const handleConfirmStatus = async () => {
    if (!painter) return;
    try {
      if (confirmModal.actionType === 'deactivate') {
        await deactivateMutation.mutateAsync(painter.id);
        triggerToast(`Painter "${painter.firstName}" deactivated successfully.`);
      } else {
        await activateMutation.mutateAsync(painter.id);
        triggerToast(`Painter "${painter.firstName}" activated successfully.`);
      }
      setConfirmModal({ isOpen: false, actionType: 'deactivate' });
    } catch (err) {
      alert(err.message || 'Failed to update painter status.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr));
    } catch {
      return '—';
    }
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return '—';
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 rounded-sm w-48 animate-pulse" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 rounded-sm w-40" />
              <div className="h-4 bg-slate-200 rounded-sm w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !painter) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Painter Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error?.message || 'The requested painter could not be found or has an invalid identifier.'}
        </p>
        <Link
          href="/admin/painters"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
        >
          &larr; Back to Painters List
        </Link>
      </div>
    );
  }

  const isActive = painter.status === 'active';
  const summary = historyData?.summary || { totalSales: 0, totalSalesValue: 0, totalPoints: 0 };
  const currentCycle = historyData?.currentCycle;
  const currentCycleSummary = historyData?.currentCycleSummary || {
    currentCycleSales: 0,
    currentCycleSalesValue: 0,
    currentCyclePoints: 0,
  };
  const cycles = cyclesData?.cycles || [];
  const sales = salesData?.data || [];
  const pagination = salesData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Breadcrumb & Navigation ──────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/painters"
          className="hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Painters
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">{painter.firstName}</span>
      </div>

      {/* ── Profile Header Card ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {painter.photoUrl ? (
              <img
                src={painter.photoUrl}
                alt={painter.firstName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-2xl shadow-xs">
                {painter.firstName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {painter.firstName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {isActive ? 'Active Account' : 'Deactivated'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ID: {painter.id} &bull; Member since {formatDate(painter.createdAt)}
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleStatusToggle}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer border shadow-xs flex items-center justify-center gap-2 ${
                isActive
                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              {isActive ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Deactivate Account
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Reactivate Account
                </>
              )}
            </button>
          </div>
        </div>

        {/* Profile metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Mobile Number</span>
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {painter.mobile}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Email Address</span>
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2 truncate">
              <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span className="truncate">{painter.email}</span>
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Current Reward Cycle</span>
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {currentCycle ? `${formatDateShort(currentCycle.startDate)} → ${formatDateShort(currentCycle.endDate)}` : 'No Active Cycle'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Account State</span>
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {isActive ? 'Login Permitted' : 'Login Suspended'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Overall Performance & Current Cycle ───────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Overall Performance</span>
          {isHistoryLoading && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Sales */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Sales Referred</span>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isHistoryLoading ? '…' : summary.totalSales}
              </span>
            </div>
          </div>

          {/* Total Sales Value */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Sales Value</span>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isHistoryLoading ? '…' : formatCurrency(summary.totalSalesValue)}
              </span>
            </div>
          </div>

          {/* Total Points */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Points Earned</span>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isHistoryLoading ? '…' : `${summary.totalPoints} pts`}
              </span>
            </div>
          </div>
        </div>

        {/* Current Active Cycle Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Current Cycle Performance</h3>
                <p className="text-xs text-slate-400">
                  {currentCycle
                    ? `Period: ${formatDateShort(currentCycle.startDate)} → ${formatDateShort(currentCycle.endDate)}`
                    : 'No active reward cycle is currently running'}
                </p>
              </div>
            </div>
            {currentCycle ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Cycle
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 self-start sm:self-auto">
                No Active Cycle
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs font-medium block mb-1">Cycle Sales</span>
              <span className="text-lg font-bold text-slate-900">
                {currentCycleSummary.currentCycleSales}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs font-medium block mb-1">Cycle Sales Value</span>
              <span className="text-lg font-bold text-emerald-700">
                {formatCurrency(currentCycleSummary.currentCycleSalesValue)}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs font-medium block mb-1">Cycle Points</span>
              <span className="text-lg font-bold text-amber-700">
                {currentCycleSummary.currentCyclePoints} pts
              </span>
            </div>
          </div>
        </div>

        {/* Current Reward Eligibility (Part 8) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Current Reward Eligibility</h3>
                <p className="text-xs text-slate-400">
                  Calculated exclusively from painter points in the active reward cycle
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
              Suggested Incentive
            </span>
          </div>

          {isEligibilityLoading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading reward eligibility…</div>
          ) : !currentEligibility?.cycle ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <span className="font-semibold text-slate-700 block">No active reward cycle</span>
                Reward tier eligibility is tracked only while a cycle is active.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Cycle Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-xs font-medium block mb-1">Active Cycle Period</span>
                  <span className="font-semibold text-slate-800 text-xs block">
                    {formatDateShort(currentEligibility.cycle.startDate)} &rarr; {formatDateShort(currentEligibility.cycle.endDate)}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Cycle
                </span>
              </div>

              {/* Current Points */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-slate-400 text-xs font-medium block mb-1">Active Cycle Points</span>
                <span className="text-2xl font-extrabold text-amber-700">
                  {currentEligibility.currentPoints} pts
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Lifetime sales points are excluded
                </span>
              </div>

              {/* Suggested Reward */}
              <div className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-xl border border-amber-200/60 flex flex-col justify-between">
                <div>
                  <span className="text-amber-800 text-xs font-semibold block mb-1">Suggested Reward</span>
                  {currentEligibility.tier ? (
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {currentEligibility.tier.suggestedRewardName}
                      </span>
                      <span className="inline-block mt-1 text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                        Tier: {currentEligibility.tier.minPoints} &ndash; {currentEligibility.tier.maxPoints} pts
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 font-medium">
                      No reward tier currently matches this point total.
                      <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                        Configure a lower tier or refer more sales to qualify.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Cycle History Breakdown ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reward Cycle Breakdown</h3>
              <p className="text-xs text-slate-400">All reward cycles where this painter referred sales</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {cycles.length} {cycles.length === 1 ? 'Cycle' : 'Cycles'}
          </span>
        </div>

        {isCyclesLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading cycle history…</div>
        ) : cycles.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-600">No cycle history available yet.</p>
            <p>Sales referred in active or closed cycles will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Cycle Period</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Sales Count</th>
                  <th className="py-3 px-4 text-right">Sales Value</th>
                  <th className="py-3 px-4 text-right">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cycles.map((c) => (
                  <tr key={c.cycleId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatDateShort(c.startDate)} &rarr; {formatDateShort(c.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      {c.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">
                      {c.salesCount}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatCurrency(c.totalSalesValue)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-amber-700">
                      {c.totalPoints} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Sales History ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Referred Sales History</h3>
              <p className="text-xs text-slate-400">All customer paint purchases attributed to this painter</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Cycle Filter */}
            <select
              value={selectedCycleId}
              onChange={(e) => {
                setSelectedCycleId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Cycles</option>
              {cycles.map((c) => (
                <option key={c.cycleId} value={c.cycleId}>
                  {formatDateShort(c.startDate)} - {formatDateShort(c.endDate)} {c.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>

            {/* Customer Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer / mobile…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        {isSalesLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading sales history…</div>
        ) : sales.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-600">No sales recorded for this painter yet.</p>
            <p>
              {selectedCycleId !== 'all' || search
                ? 'Try adjusting your cycle filter or search terms.'
                : 'Customer referrals made by this painter will appear here with points snapshots.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Sale Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Sale Amount</th>
                    <th className="py-3 px-4 text-right">Points Earned</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {formatDateShort(sale.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {sale.customer?.name || 'Walk-in Customer'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {sale.customer?.mobile || 'No Mobile'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sale.cycle ? (
                          <span>
                            {formatDateShort(sale.cycle.startDate)} &rarr; {formatDateShort(sale.cycle.endDate)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700 font-medium">
                        {sale.itemCount}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-amber-700">
                        +{sale.totalPoints} pts
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/sales/${sale.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          View Sale &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total sales)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-800 px-2">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Status Confirmation Modal ─────────────────────────────────── */}
      <StatusConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, actionType: 'deactivate' })}
        onConfirm={handleConfirmStatus}
        painter={painter}
        actionType={confirmModal.actionType}
        isLoading={deactivateMutation.isPending || activateMutation.isPending}
      />
    </div>
  );
}
