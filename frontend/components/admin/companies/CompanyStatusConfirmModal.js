'use client';

import React from 'react';

export default function CompanyStatusConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  company,
  actionType = 'deactivate',
  isSubmitting = false,
  error = '',
}) {
  if (!isOpen || !company) return null;

  const isDeactivate = actionType === 'deactivate';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            isDeactivate ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {isDeactivate ? (
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
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

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 mb-1">
          {isDeactivate ? 'Deactivate this company?' : 'Activate this company?'}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          {isDeactivate ? (
            <>
              Deactivating <strong className="text-slate-800">&ldquo;{company.name}&rdquo;</strong> will mark it as inactive. Historical records and any future references will remain preserved. The company will not be deleted.
            </>
          ) : (
            <>
              Activating <strong className="text-slate-800">&ldquo;{company.name}&rdquo;</strong> will make it active and available for active partner schemes and tracking.
            </>
          )}
        </p>

        {/* Error notification banner if any */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-colors shadow-xs flex items-center gap-1.5 ${
              isDeactivate
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            } disabled:opacity-50`}
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isSubmitting
              ? isDeactivate
                ? 'Deactivating…'
                : 'Activating…'
              : isDeactivate
              ? 'Yes, Deactivate'
              : 'Yes, Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}
