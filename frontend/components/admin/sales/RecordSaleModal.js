'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePainters } from '@/lib/hooks/usePainters';
import { useItems } from '@/lib/hooks/useItems';
import { useCreateSale } from '@/lib/hooks/useSales';

const getTodayString = () => new Date().toISOString().slice(0, 10);

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

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
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Line items state: each item can be catalog or manual
  const [lineItems, setLineItems] = useState([
    {
      isManual: false,
      itemId: '',
      itemName: '',
      quantity: 1,
      pricePerUnit: '',
      pointsPerUnit: '',
    },
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

  const painters = paintersData?.painters || [];
  const items = itemsData?.items || [];

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
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLineItems([
        {
          isManual: false,
          itemId: '',
          itemName: '',
          quantity: 1,
          pricePerUnit: '',
          pointsPerUnit: '',
        },
      ]);
      setErrors({});
      setServerError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Add line item
  const handleAddLineItem = (isManual = false) => {
    setLineItems((prev) => [
      ...prev,
      {
        isManual,
        itemId: '',
        itemName: '',
        quantity: 1,
        pricePerUnit: '',
        pointsPerUnit: '',
      },
    ]);
  };

  // Remove line item
  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle item mode between Catalog and Manual
  const handleToggleMode = (index, isManual) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = {
        isManual,
        itemId: '',
        itemName: '',
        quantity: next[index].quantity || 1,
        pricePerUnit: '',
        pointsPerUnit: '',
      };
      return next;
    });
  };

  // Update line item fields
  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      const current = { ...next[index] };

      if (field === 'quantity') {
        const parsed = parseInt(value, 10);
        current.quantity = isNaN(parsed) ? '' : Math.max(1, parsed);
      } else if (field === 'itemId') {
        // Prevent duplicate catalog item selection
        const duplicateIndex = prev.findIndex(
          (li, i) => i !== index && !li.isManual && li.itemId === value && value !== ''
        );
        if (duplicateIndex !== -1) {
          alert('This item is already added to the sale. Please adjust its quantity instead.');
          return prev;
        }
        current.itemId = value;
        const catalogItem = itemsMap.get(value);
        if (catalogItem) {
          current.itemName = catalogItem.name;
          current.pricePerUnit = catalogItem.price;
          current.pointsPerUnit = catalogItem.points;
        }
      } else if (field === 'itemName') {
        current.itemName = value;
      } else if (field === 'pricePerUnit') {
        const parsed = parseFloat(value);
        current.pricePerUnit = isNaN(parsed) ? value : Math.max(0, parsed);
      } else if (field === 'pointsPerUnit') {
        const parsed = parseFloat(value);
        current.pointsPerUnit = isNaN(parsed) ? value : Math.max(0, parsed);
      }

      next[index] = current;
      return next;
    });
  };

  // File handling
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        billFile: 'Only PDF documents (or bill images) are allowed.',
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        billFile: 'Bill file size cannot exceed 10 MB.',
      }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.billFile;
      return next;
    });
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrors((prev) => {
      const next = { ...prev };
      delete next.billFile;
      return next;
    });
  };

  // Calculate live preview totals
  let calculatedTotalAmount = 0;
  let calculatedTotalPoints = 0;

  for (const li of lineItems) {
    const qty = typeof li.quantity === 'number' && li.quantity > 0 ? li.quantity : 0;
    if (li.isManual) {
      const price = typeof li.pricePerUnit === 'number' ? li.pricePerUnit : 0;
      const points = typeof li.pointsPerUnit === 'number' ? li.pointsPerUnit : 0;
      calculatedTotalAmount += price * qty;
      calculatedTotalPoints += points * qty;
    } else if (li.itemId && itemsMap.has(li.itemId)) {
      const item = itemsMap.get(li.itemId);
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

    const itemErrors = [];
    if (!lineItems || lineItems.length === 0) {
      errs.lineItems = 'At least one line item is required.';
    } else {
      lineItems.forEach((li, idx) => {
        if (li.isManual) {
          if (!li.itemName || !li.itemName.trim()) {
            itemErrors[idx] = 'Item name is required.';
          } else if (li.pricePerUnit === '' || li.pricePerUnit === undefined || isNaN(Number(li.pricePerUnit)) || Number(li.pricePerUnit) < 0) {
            itemErrors[idx] = 'Price per unit must be >= 0.';
          } else if (li.pointsPerUnit === '' || li.pointsPerUnit === undefined || isNaN(Number(li.pointsPerUnit)) || Number(li.pointsPerUnit) < 0) {
            itemErrors[idx] = 'Points per unit must be >= 0.';
          } else if (!li.quantity || typeof li.quantity !== 'number' || li.quantity < 1) {
            itemErrors[idx] = 'Quantity must be at least 1.';
          }
        } else {
          if (!li.itemId) {
            itemErrors[idx] = 'Select a catalog item.';
          } else if (!li.quantity || typeof li.quantity !== 'number' || li.quantity < 1) {
            itemErrors[idx] = 'Quantity must be at least 1.';
          }
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

    // Prepare lineItems for payload
    const formattedLineItems = lineItems.map((li) => {
      if (li.isManual) {
        return {
          isManual: true,
          itemId: null,
          itemName: li.itemName.trim(),
          quantity: Number(li.quantity),
          pricePerUnit: Number(li.pricePerUnit),
          pointsPerUnit: Number(li.pointsPerUnit),
        };
      }
      return {
        isManual: false,
        itemId: li.itemId,
        itemName: itemsMap.get(li.itemId)?.name || '',
        quantity: Number(li.quantity),
        pricePerUnit: itemsMap.get(li.itemId)?.price || 0,
        pointsPerUnit: itemsMap.get(li.itemId)?.points || 0,
      };
    });

    const formData = new FormData();
    formData.append('painterId', painterId);
    formData.append(
      'customer',
      JSON.stringify({
        name: customerName.trim(),
        mobile: customerMobile.trim(),
      })
    );
    formData.append('date', saleDate);
    formData.append('lineItems', JSON.stringify(formattedLineItems));

    if (selectedFile) {
      formData.append('billFile', selectedFile);
    }

    try {
      await createMutation.mutateAsync(formData);
      if (onSuccess) onSuccess('Sale recorded successfully! Points credited to painter.');
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to record sale.');
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record Painter Sale</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Log customer bill, calculate catalog and manual items, and award painter points.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="record-sale-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Active Cycle Badge / Alert */}
          {!activeCycle ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>
                <strong>No Active Reward Cycle:</strong> A cycle must be open before recording sales. Please activate a cycle in Cycle Management.
              </span>
            </div>
          ) : (
            <div className="px-3.5 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Cycle: {activeCycle.startDate?.slice(0, 10)} → {activeCycle.endDate?.slice(0, 10)}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">Points auto-credited</span>
            </div>
          )}

          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* Section: Painter & Sale Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="painterId" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Referring Painter <span className="text-red-500">*</span>
              </label>
              <select
                id="painterId"
                value={painterId}
                onChange={(e) => setPainterId(e.target.value)}
                disabled={isSubmitting || loadingPainters}
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.painterId ? 'border-red-300 bg-red-50/40' : 'border-slate-200 text-slate-800'
                }`}
              >
                <option value="">
                  {loadingPainters ? 'Loading active painters...' : painters.length === 0 ? 'No active painters available' : '— Select Active Painter —'}
                </option>
                {painters.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName || ''} ({p.mobile})
                  </option>
                ))}
              </select>
              {errors.painterId && (
                <p className="mt-1 text-[11px] text-red-600">{errors.painterId}</p>
              )}
            </div>

            <div>
              <label htmlFor="saleDate" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sale Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="saleDate"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.saleDate ? 'border-red-300 bg-red-50/40' : 'border-slate-200 text-slate-800'
                }`}
              />
              {errors.saleDate && (
                <p className="mt-1 text-[11px] text-red-600">{errors.saleDate}</p>
              )}
            </div>
          </div>

          {/* Section: Customer Information */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="customerName" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="customerName"
                  placeholder="e.g. Ramesh Patel"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.customerName ? 'border-red-300 bg-red-50/40' : 'border-slate-200 text-slate-800'
                  }`}
                />
                {errors.customerName && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="customerMobile" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="customerMobile"
                  placeholder="e.g. 9876543210"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono ${
                    errors.customerMobile ? 'border-red-300 bg-red-50/40' : 'border-slate-200 text-slate-800'
                  }`}
                />
                {errors.customerMobile && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.customerMobile}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Line Items (Catalog & Manual) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Purchased Items <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddLineItem(false)}
                  disabled={isSubmitting || loadingItems}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  + Catalog Item
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLineItem(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  + Manual Item
                </button>
              </div>
            </div>

            {errors.lineItems && (
              <p className="text-[11px] text-red-600 font-medium">{errors.lineItems}</p>
            )}

            <div className="space-y-3">
              {lineItems.map((li, index) => {
                const itemErr = errors.itemErrors?.[index];
                const qty = typeof li.quantity === 'number' && li.quantity > 0 ? li.quantity : 0;
                let rowTotal = 0;
                let rowPoints = 0;

                if (li.isManual) {
                  const price = typeof li.pricePerUnit === 'number' ? li.pricePerUnit : 0;
                  const points = typeof li.pointsPerUnit === 'number' ? li.pointsPerUnit : 0;
                  rowTotal = price * qty;
                  rowPoints = points * qty;
                } else if (li.itemId && itemsMap.has(li.itemId)) {
                  const it = itemsMap.get(li.itemId);
                  rowTotal = (it.price || 0) * qty;
                  rowPoints = (it.points || 0) * qty;
                }

                return (
                  <div
                    key={index}
                    className={`p-3.5 rounded-xl border transition-all ${
                      li.isManual
                        ? 'bg-amber-50/25 border-amber-200/80'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    {/* Row Top: Mode Selector and Delete */}
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">#{index + 1}</span>
                        <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-[11px] font-medium">
                          <button
                            type="button"
                            onClick={() => handleToggleMode(index, false)}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              !li.isManual
                                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Catalog Item
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleMode(index, true)}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              li.isManual
                                ? 'bg-white text-amber-700 shadow-xs font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Manual Item
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-700">
                          ₹{rowTotal.toLocaleString('en-IN')}
                          <span className="text-[10px] text-emerald-600 font-bold ml-1.5">
                            +{rowPoints} pts
                          </span>
                        </span>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            disabled={isSubmitting}
                            className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove item"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mode Specific Inputs */}
                    {!li.isManual ? (
                      /* Catalog Mode */
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="sm:col-span-8">
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">
                            Catalog Product
                          </label>
                          <select
                            value={li.itemId}
                            onChange={(e) => handleLineItemChange(index, 'itemId', e.target.value)}
                            disabled={isSubmitting || loadingItems}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          >
                            <option value="">— Select Catalog Item —</option>
                            {items.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name} (₹{it.price} | {it.points} pts)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={li.quantity}
                            onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Manual Mode */
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">
                            Item Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Asian Paint 20L"
                            value={li.itemName}
                            onChange={(e) => handleLineItemChange(index, 'itemName', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">
                            Qty <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={li.quantity}
                            onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">
                            Price/Unit (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="2500"
                            value={li.pricePerUnit}
                            onChange={(e) => handleLineItemChange(index, 'pricePerUnit', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">
                            Points/Unit
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="5"
                            value={li.pointsPerUnit}
                            onChange={(e) => handleLineItemChange(index, 'pointsPerUnit', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-emerald-700 font-bold"
                          />
                        </div>
                      </div>
                    )}

                    {itemErr && (
                      <p className="mt-1 text-[11px] text-red-600 font-medium">{itemErr}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Upload Bill PDF */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Bill Document (PDF)
                </label>
                <p className="text-[11px] text-slate-500">
                  Attach official PDF invoice for audit trail and records
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 font-medium">
                Max 10 MB
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
              id="bill-pdf-upload"
            />

            {!selectedFile ? (
              <label
                htmlFor="bill-pdf-upload"
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:bg-blue-50/30 hover:border-blue-300 transition-colors cursor-pointer group"
              >
                <svg className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                  Click to choose PDF bill
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PDF format recommended
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <label
                    htmlFor="bill-pdf-upload"
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  >
                    Change
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {errors.billFile && (
              <p className="text-[11px] text-red-600 font-medium">{errors.billFile}</p>
            )}
          </div>
        </form>

        {/* Sticky Fixed Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Summary Preview in Footer */}
          <div className="flex items-center gap-4 text-left w-full sm:w-auto">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Amount</div>
              <div className="text-base font-bold text-slate-900">
                ₹{calculatedTotalAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] text-emerald-600 uppercase font-semibold">Points Credit</div>
              <div className="text-base font-bold text-emerald-600">
                +{calculatedTotalPoints} pts
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
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
              form="record-sale-form"
              disabled={isSubmitting || !activeCycle}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Recording Sale...</span>
                </>
              ) : (
                <span>Record & Credit Points</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
