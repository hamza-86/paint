'use client';

import React, { useState, useEffect } from 'react';
import { useCreateItem, useUpdateItem } from '@/lib/hooks/useItems';

const COMMON_BRANDS = [
  'Asian Paints',
  'Berger',
  'Nerolac',
  'Dulux',
  'Indigo',
  'Birla White',
  'MRF Corp',
];

const COMMON_CATEGORIES = [
  'Interior Paint',
  'Exterior Paint',
  'Primer',
  'Enamel',
  'Waterproofing',
  'Wall Putty',
  'Thinner',
  'Brush & Roller',
];

export default function ItemModal({ isOpen, onClose, item = null, onSuccess }) {
  const isEditMode = Boolean(item);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    points: '',
    brand: '',
    category: '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();

  // Populate form on edit or reset on create
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        price: item.price !== undefined ? String(item.price) : '',
        points: item.points !== undefined ? String(item.points) : '',
        brand: item.brand || '',
        category: item.category || '',
        imageUrl: item.imageUrl || '',
      });
    } else {
      setFormData({
        name: '',
        price: '',
        points: '',
        brand: '',
        category: '',
        imageUrl: '',
      });
    }
    setErrors({});
    setServerError('');
  }, [item, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Item name is required.';
    } else if (formData.name.trim().length > 120) {
      errs.name = 'Item name cannot exceed 120 characters.';
    }

    const parsedPrice = parseFloat(formData.price);
    if (formData.price === '' || isNaN(parsedPrice) || parsedPrice < 0) {
      errs.price = 'Price must be a valid non-negative number.';
    }

    const parsedPoints = parseFloat(formData.points);
    if (formData.points === '' || isNaN(parsedPoints) || parsedPoints < 0) {
      errs.points = 'Points per unit must be a valid non-negative number.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      points: parseFloat(formData.points),
      brand: formData.brand.trim(),
      category: formData.category.trim(),
      imageUrl: formData.imageUrl.trim(),
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: item.id, data: payload });
        if (onSuccess) onSuccess(`Item "${payload.name}" updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        if (onSuccess) onSuccess(`Item "${payload.name}" added successfully.`);
      }
      onClose();
    } catch (err) {
      setServerError(err.message || 'An error occurred while saving the item.');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditMode ? 'Edit Item' : 'Add New Item'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditMode
                ? 'Update item details and reward points for future sales.'
                : 'Add a new product to your shop catalog with unit pricing and painter points.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Asian Paints Apex Ultima 20L"
              maxLength={120}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.name ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
              }`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Price & Points Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unit Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3.5 py-2 text-sm bg-white border rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.price ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
            </div>

            {/* Points */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Points per Unit <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  placeholder="e.g. 5"
                  className={`w-full pl-9 pr-3.5 py-2 text-sm bg-white border rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.points ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Painter earns this point amount for each 1 unit sold.
              </p>
              {errors.points && <p className="text-xs text-red-600 mt-0.5">{errors.points}</p>}
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Brand <span className="text-slate-400 text-xs font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g. Asian Paints, Berger, Nerolac..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {COMMON_BRANDS.map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setFormData({ ...formData, brand: b })}
                  className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category <span className="text-slate-400 text-xs font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Interior Paint, Primer, Enamel..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {COMMON_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL with live preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Image URL <span className="text-slate-400 text-xs font-normal">(Optional URL)</span>
            </label>
            <div className="flex gap-3 items-start">
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/item.jpg"
                className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {formData.imageUrl && (
                <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Provide an external image link (Cloudinary or public web URL).
            </p>
          </div>

          {/* Modal Footer */}
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
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting && (
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isEditMode ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
