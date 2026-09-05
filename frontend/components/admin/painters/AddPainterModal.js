'use client';

import React, { useState } from 'react';
import { useCreatePainter } from '@/lib/hooks/usePainters';

export default function AddPainterModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    photoUrl: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const createPainterMutation = useCreatePainter();

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};

    if (!formData.firstName.trim()) {
      errs.firstName = 'First name is required.';
    } else if (formData.firstName.trim().length > 80) {
      errs.firstName = 'First name cannot exceed 80 characters.';
    }

    if (!formData.mobile.trim()) {
      errs.mobile = 'Mobile number is required.';
    } else if (!/^[+]?[\d\s-]{7,15}$/.test(formData.mobile.trim())) {
      errs.mobile = 'Please enter a valid mobile number (min 7 digits).';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(
        formData.email.trim().toLowerCase()
      )
    ) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      await createPainterMutation.mutateAsync({
        firstName: formData.firstName.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        photoUrl: formData.photoUrl.trim() || undefined,
      });

      // Reset state and close
      setFormData({
        firstName: '',
        mobile: '',
        email: '',
        password: '',
        confirmPassword: '',
        photoUrl: '',
      });
      setErrors({});
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to create painter.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New Painter</h2>
            <p className="text-xs text-slate-500">
              Register a painter to track their sales and reward points.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <svg
                className="w-4 h-4 shrink-0 mt-0.5 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name / First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Ramesh Kumar"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.firstName
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.mobile
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.mobile && (
                <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. ramesh@example.com"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Photo URL (optional) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Photo URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:border-blue-500 focus:ring-blue-100 transition-all"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Direct image link. Direct file uploads will be connected via Cloudinary in an upcoming update.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={createPainterMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPainterMutation.isPending}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {createPainterMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating Painter...
                </>
              ) : (
                'Create Painter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
