'use client';

import React from 'react';

export default function RewardInventoryStatusConfirmModal({
  isOpen,
  onClose,
  item,
  onConfirm,
  isSubmitting = false,
}) {
  if (!isOpen || !item) return null;

  const isDeactivating = item.status === 'active';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3.5 mb-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isDeactivating
                  ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
              }`}
            >
              {isDeactivating ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isDeactivating ? 'Deactivate Inventory Item' : 'Activate Inventory Item'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isDeactivating ? 'Suspend painter redemption' : 'Restore painter redemption'}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to {isDeactivating ? 'deactivate' : 'activate'}{' '}
            <strong className="text-slate-800 font-semibold">{item.name}</strong>?
          </p>

          <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 leading-normal">
            {isDeactivating ? (
              <span>
                💡 <strong>Historical safety notice:</strong> Deactivating this item prevents future
                painter reward assignment. All existing inventory logs, counts, and past
                records will remain permanently preserved.
              </span>
            ) : (
              <span>
                💡 <strong>Availability notice:</strong> Reactivating this item restores it as
                eligible for future painter reward assignments.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 ${
                isDeactivating
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>{isDeactivating ? 'Yes, Deactivate' : 'Yes, Activate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
