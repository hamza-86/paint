'use client';

/**
 * /admin/rewards/assign — Painter Reward Assignment
 *
 * Visually consistent with the clean white/light admin style:
 *  - White/light background, white cards, subtle borders, blue primary buttons
 *  - Responsive layout (stacked on small screens, 2-column on desktop)
 *  - Displays painter's active cycle points, matched tier, suggested inventory reward
 *  - Allows admin to select and override actual reward from in-stock RewardInventoryItem
 *  - Real reward data with broken-image fallback handling in history
 */

import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import {
  useAssignments,
  useCreateAssignment,
  usePainterEligibility,
} from '@/lib/hooks/usePainterRewardAssignments';
import { usePainters } from '@/lib/hooks/usePainters';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function Badge({ children, color = 'slate' }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    red: 'bg-rose-50 text-rose-700 border border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        colors[color] || colors.slate
      }`}
    >
      {children}
    </span>
  );
}

// ── Safe Reward Image Component with Fallback ─────────────────────────────────

function SafeRewardImage({ src, alt, className = 'w-9 h-9' }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  return (
    <div
      className={`${className} rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 text-amber-600`}
    >
      {!hasError && src ? (
        <img
          src={src}
          alt={alt || 'Reward'}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="14" x="3" y="8" rx="2" />
          <path d="M12 5a3 3 0 1 0-3 3" />
          <path d="M12 5a3 3 0 1 1 3 3" />
          <path d="M12 8v14" />
          <path d="M3 12h18" />
        </svg>
      )}
    </div>
  );
}

// ── Assignment Modal ──────────────────────────────────────────────────────────

function AssignModal({ painter, eligibility, onClose, onSuccess }) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const createAssignment = useCreateAssignment();
  const {
    activeCycle,
    points = 0,
    suggestedTier,
    suggestedInventoryItems = [],
    previousAssignments = [],
  } = eligibility?.data?.data || {};

  // Pre-select suggested inventory item if available
  useEffect(() => {
    if (suggestedTier?.suggestedInventoryItemId) {
      const match = suggestedInventoryItems.find(
        (i) => (i._id || i.id) === suggestedTier.suggestedInventoryItemId
      );
      if (match && match.remainingQty > 0) {
        setSelectedItemId(match._id || match.id);
        return;
      }
    }
    // Fallback: if suggested reward name matches any inventory item
    if (suggestedTier?.suggestedRewardName) {
      const match = suggestedInventoryItems.find(
        (i) =>
          String(i.name).trim().toLowerCase() ===
          String(suggestedTier.suggestedRewardName).trim().toLowerCase()
      );
      if (match && match.remainingQty > 0) {
        setSelectedItemId(match._id || match.id);
        return;
      }
    }
    // Default to first available item
    if (suggestedInventoryItems.length > 0) {
      setSelectedItemId(suggestedInventoryItems[0]._id || suggestedInventoryItems[0].id);
    }
  }, [suggestedTier, suggestedInventoryItems]);

  const selectedItem = suggestedInventoryItems.find(
    (i) => (i._id || i.id) === selectedItemId
  );

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!activeCycle) {
      setError('Cannot assign reward: No active reward cycle.');
      return;
    }
    if (!selectedItemId) {
      setError('Please select a reward item from inventory.');
      return;
    }
    const qtyNum = Number(qty);
    if (!qtyNum || qtyNum < 1 || !Number.isInteger(qtyNum)) {
      setError('Quantity must be a positive whole number (>= 1).');
      return;
    }
    if (selectedItem && qtyNum > selectedItem.remainingQty) {
      setError(`Only ${selectedItem.remainingQty} unit(s) of "${selectedItem.name}" are available in stock.`);
      return;
    }

    createAssignment.mutate(
      {
        painterId: painter.id || painter._id,
        rewardInventoryItemId: selectedItemId,
        cycleId: activeCycle.id || activeCycle._id,
        qty: qtyNum,
        notes: notes.trim(),
      },
      {
        onSuccess: (data) => onSuccess(data),
        onError: (err) => setError(err.message || 'Failed to assign reward.'),
      }
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <div>
              <h2 id="assign-modal-title" className="text-base font-bold text-slate-900">
                Assign Reward
              </h2>
              <p className="text-xs text-slate-500">
                Assigning to <span className="font-semibold text-slate-800">{painter.firstName}</span> ({painter.mobile || 'No Mobile'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="assign-reward-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Error banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Cycle & Eligibility Overview */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Cycle & Eligibility
              </h3>
              {activeCycle ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Cycle
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  No Active Cycle
                </span>
              )}
            </div>

            {!activeCycle ? (
              <p className="text-xs text-rose-600 font-medium">
                ⚠ No active cycle exists or the previous cycle has expired. Reward assignment cannot be processed.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block">Cycle Period</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {fmt(activeCycle.startDate)} → {fmt(activeCycle.endDate)}
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block">Current Cycle Points</span>
                  <span className="text-lg font-extrabold text-blue-600 mt-0.5 block">
                    {points.toLocaleString()} pts
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block">Suggested Reward</span>
                  {suggestedTier ? (
                    <div className="mt-0.5">
                      <span className="text-xs font-bold text-purple-700 block truncate">
                        {suggestedTier.suggestedRewardName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Tier: {suggestedTier.minPoints}–{suggestedTier.maxPoints} pts
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 mt-0.5 block italic">
                      No tier matched ({points} pts)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Already Assigned This Cycle */}
          {previousAssignments.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Already Assigned in This Cycle
                </h4>
                <span className="text-xs text-amber-700 font-semibold">
                  {previousAssignments.length} assignment(s)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {previousAssignments.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs text-slate-700 font-medium shadow-2xs"
                  >
                    <span className="font-bold text-amber-700">{a.qty}×</span>
                    <span>{a.rewardName}</span>
                    <span className="text-[10px] text-slate-400">({fmt(a.date || a.createdAt)})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Select Reward Inventory Item */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Actual Reward Product to Give <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {suggestedInventoryItems.length} products available
              </span>
            </div>

            {suggestedInventoryItems.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
                No active reward inventory items in stock. Please record company incentives first.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {suggestedInventoryItems.map((item) => {
                  const id = item._id || item.id;
                  const isSelected = selectedItemId === id;
                  const isSuggested =
                    suggestedTier?.suggestedInventoryItemId === id ||
                    String(item.name).trim().toLowerCase() ===
                      String(suggestedTier?.suggestedRewardName || '').trim().toLowerCase();
                  const sourceName =
                    item.sourceCompanyRewardEntryId?.companyId?.name ||
                    item.sourceReward?.company?.name ||
                    '';

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedItemId(id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <SafeRewardImage src={item.imageUrl} alt={item.name} className="w-10 h-10" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </span>
                          {isSuggested && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                              Suggested by Tier
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-semibold text-emerald-600">
                            {item.remainingQty} available
                          </span>
                          <span>·</span>
                          <span>Total received: {item.totalQty}</span>
                          {sourceName && (
                            <>
                              <span>·</span>
                              <span className="truncate">Source: {sourceName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quantity & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label htmlFor="assign-qty" className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="assign-qty"
                type="number"
                min={1}
                max={selectedItem?.remainingQty || 1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                disabled={createAssignment.isPending || !selectedItem}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono text-center font-bold"
                required
              />
              {selectedItem && (
                <span className="text-[10px] text-slate-400 mt-1 block text-center">
                  Max: {selectedItem.remainingQty}
                </span>
              )}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="assign-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="assign-notes"
                type="text"
                maxLength={500}
                placeholder="e.g. Festival bumper reward, tier override approved by owner"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={createAssignment.isPending}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
              <span className="text-[10px] text-slate-400 mt-1 block text-right">
                {notes.length}/500
              </span>
            </div>
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={createAssignment.isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="assign-reward-form"
            disabled={createAssignment.isPending || !selectedItemId || !activeCycle}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            {createAssignment.isPending ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Assigning Reward...
              </>
            ) : (
              'Confirm & Deduct Stock'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Painter Picker Component ──────────────────────────────────────────────────

function PainterPicker({ selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePainters({ search, status: 'active', limit: 50 });
  const painters = data?.painters || data?.data?.painters || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">Select Active Painter</h2>
        <p className="text-slate-400 text-xs mt-0.5">
          Select a painter to view current cycle points and assign rewards
        </p>
      </div>

      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          id="painter-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by painter name or mobile..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-xs">Loading active painters...</div>
      ) : painters.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          No active painters found.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {painters.map((p) => {
            const id = p.id || p._id;
            const isSelected = selectedId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(p)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {p.photoUrl ? (
                  <img
                    src={p.photoUrl}
                    alt={p.firstName}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-2xs ${
                    p.photoUrl ? 'hidden' : ''
                  }`}
                >
                  {p.firstName?.[0]?.toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {p.firstName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{p.mobile || 'No Mobile'}</div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Assignment History Table Component ────────────────────────────────────────

function AssignmentHistory({ filters, onFilterChange }) {
  const { data, isLoading, isError } = useAssignments(filters);
  const assignments = data?.data?.assignments || [];
  const pagination = data?.data?.pagination || {};
  const summary = data?.data?.summary || {};

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Assignment History</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {summary.totalAssignments ?? 0} total assignments · {summary.totalQtyAssigned ?? 0} reward items given · {summary.uniquePaintersCount ?? 0} unique painters
          </p>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
            placeholder="Search painter or reward..."
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-full sm:w-60"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading assignment history...</div>
      ) : isError ? (
        <div className="py-16 text-center text-rose-600 text-xs font-semibold">
          Failed to load assignment history.
        </div>
      ) : assignments.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          No rewards assigned yet. Select a painter above to assign their first reward.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Painter</th>
                  <th className="px-6 py-3.5">Reward Given</th>
                  <th className="px-4 py-3.5 text-center">Qty</th>
                  <th className="px-4 py-3.5 text-center">Points at Award</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-6 py-3.5 text-right">Award Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assignments.map((a) => {
                  const itemImg = a.rewardInventoryItemId?.imageUrl || a.rewardImageUrl || '';
                  return (
                    <tr key={a._id || a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900">{a.painterName}</div>
                        <div className="text-[11px] text-slate-400">{a.painterId?.mobile || '—'}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <SafeRewardImage src={itemImg} alt={a.rewardName} className="w-8 h-8" />
                          <div>
                            <span className="font-bold text-slate-900">{a.rewardName}</span>
                            {a.suggestedTierName && (
                              <span className="text-[10px] text-purple-600 block">
                                Tier: {a.suggestedTierName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge color="blue">× {a.qty}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                        {a.pointsAtAssignment?.toLocaleString() ?? 0} pts
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 max-w-[180px] truncate">
                        {a.notes || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-500 whitespace-nowrap">
                        {fmt(a.date || a.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {assignments.map((a) => {
              const itemImg = a.rewardInventoryItemId?.imageUrl || a.rewardImageUrl || '';
              return (
                <div key={a._id || a.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{a.painterName}</div>
                      <div className="text-[11px] text-slate-400">{a.painterId?.mobile || '—'}</div>
                    </div>
                    <Badge color="blue">× {a.qty}</Badge>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <SafeRewardImage src={itemImg} alt={a.rewardName} className="w-9 h-9" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{a.rewardName}</div>
                      <div className="text-[10px] text-slate-400">
                        Awarded at {a.pointsAtAssignment?.toLocaleString() ?? 0} pts
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>{fmt(a.date || a.createdAt)}</span>
                    {a.notes && <span className="italic truncate max-w-[160px]">{a.notes}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => onFilterChange({ ...filters, page: pagination.page - 1 })}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => onFilterChange({ ...filters, page: pagination.page + 1 })}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function PainterRewardAssignPage() {
  const [selectedPainter, setSelectedPainter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [historyFilters, setHistoryFilters] = useState({ page: 1, limit: 20 });

  const eligibility = usePainterEligibility(selectedPainter?.id || selectedPainter?._id);

  function handlePainterSelect(p) {
    setSelectedPainter(p);
  }

  function handleAssignSuccess(data) {
    setShowModal(false);
    const assignedName = data?.data?.assignment?.rewardName || 'Reward';
    const painterName = data?.data?.assignment?.painterName || 'Painter';
    setToast({
      message: `"${assignedName}" assigned to ${painterName} successfully!`,
      type: 'success',
    });
    setTimeout(() => setToast(null), 5000);
  }

  const eligibilityData = eligibility.data?.data;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-xs font-semibold animate-in slide-in-from-bottom-4 duration-200 ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white ml-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Painter Reward Assignment"
        subtitle="Assign earned reward inventory products to painters based on current cycle performance."
        primaryAction={{
          label: '+ Assign Reward',
          onClick: () => {
            if (selectedPainter) setShowModal(true);
          },
          disabled: !selectedPainter || !eligibilityData?.activeCycle,
        }}
      />

      {/* Top 2-Column Section: Painter Picker + Eligibility Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Painter Picker */}
        <PainterPicker
          selectedId={selectedPainter?.id || selectedPainter?._id}
          onSelect={handlePainterSelect}
        />

        {/* Right: Eligibility & Assignment Summary Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Eligibility & Reward Status</h2>
            {selectedPainter && eligibilityData?.activeCycle && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Cycle Active
              </span>
            )}
          </div>

          {!selectedPainter ? (
            <div className="flex flex-col items-center justify-center py-14 text-center space-y-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="max-w-xs">
                <p className="text-xs font-bold text-slate-700">No Painter Selected</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Choose an active painter from the list on the left to review their points, eligible tier, and assign rewards.
                </p>
              </div>
            </div>
          ) : eligibility.isLoading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-7 h-7 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 mt-2 font-medium">Computing eligibility...</p>
            </div>
          ) : eligibility.isError ? (
            <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200 font-semibold">
              Failed to load painter eligibility data.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Painter Info Card */}
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                {selectedPainter.photoUrl ? (
                  <img
                    src={selectedPainter.photoUrl}
                    alt={selectedPainter.firstName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-sm shadow-2xs ${
                    selectedPainter.photoUrl ? 'hidden' : ''
                  }`}
                >
                  {selectedPainter.firstName?.[0]?.toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {selectedPainter.firstName}
                    </span>
                    <Badge color="green">Active</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Mobile: <span className="font-mono">{selectedPainter.mobile || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              {eligibilityData?.activeCycle ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Current Cycle Points
                    </span>
                    <span className="text-2xl font-black text-blue-600 mt-1 block">
                      {(eligibilityData.points || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {fmt(eligibilityData.activeCycle.startDate)} → {fmt(eligibilityData.activeCycle.endDate)}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Matched Reward Tier
                    </span>
                    {eligibilityData.suggestedTier ? (
                      <div className="mt-1">
                        <span className="text-xs font-black text-purple-700 block truncate">
                          {eligibilityData.suggestedTier.suggestedRewardName}
                        </span>
                        <span className="text-[10px] text-purple-600/80 mt-0.5 block">
                          Tier: {eligibilityData.suggestedTier.minPoints}–{eligibilityData.suggestedTier.maxPoints} pts
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 mt-1.5 block italic">
                        No tier matched
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Reward Inventory Status
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                        {eligibilityData.suggestedInventoryItems?.length ?? 0} active reward products with stock
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      In Stock
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <p className="font-bold">⚠ No Active Reward Cycle</p>
                  <p className="text-[11px] mt-0.5 text-rose-600">
                    Cannot calculate cycle points or assign rewards. Please activate a new reward cycle under Cycles.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                id="btn-assign-reward-action"
                type="button"
                onClick={() => setShowModal(true)}
                disabled={!eligibilityData?.activeCycle}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
                Assign Reward to {selectedPainter.firstName}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full-width Bottom Section: Assignment History */}
      <AssignmentHistory filters={historyFilters} onFilterChange={setHistoryFilters} />

      {/* Modal Dialog */}
      {showModal && selectedPainter && (
        <AssignModal
          painter={selectedPainter}
          eligibility={eligibility}
          onClose={() => setShowModal(false)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}
