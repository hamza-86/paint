'use client';

import React, { useState, useEffect } from 'react';
import { useCreateCycle } from '@/lib/hooks/useCycles';

export default function CreateCycleModal({ isOpen, onClose, onSuccess, hasActiveCycle }) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    isActive: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const createMutation = useCreateCycle();

  useEffect(() => {
    if (isOpen) {
      setFormData({ startDate: '', endDate: '', isActive: false });
      setErrors({});
      setServerError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.startDate) errs.startDate = 'Start date is required.';
    if (!formData.endDate) errs.endDate = 'End date is required.';
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errs.endDate = 'End date must be after start date.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
      });
      if (onSuccess) onSuccess('Cycle created successfully.');
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to create cycle.');
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Reward Cycle</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define the start and end dates for a new painter reward period.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.startDate ? 'border-red-300' : 'border-slate-300'
              }`}
            />
            {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.endDate ? 'border-red-300' : 'border-slate-300'
              }`}
            />
            {errors.endDate && <p className="text-xs text-red-600 mt-1">{errors.endDate}</p>}
          </div>

          {/* Activate immediately */}
          <div className={`p-3.5 rounded-xl border transition-colors ${
            hasActiveCycle
              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
              : 'bg-blue-50/50 border-blue-200/60'
          }`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                disabled={hasActiveCycle}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Activate immediately</span>
                {hasActiveCycle ? (
                  <p className="text-xs text-amber-700 mt-0.5">
                    ⚠ Cannot activate — close the current active cycle first.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Make this the current active cycle for new painter sales.
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Create Cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
