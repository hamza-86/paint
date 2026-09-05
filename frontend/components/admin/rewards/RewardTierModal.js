'use client';

import React, { useState, useEffect } from 'react';

export default function RewardTierModal({
  isOpen,
  onClose,
  onSubmit,
  tier = null,
  isSubmitting = false,
}) {
  const [minPoints, setMinPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [suggestedRewardName, setSuggestedRewardName] = useState('');
  const [error, setError] = useState('');

  const isEditing = Boolean(tier);

  useEffect(() => {
    if (isOpen) {
      if (tier) {
        setMinPoints(String(tier.minPoints));
        setMaxPoints(String(tier.maxPoints));
        setSuggestedRewardName(tier.suggestedRewardName || '');
      } else {
        setMinPoints('');
        setMaxPoints('');
        setSuggestedRewardName('');
      }
      setError('');
    }
  }, [isOpen, tier]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const min = Number(minPoints);
    const max = Number(maxPoints);

    if (minPoints === '' || isNaN(min) || min < 0) {
      setError('Please provide a valid, non-negative minimum points value.');
      return;
    }

    if (maxPoints === '' || isNaN(max) || max < 0) {
      setError('Please provide a valid, non-negative maximum points value.');
      return;
    }

    if (min > max) {
      setError('Minimum points cannot be greater than maximum points.');
      return;
    }

    if (!suggestedRewardName.trim()) {
      setError('Please enter a suggested reward name (e.g. LCD TV, Smartphone).');
      return;
    }

    try {
      await onSubmit({
        minPoints: min,
        maxPoints: max,
        suggestedRewardName: suggestedRewardName.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save reward tier.');
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
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Reward Tier' : 'Create Reward Tier'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure point thresholds and suggested incentive
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

        {/* Error notification banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Minimum Points <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 100"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Maximum Points <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 199"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Suggested Reward Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 32-inch LED TV, Double Door Refrigerator"
              value={suggestedRewardName}
              onChange={(e) => setSuggestedRewardName(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Painters whose active cycle points fall in this range will see this reward suggested.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isSubmitting ? 'Saving…' : isEditing ? 'Update Tier' : 'Create Tier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
