'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCycle, useActivateCycle, useCloseCycle } from '@/lib/hooks/useCycles';
import CycleStatusConfirmModal from '@/components/admin/cycles/CycleStatusConfirmModal';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
  } catch { return '—'; }
};

const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date(d));
  } catch { return '—'; }
};

const getDuration = (start, end) => {
  if (!start || !end) return null;
  const days = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} days`;
  const months = (days / 30.44).toFixed(1);
  return `${months} months (${days} days)`;
};

export default function AdminCycleDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useCycle(id);
  const activateMutation = useActivateCycle();
  const closeMutation = useCloseCycle();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, actionType: 'close' });
  const [toast, setToast] = useState('');

  const cycle = data?.data;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleConfirm = async () => {
    try {
      if (confirmModal.actionType === 'close') {
        await closeMutation.mutateAsync(id);
        showToast('Cycle closed. All historical data is preserved.');
      } else {
        await activateMutation.mutateAsync(id);
        showToast('Cycle activated successfully.');
      }
      setConfirmModal({ isOpen: false, actionType: 'close' });
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading cycle…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-2">
        <p className="font-semibold text-red-700">Failed to load cycle</p>
        <p className="text-xs text-red-500">{error?.message || 'Server error'}</p>
        <Link href="/admin/cycles" className="inline-block mt-3 text-sm font-medium text-slate-700 hover:text-slate-900 underline">
          ← Back to Cycles
        </Link>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-sm text-slate-600 font-medium">Cycle not found.</p>
        <Link href="/admin/cycles" className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 underline">
          ← Back to Cycles
        </Link>
      </div>
    );
  }

  const isActive = cycle.isActive;
  const duration = getDuration(cycle.startDate, cycle.endDate);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {toast}
        </div>
      )}

      {/* Breadcrumb + Back */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/admin/cycles" className="hover:text-slate-800 transition-colors">Reward Cycles</Link>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <span className="text-slate-700 font-medium truncate max-w-[200px]">{cycle.id}</span>
        </nav>
        <Link href="/admin/cycles" className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          All Cycles
        </Link>
      </div>

      {/* Header Card */}
      <div className={`rounded-2xl p-6 border ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {isActive ? 'Active' : 'Closed'}
                </span>
              </div>
              {duration && <p className="text-sm text-slate-500 mt-0.5">Duration: {duration}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isActive ? (
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: true, actionType: 'close' })}
                className="px-4 py-2 text-sm font-semibold text-amber-700 bg-white hover:bg-amber-50 border border-amber-300 rounded-lg transition-colors"
              >
                Close Cycle
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: true, actionType: 'activate' })}
                className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors"
              >
                Activate Cycle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cycle ID */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cycle ID</p>
          <p className="font-mono text-sm text-slate-900 break-all">{cycle.id}</p>
        </div>

        {/* Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</p>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-sm font-semibold text-slate-800">{isActive ? 'Active' : 'Closed'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isActive
              ? 'Painters are currently accruing points in this cycle.'
              : 'This cycle is closed. Data is preserved for historical reporting.'}
          </p>
        </div>

        {/* Start Date */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</p>
          <p className="text-sm font-semibold text-slate-900">{formatDate(cycle.startDate)}</p>
        </div>

        {/* End Date */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</p>
          <p className="text-sm font-semibold text-slate-900">{formatDate(cycle.endDate)}</p>
        </div>

        {/* Created At */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Created At</p>
          <p className="text-sm font-semibold text-slate-900">{formatDateTime(cycle.createdAt)}</p>
        </div>

        {/* Last Updated */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Updated</p>
          <p className="text-sm font-semibold text-slate-900">{formatDateTime(cycle.updatedAt)}</p>
        </div>
      </div>

      {/* Future placeholder */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-1">
        <p className="text-sm font-semibold text-slate-600">Sales & Points Summary</p>
        <p className="text-xs text-slate-400">Sales transactions and point totals for this cycle will be displayed here in a future phase.</p>
      </div>

      <CycleStatusConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, actionType: 'close' })}
        cycle={cycle}
        actionType={confirmModal.actionType}
        onConfirm={handleConfirm}
        isSubmitting={activateMutation.isPending || closeMutation.isPending}
      />
    </div>
  );
}
