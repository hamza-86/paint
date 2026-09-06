'use client';

import React, { useState, useEffect } from 'react';

export default function CompanyModal({
  isOpen,
  onClose,
  onSubmit,
  company = null,
  isSubmitting = false,
}) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  const isEditing = Boolean(company);

  useEffect(() => {
    if (isOpen) {
      if (company) {
        setName(company.name || '');
        setDetails(company.details || '');
      } else {
        setName('');
        setDetails('');
      }
      setError('');
    }
  }, [isOpen, company]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Company name is required.');
      return;
    }

    if (trimmedName.length > 120) {
      setError('Company name cannot exceed 120 characters.');
      return;
    }

    const trimmedDetails = details.trim();
    if (trimmedDetails.length > 500) {
      setError('Company details cannot exceed 500 characters.');
      return;
    }

    try {
      await onSubmit({
        name: trimmedName,
        details: trimmedDetails,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save company.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                <line x1="10" x2="14" y1="6" y2="6" />
                <line x1="10" x2="14" y1="10" y2="10" />
                <line x1="10" x2="14" y1="14" y2="14" />
                <line x1="10" x2="14" y1="18" y2="18" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Company' : 'Register New Company'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update paint manufacturer or partner details'
                  : 'Add a paint company or manufacturer partner'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <svg
              className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Company / Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Asian Paints, Berger Paints, Nerolac"
              maxLength={120}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-60"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Active company names must be unique. Maximum 120 characters.
            </p>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Details & Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Primary paint supplier / incentive scheme partner"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-60 resize-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Supplier agreements, distributor references, or notes. Up to 500 characters.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isSubmitting
                ? isEditing
                  ? 'Saving…'
                  : 'Registering…'
                : isEditing
                ? 'Save Changes'
                : 'Register Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
