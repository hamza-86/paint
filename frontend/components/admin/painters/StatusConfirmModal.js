'use client';

import React from 'react';

export default function StatusConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  painter,
  actionType = 'deactivate',
  isLoading = false,
}) {
  if (!isOpen || !painter) return null;

  const isDeactivate = actionType === 'deactivate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isDeactivate
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {isDeactivate ? (
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isDeactivate ? 'Deactivate Painter?' : 'Reactivate Painter?'}
              </h3>
              <p className="text-xs text-slate-500">
                {painter.firstName} ({painter.email})
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
            {isDeactivate ? (
              <>
                <p className="font-semibold text-slate-800">
                  The painter will no longer be able to log in to their portal.
                </p>
                <p>
                  All historical sales, accumulated points, and past reward
                  records will remain completely intact for shop reporting.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-800">
                  The painter account will be restored to active status.
                </p>
                <p>
                  The painter will immediately be able to log in using their
                  existing credentials and view their points and rewards.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50 ${
              isDeactivate
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : isDeactivate ? (
              'Confirm Deactivation'
            ) : (
              'Confirm Activation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
