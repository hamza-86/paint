'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import EmptyState from '@/components/admin/EmptyState';
import CycleTable from '@/components/admin/cycles/CycleTable';
import CycleCardList from '@/components/admin/cycles/CycleCardList';
import CreateCycleModal from '@/components/admin/cycles/CreateCycleModal';
import CycleStatusConfirmModal from '@/components/admin/cycles/CycleStatusConfirmModal';
import { useCycles, useActivateCycle, useCloseCycle } from '@/lib/hooks/useCycles';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
  } catch { return '—'; }
};

export default function AdminCyclesPage() {
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, cycle: null, actionType: 'close' });
  const [toastMessage, setToastMessage] = useState('');

  const { data, isLoading, isError, error, isPlaceholderData } = useCycles({ page, limit: 10 });
  const activateMutation = useActivateCycle();
  const closeMutation = useCloseCycle();

  const cycles = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const activeCycle = data?.activeCycle || null;
  const totalCycles = pagination.total;
  const closedCycles = totalCycles - (activeCycle ? 1 : 0);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleConfirm = async () => {
    if (!confirmModal.cycle) return;
    const { cycle, actionType } = confirmModal;
    try {
      if (actionType === 'close') {
        await closeMutation.mutateAsync(cycle.id);
        triggerToast(`Cycle closed. Historical data preserved.`);
      } else {
        await activateMutation.mutateAsync(cycle.id);
        triggerToast(`Cycle activated successfully.`);
      }
      setConfirmModal({ isOpen: false, cycle: null, actionType: 'close' });
    } catch (err) {
      alert(err.message || 'Failed to update cycle.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Reward Cycles"
        description="Manage painter reward periods, cycle dates, and point accrual history."
        badge="Periods"
        actions={{
          label: 'Create Cycle',
          onClick: () => setIsCreateModalOpen(true),
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          ),
        }}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Cycle"
          value={isLoading ? null : (activeCycle ? 1 : 0)}
          subtitle={activeCycle ? `${formatDate(activeCycle.startDate)} → ${formatDate(activeCycle.endDate)}` : 'No active cycle'}
          color="emerald"
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          }
        />
        <StatCard
          title="Total Cycles"
          value={isLoading ? null : totalCycles}
          subtitle="All periods including closed"
          color="blue"
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          title="Closed Cycles"
          value={isLoading ? null : closedCycles}
          subtitle="Historical periods preserved"
          color="amber"
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
        />
      </div>

      {/* Active Cycle Banner */}
      {!isLoading && activeCycle && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Current Active Cycle</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-sm font-bold text-emerald-900 mt-0.5">
                {formatDate(activeCycle.startDate)} — {formatDate(activeCycle.endDate)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmModal({ isOpen: true, cycle: activeCycle, actionType: 'close' })}
            className="shrink-0 px-4 py-2 text-xs font-semibold text-amber-700 bg-white hover:bg-amber-50 rounded-lg border border-amber-300 transition-colors"
          >
            Close This Cycle
          </button>
        </div>
      )}

      {/* No active cycle notice */}
      {!isLoading && !activeCycle && totalCycles > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-sm text-amber-800">
          <svg className="w-5 h-5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span><span className="font-semibold">No active cycle.</span> Activate a cycle or create a new one so painters can accrue points on sales.</span>
        </div>
      )}

      {/* Cycle List / Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading cycles...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 shadow-xs">
          <p className="font-semibold text-sm">Failed to load cycles</p>
          <p className="text-xs text-red-500 mt-1">{error?.message || 'Server error'}</p>
        </div>
      ) : cycles.length === 0 ? (
        <EmptyState
          title="No reward cycles configured yet"
          description="Cycles define the date ranges during which painter sales accumulate points. Create your first cycle to get started."
          actionLabel="Create First Cycle"
          onAction={() => setIsCreateModalOpen(true)}
          icon={
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" />
            </svg>
          }
          note="Reward cycles allow painter points to be segmented by period for fair reward distribution."
        />
      ) : (
        <div className="space-y-4">
          <CycleTable
            cycles={cycles}
            onActivateClick={(cycle) => setConfirmModal({ isOpen: true, cycle, actionType: 'activate' })}
            onCloseClick={(cycle) => setConfirmModal({ isOpen: true, cycle, actionType: 'close' })}
          />
          <CycleCardList
            cycles={cycles}
            onActivateClick={(cycle) => setConfirmModal({ isOpen: true, cycle, actionType: 'activate' })}
            onCloseClick={(cycle) => setConfirmModal({ isOpen: true, cycle, actionType: 'close' })}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.total}</span> cycles
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || isPlaceholderData}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="font-semibold text-slate-900 px-2">{pagination.page} / {pagination.totalPages}</span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || isPlaceholderData}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Cycle Modal */}
      <CreateCycleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={triggerToast}
        hasActiveCycle={Boolean(activeCycle)}
      />

      {/* Status Confirm Modal */}
      <CycleStatusConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, cycle: null, actionType: 'close' })}
        cycle={confirmModal.cycle}
        actionType={confirmModal.actionType}
        onConfirm={handleConfirm}
        isSubmitting={activateMutation.isPending || closeMutation.isPending}
      />
    </div>
  );
}
