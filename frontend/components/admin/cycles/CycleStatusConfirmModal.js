'use client';

import React from 'react';

export default function CycleStatusConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  cycle,
  actionType = 'close',
  isSubmitting = false,
}) {
  if (!isOpen || !cycle) return null;

  const isClose = actionType === 'close';

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
    } catch { return '—'; }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          isClose ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          {isClose ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900">
          {isClose ? 'Close This Cycle?' : 'Activate This Cycle?'}
        </h3>

        <p className="text-sm text-slate-500 mt-1 mb-1 font-medium">
          {formatDate(cycle.startDate)} → {formatDate(cycle.endDate)}
        </p>

        <p className="text-sm text-slate-600 mt-2">
          {isClose
            ? 'Closing this cycle sets it as inactive. All historical sales and painter points recorded in this cycle will be permanently preserved. This action does not delete any data.'
            : 'Activating this cycle makes it the current active period for painter sales and point accrual. Only one cycle can be active at a time.'}
        </p>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
              isClose ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isClose ? 'Yes, Close Cycle' : 'Yes, Activate Cycle'}
          </button>
        </div>
      </div>
    </div>
  );
}
