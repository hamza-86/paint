'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/admin/PageHeader';
import StatusConfirmModal from '@/components/admin/painters/StatusConfirmModal';
import {
  usePainter,
  useDeactivatePainter,
  useActivatePainter,
} from '@/lib/hooks/usePainters';

export default function PainterDetailPage() {
  const params = useParams();
  const id = params?.id;

  const { data, isLoading, isError, error } = usePainter(id);
  const painter = data?.painter;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: 'deactivate',
  });
  const [toastMessage, setToastMessage] = useState('');

  const deactivateMutation = useDeactivatePainter();
  const activateMutation = useActivatePainter();

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const handleStatusToggle = () => {
    if (!painter) return;
    setConfirmModal({
      isOpen: true,
      actionType: painter.status === 'active' ? 'deactivate' : 'activate',
    });
  };

  const handleConfirmStatus = async () => {
    if (!painter) return;
    try {
      if (confirmModal.actionType === 'deactivate') {
        await deactivateMutation.mutateAsync(painter.id);
        triggerToast(`Painter "${painter.firstName}" deactivated successfully.`);
      } else {
        await activateMutation.mutateAsync(painter.id);
        triggerToast(`Painter "${painter.firstName}" activated successfully.`);
      }
      setConfirmModal({ isOpen: false, actionType: 'deactivate' });
    } catch (err) {
      alert(err.message || 'Failed to update painter status.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr));
    } catch {
      return '—';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 rounded-sm w-48 animate-pulse" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 rounded-sm w-40" />
              <div className="h-4 bg-slate-200 rounded-sm w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !painter) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Painter Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error?.message || 'The requested painter could not be found or has an invalid identifier.'}
        </p>
        <Link
          href="/admin/painters"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
        >
          &larr; Back to Painters List
        </Link>
      </div>
    );
  }

  const isActive = painter.status === 'active';

  return (
    <div className="space-y-6">
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Breadcrumb & Navigation ──────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/painters"
          className="hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Painters
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">{painter.firstName}</span>
      </div>

      {/* ── Profile Header Card ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {painter.photoUrl ? (
              <img
                src={painter.photoUrl}
                alt={painter.firstName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-2xl shadow-xs">
                {painter.firstName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {painter.firstName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {isActive ? 'Active Account' : 'Deactivated'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ID: {painter.id} &bull; Member since {formatDate(painter.createdAt)}
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleStatusToggle}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer border shadow-xs flex items-center justify-center gap-2 ${
                isActive
                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              {isActive ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Deactivate Account
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Reactivate Account
                </>
              )}
            </button>
          </div>
        </div>

        {/* Profile metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Mobile Number</span>
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {painter.mobile}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Email Address</span>
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2 truncate">
              <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span className="truncate">{painter.email}</span>
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Current Reward Cycle</span>
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {painter.currentCycleId ? String(painter.currentCycleId) : 'No Cycle Assigned'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Account State</span>
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {isActive ? 'Login Permitted' : 'Login Suspended'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Future History Placeholders ───────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Performance & History
        </h2>

        {/* 1. Sales History Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sales History</h3>
                <p className="text-xs text-slate-400">Customer paint purchases attributed to this painter</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Module: Sales (Part 5)
            </span>
          </div>
          <div className="py-8 text-center text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-600">Detailed sales history will appear here once the Sales module is enabled.</p>
            <p>All recorded bills, customer contacts, and item quantities will be tracked without data loss.</p>
          </div>
        </div>

        {/* 2. Points History Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Points History</h3>
                <p className="text-xs text-slate-400">Cycle-based points earned from paint sales</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Module: Cycles & Points (Part 6)
            </span>
          </div>
          <div className="py-8 text-center text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-600">Active cycle points ledger will appear here once the Cycles module is enabled.</p>
            <p>Points calculations and commission adjustments will be visible in real time.</p>
          </div>
        </div>

        {/* 3. Reward History Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="14" x="3" y="8" rx="2" />
                  <path d="M12 5a3 3 0 1 0-3 3" />
                  <path d="M12 5a3 3 0 1 1 3 3" />
                  <path d="M3 12h18" />
                  <path d="M12 8v14" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reward History</h3>
                <p className="text-xs text-slate-400">Disbursed and claimed rewards</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Module: Rewards (Part 7)
            </span>
          </div>
          <div className="py-8 text-center text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-600">Reward claims, inventory allocation, and fulfillment status will appear here.</p>
            <p>All disbursed reward history is permanently logged for accounting.</p>
          </div>
        </div>
      </div>

      {/* ── Status Confirmation Modal ─────────────────────────────────── */}
      <StatusConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, actionType: 'deactivate' })}
        onConfirm={handleConfirmStatus}
        painter={painter}
        actionType={confirmModal.actionType}
        isLoading={deactivateMutation.isPending || activateMutation.isPending}
      />
    </div>
  );
}
