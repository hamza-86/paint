'use client';

/**
 * /admin/rewards/assign — Part 12: Painter Reward Assignment
 *
 * Flow:
 *  1. Admin selects a painter from the active-painter list.
 *  2. System fetches eligibility: cycle points, matched tier, available inventory.
 *  3. Admin selects an inventory item (pre-selected if tier matches), sets qty, adds optional note.
 *  4. Confirm → atomic POST → inventory decremented, assignment record created.
 *  5. Assignment history table shows all past assignments with filters.
 */

import React, { useState, useMemo } from 'react';
import { useAssignments, useCreateAssignment, usePainterEligibility } from '../../../../lib/hooks/usePainterRewardAssignments';
import { usePainters } from '../../../../lib/hooks/usePainters';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Badge({ children, color = 'slate' }) {
  const colors = {
    green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    red: 'bg-red-500/15 text-red-400 border border-red-500/30',
    slate: 'bg-slate-700/60 text-slate-300 border border-slate-600/40',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

function Toast({ message, type, onClose }) {
  if (!message) return null;
  const bg = type === 'error' ? 'bg-red-600' : 'bg-emerald-600';
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium ${bg} max-w-sm`}>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white ml-2">✕</button>
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

  const { activeCycle, points, suggestedTier, suggestedInventoryItems = [], previousAssignments = [] } = eligibility?.data?.data || {};

  const selectedItem = suggestedInventoryItems.find(i => (i._id || i.id) === selectedItemId);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!selectedItemId) { setError('Please select a reward item.'); return; }
    if (!qty || qty < 1) { setError('Quantity must be at least 1.'); return; }
    if (selectedItem && qty > selectedItem.remainingQty) {
      setError(`Only ${selectedItem.remainingQty} unit(s) available.`);
      return;
    }
    createAssignment.mutate(
      {
        painterId: painter.id || painter._id,
        rewardInventoryItemId: selectedItemId,
        qty: Number(qty),
        notes: notes.trim(),
      },
      {
        onSuccess: (data) => onSuccess(data),
        onError: (err) => setError(err.message || 'Failed to assign reward.'),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Assign Reward</h2>
            <p className="text-slate-400 text-sm mt-0.5">Painter: <span className="text-white font-semibold">{painter.firstName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Eligibility card */}
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cycle Eligibility</h3>
            {!activeCycle ? (
              <p className="text-amber-400 text-sm">⚠ No active cycle. Points cannot be calculated.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Cycle Period</div>
                  <div className="text-sm font-semibold text-white">{fmt(activeCycle.startDate)} → {fmt(activeCycle.endDate)}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Points Earned</div>
                  <div className="text-2xl font-bold text-blue-400">{points?.toLocaleString() ?? 0}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-3 col-span-2">
                  <div className="text-xs text-slate-500 mb-1">Suggested Tier</div>
                  {suggestedTier ? (
                    <div className="flex items-center gap-2">
                      <Badge color="purple">{suggestedTier.minPoints.toLocaleString()} – {suggestedTier.maxPoints.toLocaleString()} pts</Badge>
                      <span className="text-sm font-semibold text-purple-300">{suggestedTier.suggestedRewardName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">No tier matched for {points} points</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Previous assignments this cycle */}
          {previousAssignments.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Already Assigned This Cycle</h3>
              <div className="space-y-1.5">
                {previousAssignments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{a.rewardName}</span>
                    <span className="text-amber-400 font-semibold">× {a.qty}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-500/70 mt-2">Admin can still assign additional rewards.</p>
            </div>
          )}

          {/* Reward item selector */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Select Reward Item <span className="text-red-400">*</span></label>
            {suggestedInventoryItems.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 text-center text-slate-400 text-sm">
                No active inventory items with available stock.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                {suggestedInventoryItems.map(item => {
                  const id = item._id || item.id;
                  const selected = selectedItemId === id;
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => setSelectedItemId(id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-500/10 shadow-sm shadow-blue-500/20'
                          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60'
                      }`}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="14" x="3" y="8" rx="2"/><path d="M12 5a3 3 0 1 0-3 3"/><path d="M12 5a3 3 0 1 1 3 3"/></svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.remainingQty} of {item.totalQty} available</div>
                      </div>
                      {selected && (
                        <svg className="w-5 h-5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label htmlFor="assign-qty" className="text-sm font-semibold text-slate-300">Quantity <span className="text-red-400">*</span></label>
            <input
              id="assign-qty"
              type="number"
              min={1}
              max={selectedItem?.remainingQty || 9999}
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {selectedItem && (
              <p className="text-xs text-slate-500">Max available: <span className="text-slate-300 font-semibold">{selectedItem.remainingQty}</span></p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="assign-notes" className="text-sm font-semibold text-slate-300">Admin Notes <span className="text-slate-500">(optional)</span></label>
            <textarea
              id="assign-notes"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Override — exceptional performance this quarter"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-xs text-slate-500">{notes.length}/500</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAssignment.isPending || !selectedItemId}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {createAssignment.isPending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assigning…</>
              ) : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Painter Picker ────────────────────────────────────────────────────────────

function PainterPicker({ selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePainters({ search, status: 'active', limit: 50 });
  const painters = data?.painters || data?.data?.painters || [];

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-base font-bold text-white">Select Painter</h2>
        <p className="text-slate-400 text-xs mt-0.5">Choose an active painter to assign a reward</p>
      </div>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          id="painter-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search painters…"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-slate-500 text-sm">Loading painters…</div>
      ) : painters.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">No active painters found.</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {painters.map(p => {
            const id = p.id || p._id;
            const active = selectedId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(p)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60'
                }`}
              >
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.firstName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                    {p.firstName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{p.firstName}</div>
                  <div className="text-xs text-slate-400 truncate">{p.mobile}</div>
                </div>
                {active && <svg className="w-5 h-5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Assignment History Table ───────────────────────────────────────────────────

function AssignmentHistory({ filters, onFilterChange }) {
  const { data, isLoading, isError } = useAssignments(filters);
  const assignments = data?.data?.assignments || [];
  const pagination = data?.data?.pagination || {};
  const summary = data?.data?.summary || {};

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Assignment History</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {summary.totalAssignments ?? 0} total · {summary.totalQtyAssigned ?? 0} items assigned · {summary.uniquePaintersCount ?? 0} painters
          </p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            value={filters.search || ''}
            onChange={e => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
            placeholder="Search by painter or reward…"
            className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-56"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-sm">Loading assignments…</div>
      ) : isError ? (
        <div className="py-16 text-center text-red-400 text-sm">Failed to load assignments.</div>
      ) : assignments.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm">No assignments found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Painter</th>
                  <th className="text-left px-6 py-3 font-semibold">Reward</th>
                  <th className="text-center px-4 py-3 font-semibold">Qty</th>
                  <th className="text-center px-4 py-3 font-semibold">Points</th>
                  <th className="text-left px-4 py-3 font-semibold">Notes</th>
                  <th className="text-left px-6 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assignments.map(a => (
                  <tr key={a._id || a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-semibold text-white">{a.painterName}</div>
                      <div className="text-xs text-slate-500">{a.painterId?.mobile || '—'}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {a.rewardInventoryItemId?.imageUrl ? (
                          <img src={a.rewardInventoryItemId.imageUrl} alt={a.rewardName} className="w-7 h-7 rounded object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="14" x="3" y="8" rx="2"/><path d="M12 5a3 3 0 1 0-3 3"/></svg>
                          </div>
                        )}
                        <span className="text-white">{a.rewardName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge color="blue">× {a.qty}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300 font-semibold">
                      {a.pointsAtAssignment?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[160px] truncate">{a.notes || '—'}</td>
                    <td className="px-6 py-3 text-slate-400 text-xs whitespace-nowrap">{fmt(a.date || a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-800/60">
            {assignments.map(a => (
              <div key={a._id || a.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-white text-sm">{a.painterName}</div>
                    <div className="text-xs text-slate-400">{a.painterId?.mobile || '—'}</div>
                  </div>
                  <Badge color="blue">× {a.qty}</Badge>
                </div>
                <div className="text-sm text-slate-300">{a.rewardName}</div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{a.pointsAtAssignment?.toLocaleString() ?? 0} pts</span>
                  <span>·</span>
                  <span>{fmt(a.date || a.createdAt)}</span>
                </div>
                {a.notes && <div className="text-xs text-slate-400 italic">{a.notes}</div>}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => onFilterChange({ ...filters, page: pagination.page - 1 })}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
                >← Prev</button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => onFilterChange({ ...filters, page: pagination.page + 1 })}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
                >Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PainterRewardAssignPage() {
  const [selectedPainter, setSelectedPainter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [historyFilters, setHistoryFilters] = useState({ page: 1, limit: 20 });

  const eligibility = usePainterEligibility(selectedPainter?.id || selectedPainter?._id);

  function handlePainterSelect(p) {
    setSelectedPainter(p);
    setShowModal(false);
  }

  function handleAssignSuccess(data) {
    setShowModal(false);
    setToast({ message: `Reward "${data?.data?.assignment?.rewardName}" assigned to ${data?.data?.assignment?.painterName} successfully!`, type: 'success' });
    setTimeout(() => setToast(null), 5000);
  }

  const eligibilityData = eligibility.data?.data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Painter Reward Assignment</h1>
            <p className="text-slate-400 text-sm mt-1">Assign physical rewards from inventory to painters based on cycle performance</p>
          </div>
          <button
            id="btn-assign-reward"
            onClick={() => { if (selectedPainter) setShowModal(true); }}
            disabled={!selectedPainter}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Assign Reward
          </button>
        </div>

        {/* Top section: painter picker + eligibility summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painter picker */}
          <PainterPicker selectedId={selectedPainter?.id || selectedPainter?._id} onSelect={handlePainterSelect} />

          {/* Eligibility panel */}
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white">Eligibility Summary</h2>

            {!selectedPainter ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <p className="text-slate-500 text-sm">Select a painter to view their eligibility</p>
              </div>
            ) : eligibility.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : eligibility.isError ? (
              <div className="text-red-400 text-sm text-center py-8">Failed to load eligibility data.</div>
            ) : (
              <div className="space-y-4">
                {/* Painter info */}
                <div className="flex items-center gap-3">
                  {selectedPainter.photoUrl ? (
                    <img src={selectedPainter.photoUrl} alt={selectedPainter.firstName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold">
                      {selectedPainter.firstName?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-white">{selectedPainter.firstName}</div>
                    <div className="text-xs text-slate-400">{selectedPainter.mobile}</div>
                  </div>
                </div>

                {/* Stats */}
                {eligibilityData?.activeCycle ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                      <div className="text-xs text-slate-500 mb-1">Points (Active Cycle)</div>
                      <div className="text-2xl font-bold text-blue-400">{(eligibilityData.points || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                      <div className="text-xs text-slate-500 mb-1">Suggested Reward</div>
                      {eligibilityData.suggestedTier ? (
                        <div className="text-sm font-semibold text-purple-300 leading-tight mt-1">{eligibilityData.suggestedTier.suggestedRewardName}</div>
                      ) : (
                        <div className="text-sm text-slate-400 mt-1">No tier matched</div>
                      )}
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 col-span-2">
                      <div className="text-xs text-slate-500 mb-1">Available Inventory Items</div>
                      <div className="text-lg font-bold text-emerald-400">{eligibilityData.suggestedInventoryItems?.length ?? 0} items in stock</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-amber-400 text-sm">
                    ⚠ No active cycle. Cannot compute points.
                  </div>
                )}

                {/* Assign button */}
                <button
                  id="btn-assign-from-panel"
                  onClick={() => setShowModal(true)}
                  disabled={!eligibilityData?.activeCycle}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-semibold transition-colors"
                >
                  Assign Reward to {selectedPainter.firstName}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Assignment History */}
        <AssignmentHistory filters={historyFilters} onFilterChange={setHistoryFilters} />
      </div>

      {/* Assignment Modal */}
      {showModal && selectedPainter && (
        <AssignModal
          painter={selectedPainter}
          eligibility={eligibility}
          onClose={() => setShowModal(false)}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Toast */}
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
