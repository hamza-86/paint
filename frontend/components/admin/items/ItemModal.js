'use client';

import React, { useState, useEffect } from 'react';
import {
  useCreateItem,
  useUpdateItem,
  useItemBrands,
  useItemCategories,
} from '@/lib/hooks/useItems';

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

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();

  // Dynamic brands & categories from DB
  const { data: brandsData } = useItemBrands();
  const { data: categoriesData } = useItemCategories();

  const brandSuggestions = brandsData?.brands || [];
  const categorySuggestions = categoriesData?.categories || [];

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      setPreviewUrl(item.imageUrl || null);
    } else {
      setFormData({
        name: '',
        price: '',
        points: '',
        brand: '',
        category: '',
        imageUrl: '',
      });
      setPreviewUrl(null);
    }
    setImageFile(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Selected file must be an image.' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'File size must be under 5MB.' }));
        return;
      }
      setImageFile(file);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: undefined }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('price', String(parseFloat(formData.price)));
      payload.append('points', String(parseFloat(formData.points)));
      payload.append('brand', formData.brand.trim());
      payload.append('category', formData.category.trim());

      if (imageFile) {
        payload.append('image', imageFile);
      } else if (formData.imageUrl.trim()) {
        payload.append('imageUrl', formData.imageUrl.trim());
      }

      const itemId = item?.id || item?._id;

      if (isEditMode) {
        await updateMutation.mutateAsync({ id: itemId, data: payload });
        if (onSuccess) onSuccess(`Item "${formData.name.trim()}" updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        if (onSuccess) onSuccess(`Item "${formData.name.trim()}" added successfully.`);
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
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
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
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 grow">
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

          {/* Brand with Smart DB suggestions */}
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
            {/* Dynamic brand suggestions from catalog */}
            {brandSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[11px] text-slate-400 self-center mr-1">Existing:</span>
                {brandSuggestions.map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setFormData({ ...formData, brand: b })}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                      formData.brand === b
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category with Smart DB suggestions */}
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
            {/* Dynamic category suggestions from catalog */}
            {categorySuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[11px] text-slate-400 self-center mr-1">Existing:</span>
                {categorySuggestions.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                      formData.category === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Image Upload with live preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Item Image <span className="text-slate-400 text-xs font-normal">(Optional)</span>
            </label>
            <div className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
              {previewUrl ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-xs shrink-0 group bg-white">
                  <img
                    src={previewUrl}
                    alt="Item Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors shadow-xs">
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>{imageFile || previewUrl ? 'Change Image' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  JPEG, PNG, WebP up to 5MB. Stored securely in Cloudinary.
                </p>
                {errors.image && (
                  <p className="text-xs text-red-600 mt-1">{errors.image}</p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
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
