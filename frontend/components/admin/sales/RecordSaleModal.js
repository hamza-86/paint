'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePainters } from '@/lib/hooks/usePainters';
import { useItems } from '@/lib/hooks/useItems';
import { useCreateSale } from '@/lib/hooks/useSales';

const getTodayString = () => new Date().toISOString().slice(0, 10);

export default function RecordSaleModal({
  isOpen,
  onClose,
  onSuccess,
  activeCycle,
}) {
  const [painterId, setPainterId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [saleDate, setSaleDate] = useState(getTodayString());
  const [billImageUrl, setBillImageUrl] = useState('');
  const [lineItems, setLineItems] = useState([
    { itemId: '', quantity: 1 },
  ]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Fetch active painters only
  const { data: paintersData, isLoading: loadingPainters } = usePainters({
    status: 'active',
    limit: 100,
  });
  // Fetch active items only
  const { data: itemsData, isLoading: loadingItems } = useItems({
    status: 'active',
    limit: 100,
  });

  const painters = paintersData?.data || [];
  const items = itemsData?.data || [];

  const itemsMap = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      map.set(String(it.id), it);
    }
    return map;
  }, [items]);

  const createMutation = useCreateSale();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPainterId('');
      setCustomerName('');
      setCustomerMobile('');
      setSaleDate(getTodayString());
      setBillImageUrl('');
      setLineItems([{ itemId: '', quantity: 1 }]);
      setErrors({});
      setServerError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Add line item
  const handleAddLineItem = () => {
    setLineItems((prev) => [...prev, { itemId: '', quantity: 1 }]);
  };

  // Remove line item
  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update line item
  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      if (field === 'quantity') {
        const parsed = parseInt(value, 10);
        next[index] = { ...next[index], quantity: isNaN(parsed) ? '' : Math.max(1, parsed) };
      } else if (field === 'itemId') {
        // Prevent duplicate item selection
        const duplicateIndex = prev.findIndex((li, i) => i !== index && li.itemId === value && value !== '');
        if (duplicateIndex !== -1) {
          alert('This item is already added to the sale. Please adjust its quantity instead.');
          return prev;
        }
        next[index] = { ...next[index], itemId: value };
      }
      return next;
    });
  };

  // Calculate live preview totals
  let calculatedTotalAmount = 0;
  let calculatedTotalPoints = 0;
  for (const li of lineItems) {
    if (li.itemId && itemsMap.has(li.itemId)) {
      const item = itemsMap.get(li.itemId);
      const qty = typeof li.quantity === 'number' && li.quantity > 0 ? li.quantity : 0;
      calculatedTotalAmount += (item.price || 0) * qty;
      calculatedTotalPoints += (item.points || 0) * qty;
    }
  }

  // Validate form
  const validate = () => {
    const errs = {};

    if (!activeCycle) {
      errs.activeCycle = 'Cannot record sale: No active reward cycle exists.';
    }

    if (!painterId) {
      errs.painterId = 'Please select a referring painter.';
    }

    if (!customerName.trim()) {
      errs.customerName = 'Customer name is required.';
    }

    if (!customerMobile.trim()) {
      errs.customerMobile = 'Customer mobile number is required.';
    } else if (customerMobile.trim().length < 7) {
      errs.customerMobile = 'Enter a valid mobile number.';
    }

    if (!saleDate) {
      errs.saleDate = 'Sale date is required.';
    } else if (activeCycle) {
      const sDate = new Date(saleDate);
      const cStart = new Date(activeCycle.startDate);
      const cEnd = new Date(activeCycle.endDate);
      const sDateOnly = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());
      const cStartOnly = new Date(cStart.getFullYear(), cStart.getMonth(), cStart.getDate());
      const cEndOnly = new Date(cEnd.getFullYear(), cEnd.getMonth(), cEnd.getDate());

      if (sDateOnly < cStartOnly || sDateOnly > cEndOnly) {
        errs.saleDate = `Date must fall within active cycle range (${activeCycle.startDate.slice(0, 10)} to ${activeCycle.endDate.slice(0, 10)}).`;
      }
    }

    if (billImageUrl.trim()) {
      try {
        new URL(billImageUrl.trim());
      } catch {
        errs.billImageUrl = 'Please enter a valid URL (e.g. https://...).';
      }
    }

    const itemErrors = [];
    if (!lineItems || lineItems.length === 0) {
      errs.lineItems = 'At least one line item is required.';
    } else {
      lineItems.forEach((li, idx) => {
        if (!li.itemId) {
          itemErrors[idx] = 'Select an item.';
        } else if (!li.quantity || typeof li.quantity !== 'number' || li.quantity < 1) {
          itemErrors[idx] = 'Quantity must be at least 1.';
        }
      });
      if (itemErrors.length > 0) {
        errs.itemErrors = itemErrors;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      painterId,
      customer: {
        name: customerName.trim(),
        mobile: customerMobile.trim(),
      },
      date: saleDate,
      lineItems: lineItems.map((li) => ({
        itemId: li.itemId,
        quantity: li.quantity,
      })),
      billImageUrl: billImageUrl.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      if (onSuccess) onSuccess('Sale recorded successfully! Points credited to painter.');
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to record sale.');
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record Painter Sale</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Log referred purchase, snapshot item prices, and credit painter reward points.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Active Cycle Warning / Alert */}
          {!activeCycle ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>
                <strong>No Active Reward Cycle:</strong> A cycle must be open before recording sales. Please activate a cycle in Cycle Management.
              </span>
            </div>
          ) : (
            <div className="px-3 py-2 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Cycle: {activeCycle.startDate?.slice(0, 10)} → {activeCycle.endDate?.slice(0, 10)}
              </div>
              <span className="text-[11px] text-emerald-600">Points bound to this cycle</span>
            </div>
          )}

          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* Painter & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Painter Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Referring Painter <span className="text-red-500">*</span>
              </label>
              <select
                value={painterId}
                onChange={(e) => setPainterId(e.target.value)}
                disabled={isSubmitting || loadingPainters}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.painterId
                    ? 'border-red-300 focus:ring-red-100 focus:border-red-500 text-red-900'
                    : 'border-slate-200 focus:ring-emerald-100 focus:border-emerald-500 text-slate-800'
                }`}
              >
                <option value="">-- Select Active Painter --</option>
                {painters.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} ({p.mobile})
                  </option>
                ))}
              </select>
              {errors.painterId && (
                <p className="mt-1 text-[11px] text-red-600">{errors.painterId}</p>
              )}
            </div>

            {/* Sale Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sale Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                disabled={isSubmitting}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.saleDate
                    ? 'border-red-300 focus:ring-red-100 focus:border-red-500 text-red-900'
                    : 'border-slate-200 focus:ring-emerald-100 focus:border-emerald-500 text-slate-800'
                }`}
              />
              {errors.saleDate && (
                <p className="mt-1 text-[11px] text-red-600">{errors.saleDate}</p>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Customer Details (Auto-deduplicated by mobile)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Customer Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full text-xs px-3 py-2 rounded-lg border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    errors.customerMobile
                      ? 'border-red-300 focus:ring-red-100 focus:border-red-500'
                      : 'border-slate-200 focus:ring-emerald-100 focus:border-emerald-500'
                  }`}
                />
                {errors.customerMobile && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.customerMobile}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full text-xs px-3 py-2 rounded-lg border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    errors.customerName
                      ? 'border-red-300 focus:ring-red-100 focus:border-red-500'
                      : 'border-slate-200 focus:ring-emerald-100 focus:border-emerald-500'
                  }`}
                />
                {errors.customerName && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.customerName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-800">
                  Purchased Items <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Select active catalog items. Unit prices and points are permanently snapshotted.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLineItem}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {lineItems.map((li, index) => {
                const selectedItem = li.itemId ? itemsMap.get(li.itemId) : null;
                const qty = typeof li.quantity === 'number' && li.quantity > 0 ? li.quantity : 0;
                const lineTotal = selectedItem ? (selectedItem.price || 0) * qty : 0;
                const linePoints = selectedItem ? (selectedItem.points || 0) * qty : 0;
                const itemErr = errors.itemErrors?.[index];

                return (
                  <div
                    key={index}
                    className="p-3 bg-slate-50/60 border border-slate-200/70 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all"
                  >
                    {/* Item selector */}
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        value={li.itemId}
                        onChange={(e) => handleLineItemChange(index, 'itemId', e.target.value)}
                        disabled={isSubmitting || loadingItems}
                        className={`w-full text-xs px-3 py-2 rounded-lg border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                          itemErr
                            ? 'border-red-300 focus:ring-red-100 focus:border-red-500'
                            : 'border-slate-200 focus:ring-emerald-100 focus:border-emerald-500'
                        }`}
                      >
                        <option value="">-- Choose Item --</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name} ({it.brand || 'General'}) — ₹{it.price} | {it.points} pts
                          </option>
                        ))}
                      </select>
                      {itemErr && <p className="mt-1 text-[10px] text-red-600">{itemErr}</p>}
                    </div>

                    {/* Quantity */}
                    <div className="w-24 shrink-0">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Qty"
                          value={li.quantity}
                          onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                          disabled={isSubmitting}
                          className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 text-center font-semibold"
                        />
                      </div>
                    </div>

                    {/* Preview snapshots */}
                    <div className="w-full sm:w-48 shrink-0 flex items-center justify-between sm:justify-end gap-3 text-right">
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {selectedItem ? `₹${selectedItem.price} × ${qty}` : '—'}
                        </div>
                      </div>
                      <div className="pl-2 border-l border-slate-200">
                        <div className="text-xs font-bold text-emerald-600">
                          +{linePoints} pts
                        </div>
                        <div className="text-[10px] text-emerald-700/70">
                          {selectedItem ? `${selectedItem.points} pts × ${qty}` : '—'}
                        </div>
                      </div>

                      {/* Remove button */}
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          disabled={isSubmitting}
                          title="Remove item"
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.lineItems && (
              <p className="text-[11px] text-red-600">{errors.lineItems}</p>
            )}
          </div>

          {/* Optional Bill Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bill Image URL <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://example.com/invoices/bill-123.jpg"
              value={billImageUrl}
              onChange={(e) => setBillImageUrl(e.target.value)}
              disabled={isSubmitting}
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.billImageUrl
                  ? 'border-red-300 focus:ring-red-100 focus:border-red-500 text-red-900'
                  : 'border-slate-200 focus:ring-emerald-100 focus:border-emerald-500 text-slate-800'
              }`}
            />
            {errors.billImageUrl && (
              <p className="mt-1 text-[11px] text-red-600">{errors.billImageUrl}</p>
            )}
          </div>

          {/* Live Summary Footer Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Sale Summary Preview
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {lineItems.filter((l) => l.itemId).length} distinct items
              </div>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Amount</div>
                <div className="text-lg font-bold text-white">
                  ₹{calculatedTotalAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="pl-4 border-l border-slate-800">
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Total Points</div>
                <div className="text-lg font-bold text-emerald-400">
                  +{calculatedTotalPoints} pts
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !activeCycle}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Recording Sale...
                </>
              ) : (
                'Record & Credit Points'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
