'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyRewards } from '@/lib/hooks/useCompanyRewards';
import { useRewardInventory } from '@/lib/hooks/useRewardInventory';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function RewardInventoryModal({
  isOpen,
  onClose,
  item = null, // null for create, object for edit
  onSubmit,
  isSubmitting = false,
}) {
  const isEdit = Boolean(item);

  // Form states
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [selectedRewardItemId, setSelectedRewardItemId] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [totalQty, setTotalQty] = useState(1);
  const [error, setError] = useState('');

  // Fetch company reward history for source selection (in create mode)
  const { data: companyRewardsData, isLoading: isLoadingRewards } = useCompanyRewards({
    limit: 100,
  });
  const rewardEntries = companyRewardsData?.data || [];

  // Fetch all existing inventory items to accurately calculate already added quantities
  const { data: inventoryData } = useRewardInventory({ limit: 200 });
  const existingInventoryItems = inventoryData?.data || [];

  // Reset or initialize form when opened or item changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEntryId('');
      setSelectedRewardItemId('');
      setName('');
      setImageUrl('');
      setTotalQty(1);
      setError('');
      return;
    }

    if (isEdit && item) {
      setName(item.name || '');
      setImageUrl(item.imageUrl || '');
      setTotalQty(item.totalQty || 1);
      setError('');
    } else {
      setSelectedEntryId('');
      setSelectedRewardItemId('');
      setName('');
      setImageUrl('');
      setTotalQty(1);
      setError('');
    }
  }, [isOpen, isEdit, item]);

  // The currently selected CompanyRewardEntry
  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null;
    return rewardEntries.find((e) => String(e.id) === String(selectedEntryId));
  }, [selectedEntryId, rewardEntries]);

  // The currently selected source reward item inside the entry
  const selectedRewardItem = useMemo(() => {
    if (!selectedEntry || !selectedRewardItemId) return null;
    return selectedEntry.rewardItems?.find(
      (ri) => String(ri._id || ri.id) === String(selectedRewardItemId)
    );
  }, [selectedEntry, selectedRewardItemId]);

  // Quantity calculations for selected reward item
  const { sourceQty, alreadyInInventory, availableToAdd } = useMemo(() => {
    if (!selectedRewardItem) {
      return { sourceQty: 0, alreadyInInventory: 0, availableToAdd: 0 };
    }
    const srcQty = Number(selectedRewardItem.quantity) || 0;
    const currentItemId = String(selectedRewardItem._id || selectedRewardItem.id);

    // Sum totalQty of existing inventory items referencing this subdocument
    const alreadyAllocated = existingInventoryItems
      .filter(
        (inv) =>
          String(inv.sourceCompanyRewardEntryId) === String(selectedEntryId) &&
          String(inv.sourceCompanyRewardItemId) === currentItemId
      )
      .reduce((sum, inv) => sum + (Number(inv.totalQty) || 0), 0);

    const avail = Math.max(0, srcQty - alreadyAllocated);
    return {
      sourceQty: srcQty,
      alreadyInInventory: alreadyAllocated,
      availableToAdd: avail,
    };
  }, [selectedRewardItem, existingInventoryItems, selectedEntryId]);

  // When a source reward item is selected in create mode, prefill defaults
  const handleSelectRewardItem = (itemId) => {
    setSelectedRewardItemId(itemId);
    setError('');
    const found = selectedEntry?.rewardItems?.find(
      (ri) => String(ri._id || ri.id) === String(itemId)
    );
    if (found) {
      setName(found.name || '');
      setImageUrl(found.imageUrl || '');

      // Calculate availability for this item
      const srcQty = Number(found.quantity) || 0;
      const alreadyAllocated = existingInventoryItems
        .filter(
          (inv) =>
            String(inv.sourceCompanyRewardEntryId) === String(selectedEntryId) &&
            String(inv.sourceCompanyRewardItemId) === String(found._id || found.id)
        )
        .reduce((sum, inv) => sum + (Number(inv.totalQty) || 0), 0);
      const avail = Math.max(0, srcQty - alreadyAllocated);
      setTotalQty(avail > 0 ? avail : 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isEdit) {
      if (!name.trim()) {
        setError('Reward item name cannot be blank.');
        return;
      }
      try {
        await onSubmit({
          name: name.trim(),
          imageUrl: imageUrl.trim(),
        });
      } catch (err) {
        setError(err.message || 'Failed to update reward inventory item.');
      }
      return;
    }

    // Create mode validations
    if (!selectedEntryId) {
      setError('Please select a Company Reward History record.');
      return;
    }
    if (!selectedRewardItemId) {
      setError('Please select a specific reward item from the chosen record.');
      return;
    }
    if (!name.trim()) {
      setError('Reward item name is required.');
      return;
    }
    const qty = Number(totalQty);
    if (isNaN(qty) || !Number.isInteger(qty) || qty < 1) {
      setError('Quantity must be a positive whole number.');
      return;
    }
    if (qty > availableToAdd) {
      setError(
        `Quantity cannot exceed available source reward quantity (${availableToAdd}).`
      );
      return;
    }

    try {
      await onSubmit({
        sourceCompanyRewardEntryId: selectedEntryId,
        sourceCompanyRewardItemId: selectedRewardItemId,
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        totalQty: qty,
        remainingQty: qty,
      });
    } catch (err) {
      setError(err.message || 'Failed to create reward inventory item.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Edit Reward Inventory' : 'Add Reward Inventory'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? 'Update reward item metadata'
                : 'Convert company rewards into painter-redeemable inventory'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* EDIT MODE: Read-only source context */}
          {isEdit && item && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  Originating Company
                </span>
                <span className="font-bold text-slate-800">
                  {item.sourceReward?.company?.name || 'Company Reward'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  Reward Period
                </span>
                <span>
                  {formatDate(item.sourceReward?.dateFrom)} – {formatDate(item.sourceReward?.dateTo)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-slate-700">
                <span>
                  Total Qty: <strong className="text-slate-900">{item.totalQty}</strong>
                </span>
                <span>
                  Remaining: <strong className="text-emerald-700">{item.remainingQty}</strong>
                </span>
                <span>
                  Assigned: <strong className="text-blue-700">{item.assignedQty || 0}</strong>
                </span>
              </div>
            </div>
          )}

          {/* CREATE MODE: Select Company Reward Entry */}
          {!isEdit && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Select Company Reward Entry <span className="text-rose-500">*</span>
                </label>
                {isLoadingRewards ? (
                  <div className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400">
                    Loading company reward history...
                  </div>
                ) : rewardEntries.length === 0 ? (
                  <div className="py-2.5 px-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    No Company Reward History records found. Log a company reward first.
                  </div>
                ) : (
                  <select
                    value={selectedEntryId}
                    onChange={(e) => {
                      setSelectedEntryId(e.target.value);
                      setSelectedRewardItemId('');
                      setName('');
                      setImageUrl('');
                      setError('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    required
                  >
                    <option value="">— Select a reward record —</option>
                    {rewardEntries.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.company?.name || 'Company'} ({formatDate(entry.dateFrom)} –{' '}
                        {formatDate(entry.dateTo)}) — {entry.rewardReceivedDescription}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Entry Overview & Reward Item Selector */}
              {selectedEntry && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-900">{selectedEntry.company?.name}</span>
                    <span className="text-blue-700 text-[11px]">
                      {formatDate(selectedEntry.dateFrom)} – {formatDate(selectedEntry.dateTo)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    "{selectedEntry.rewardReceivedDescription}"
                  </p>

                  <div className="pt-2 border-t border-blue-100">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      2. Choose Specific Reward Item <span className="text-rose-500">*</span>
                    </label>

                    {selectedEntry.rewardItems && selectedEntry.rewardItems.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {selectedEntry.rewardItems.map((ri) => {
                          const riId = String(ri._id || ri.id);
                          const isSelected = selectedRewardItemId === riId;

                          // Compute availability for each item badge
                          const allocated = existingInventoryItems
                            .filter(
                              (inv) =>
                                String(inv.sourceCompanyRewardEntryId) === String(selectedEntryId) &&
                                String(inv.sourceCompanyRewardItemId) === riId
                            )
                            .reduce((sum, inv) => sum + (Number(inv.totalQty) || 0), 0);
                          const avail = Math.max(0, (Number(ri.quantity) || 0) - allocated);

                          return (
                            <label
                              key={riId}
                              onClick={() => handleSelectRewardItem(riId)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="rewardItemRadio"
                                  checked={isSelected}
                                  onChange={() => handleSelectRewardItem(riId)}
                                  className="accent-blue-600"
                                />
                                <span className="text-xs sm:text-sm font-semibold">{ri.name}</span>
                              </div>
                              <div className="text-right text-xs">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isSelected
                                      ? 'bg-blue-500 text-white'
                                      : avail > 0
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {avail > 0 ? `${avail} of ${ri.quantity} available` : 'Fully allocated'}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700">No items defined on this record.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Live Allocation Breakdown Box */}
              {selectedRewardItem && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Source Qty
                      </p>
                      <p className="text-base font-bold text-slate-800 mt-0.5">{sourceQty}</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        In Inventory
                      </p>
                      <p className="text-base font-bold text-blue-700 mt-0.5">{alreadyInInventory}</p>
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        availableToAdd > 0
                          ? 'bg-emerald-50/50 border-emerald-100'
                          : 'bg-rose-50/50 border-rose-100'
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Available to Add
                      </p>
                      <p
                        className={`text-base font-bold mt-0.5 ${
                          availableToAdd > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {availableToAdd}
                      </p>
                    </div>
                  </div>

                  {availableToAdd === 0 && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-2.5 text-center">
                      ⚠️ All units received from this reward item have already been added to inventory.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reward Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reward Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sony 43&quot; 4K Smart TV"
              maxLength={120}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Quantity Input (In Create mode) */}
          {!isEdit && selectedRewardItem && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Quantity to Add to Inventory <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Max: {availableToAdd}</span>
              </div>
              <input
                type="number"
                value={totalQty}
                min={1}
                max={availableToAdd > 0 ? availableToAdd : 1}
                disabled={availableToAdd === 0}
                onChange={(e) => setTotalQty(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                required
              />
            </div>
          )}

          {/* Image URL with Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Image URL <span className="text-slate-400 text-[10px] normal-case">(Optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/reward.jpg"
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
              />
              {imageUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isEdit && availableToAdd === 0)}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>{isEdit ? 'Save Changes' : 'Add to Inventory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
