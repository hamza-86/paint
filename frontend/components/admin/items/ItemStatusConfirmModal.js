'use client';

import React from 'react';

export default function ItemStatusConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  actionType = 'deactivate',
  isSubmitting = false,
}) {
  if (!isOpen || !item) return null;

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
        <h3 className="text-lg font-bold text-slate-900">
          {isDeactivate ? `Deactivate "${item.name}"?` : `Reactivate "${item.name}"?`}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 mt-2">
          {isDeactivate
            ? 'Deactivating this item prevents it from being selected in future sales transactions. All historical sales and painter points previously earned from this item will remain permanently intact.'
            : 'Reactivating this item restores it to the active catalog, allowing it to be recorded in new sales with its configured price and points.'}
        </p>

        {/* Action Buttons */}
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
              isDeactivate
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSubmitting && (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isDeactivate ? 'Yes, Deactivate Item' : 'Yes, Reactivate Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
