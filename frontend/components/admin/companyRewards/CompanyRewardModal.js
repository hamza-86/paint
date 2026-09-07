'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const INITIAL_REWARD_ITEM = { name: '', quantity: 1 };

function parseLocalDate(val) {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export default function CompanyRewardModal({
  isOpen,
  onClose,
  onSubmit,
  entry = null,
  companies = [],
  isSubmitting = false,
}) {
  const isEditing = Boolean(entry);

  const [companyId, setCompanyId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quantitySold, setQuantitySold] = useState('');
  const [saleValue, setSaleValue] = useState('');
  const [rewardItems, setRewardItems] = useState([{ ...INITIAL_REWARD_ITEM }]);
  const [error, setError] = useState('');

  // Available companies rule:
  // In create mode: strictly active companies only.
  // In edit mode: active companies + the entry's company (even if deactivated, to preserve historical reference).
  const selectableCompanies = useMemo(() => {
    const active = companies.filter((c) => c.status === 'active');
    if (!isEditing || !entry) return active;

    const entryCompanyId = entry.company?.id || String(entry.companyId || '');
    const hasEntryCompany = active.some((c) => (c.id || c._id) === entryCompanyId);

    if (!hasEntryCompany && entry.company) {
      return [
        {
          id: entry.company.id || entryCompanyId,
          name: `${entry.company.name} (Deactivated)`,
          status: 'deactivated',
        },
        ...active,
      ];
    }
    return active;
  }, [companies, isEditing, entry]);

  // Reset form when modal opens/closes or entry changes
  useEffect(() => {
    if (isOpen) {
      if (entry) {
        setCompanyId(entry.company?.id || String(entry.companyId || ''));
        setDateFrom(parseLocalDate(entry.dateFrom));
        setDateTo(parseLocalDate(entry.dateTo));
        setQuantitySold(entry.quantitySold !== undefined ? String(entry.quantitySold) : '');
        setSaleValue(entry.saleValue !== undefined ? String(entry.saleValue) : '');
        setRewardItems(
          Array.isArray(entry.rewardItems) && entry.rewardItems.length > 0
            ? entry.rewardItems.map((i) => ({
                id: i._id || i.id,
                name: i.name || '',
                quantity: i.quantity || 1,
              }))
            : [{ ...INITIAL_REWARD_ITEM }]
        );
      } else {
        setCompanyId(selectableCompanies.length === 1 ? (selectableCompanies[0].id || selectableCompanies[0]._id) : '');
        setDateFrom('');
        setDateTo('');
        setQuantitySold('');
        setSaleValue('');
        setRewardItems([{ ...INITIAL_REWARD_ITEM }]);
      }
      setError('');
    }
  }, [isOpen, entry, selectableCompanies]);

  // ── Reward Items helpers ──────────────────────────────────────────────────

  const handleAddRewardItem = useCallback(() => {
    setRewardItems((prev) => [...prev, { ...INITIAL_REWARD_ITEM }]);
  }, []);

  const handleRemoveRewardItem = useCallback((index) => {
    setRewardItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleRewardItemChange = useCallback((index, field, value) => {
    setRewardItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }, []);

  // ── Submission ────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!companyId) {
      setError('Please select a company.');
      return;
    }
    if (!dateFrom) {
      setError('Start date is required.');
      return;
    }
    if (!dateTo) {
      setError('End date is required.');
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      setError('Start date must be on or before end date.');
      return;
    }

    const qty = Number(quantitySold);
    if (quantitySold === '' || isNaN(qty) || qty < 0) {
      setError('Quantity sold must be a non-negative number.');
      return;
    }

    const sale = Number(saleValue);
    if (saleValue === '' || isNaN(sale) || sale < 0) {
      setError('Sale value must be a non-negative number.');
      return;
    }

    // Validate structured reward items
    if (!rewardItems || rewardItems.length === 0) {
      setError('At least one reward item is required.');
      return;
    }

    for (let i = 0; i < rewardItems.length; i++) {
      const item = rewardItems[i];
      if (!item.name || !String(item.name).trim()) {
        setError(`Reward item #${i + 1} must have a product / reward name.`);
        return;
      }
      const itemQty = Number(item.quantity);
      if (isNaN(itemQty) || itemQty < 1 || !Number.isInteger(itemQty)) {
        setError(`Reward item #${i + 1} ("${item.name}") quantity must be a positive whole number (>= 1).`);
        return;
      }
    }

    try {
      await onSubmit({
        companyId,
        dateFrom,
        dateTo,
        quantitySold: qty,
        saleValue: sale,
        rewardItems: rewardItems.map((item) => ({
          ...(item.id || item._id ? { _id: item.id || item._id } : {}),
          name: String(item.name).trim(),
          quantity: Number(item.quantity),
        })),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save entry. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cr-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="14" x="3" y="8" rx="2" />
                <path d="M12 5a3 3 0 1 0-3 3" />
                <path d="M12 5a3 3 0 1 1 3 3" />
                <path d="M12 8v14" />
                <path d="M3 12h18" />
              </svg>
            </div>
            <div>
              <h2 id="cr-modal-title" className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Company Incentive' : 'Log Company Incentive'}
              </h2>
              <p className="text-xs text-slate-400">
                Record structured incentive rewards received from paint manufacturers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
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
        <form id="company-reward-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Error banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Section: Company & Period */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Company & Period
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                  required
                >
                  <option value="">— Select Company —</option>
                  {selectableCompanies.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Period Start <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Period End <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Sales Performance */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sales Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Sold <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1250"
                  value={quantitySold}
                  onChange={(e) => setQuantitySold(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sale Value (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 2500000"
                  value={saleValue}
                  onChange={(e) => setSaleValue(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Structured Reward Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Reward Items Received <span className="text-red-500">*</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Add specific reward products and quantities received
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRewardItem}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                + Add Reward
              </button>
            </div>

            <div className="space-y-2.5">
              {rewardItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="e.g. Samsung 43-inch Smart TV, Refrigerator, AC"
                      value={item.name}
                      onChange={(e) => handleRewardItemChange(index, 'name', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      required
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleRewardItemChange(index, 'quantity', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-center"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRewardItem(index)}
                    disabled={isSubmitting || rewardItems.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                    title="Remove item"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="company-reward-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : isEditing ? (
              'Update Record'
            ) : (
              'Save Incentive'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
