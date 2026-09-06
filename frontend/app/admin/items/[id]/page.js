'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/admin/PageHeader';
import ItemModal from '@/components/admin/items/ItemModal';
import ItemStatusConfirmModal from '@/components/admin/items/ItemStatusConfirmModal';
import {
  useItem,
  useItemSalesHistory,
  useDeactivateItem,
  useActivateItem,
} from '@/lib/hooks/useItems';

export default function ItemDetailPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const { data, isLoading, isError, error } = useItem(id);
  const item = data?.item;

  const [salesPage, setSalesPage] = useState(1);
  const { data: salesData, isLoading: isSalesLoading } = useItemSalesHistory(id, {
    page: salesPage,
    limit: 10,
  });
  const sales = salesData?.sales || [];
  const salesPagination = salesData?.pagination;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: 'deactivate',
  });
  const [toastMessage, setToastMessage] = useState('');

  const deactivateMutation = useDeactivateItem();
  const activateMutation = useActivateItem();

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '—';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(val);
    } catch {
      return `₹${val}`;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr));
    } catch {
      return '—';
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!item) return;
    const { actionType } = confirmModal;

    try {
      if (actionType === 'deactivate') {
        await deactivateMutation.mutateAsync(item.id);
        triggerToast(`Item "${item.name}" deactivated.`);
      } else {
        await activateMutation.mutateAsync(item.id);
        triggerToast(`Item "${item.name}" reactivated.`);
      }
      setConfirmModal({ isOpen: false, actionType: 'deactivate' });
    } catch (err) {
      alert(err.message || 'Failed to update item status.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded-md animate-pulse" />
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-pulse">
          <div className="flex gap-6 items-center">
            <div className="w-24 h-24 bg-slate-200 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-60 bg-slate-200 rounded-md" />
              <div className="h-4 w-40 bg-slate-200 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900">Item Not Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error?.message || 'The requested catalog item could not be retrieved or does not exist.'}
        </p>
        <Link
          href="/admin/items"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back to Item Catalog
        </Link>
      </div>
    );
  }

  const isActive = item.status === 'active';

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/admin/items" className="hover:text-blue-600 transition-colors">
          Item Catalog
        </Link>
        <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{item.name}</span>
      </nav>

      {/* Main Item Detail Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Header Section */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            {/* Image / Icon */}
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 bg-slate-50 shadow-xs"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs ${
                item.imageUrl ? 'hidden' : ''
              }`}
            >
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </div>

            {/* Name, Brand & Status */}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{item.name}</h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {isActive ? 'Active Catalog Item' : 'Deactivated'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Brand: <span className="font-semibold text-slate-700">{item.brand || 'Generic'}</span>
                {item.category && <span> • Category: <span className="font-semibold text-slate-700">{item.category}</span></span>}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              Edit Item
            </button>

            {isActive ? (
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: true, actionType: 'deactivate' })}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors flex items-center justify-center gap-1.5"
              >
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: true, actionType: 'activate' })}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
              >
                Reactivate
              </button>
            )}
          </div>
        </div>

        {/* Pricing and Configuration Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/50">
          <div className="p-6">
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Unit Price</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {formatCurrency(item.price)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Selling price per 1 unit</p>
          </div>

          <div className="p-6">
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Painter Reward</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-extrabold text-amber-600 font-mono">{item.points}</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                pts / unit
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Earned per unit sold in sales</p>
          </div>

          <div className="p-6">
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Created Date</span>
            <div className="text-sm font-semibold text-slate-800 mt-1.5">
              {formatDate(item.createdAt)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Catalog entry created</p>
          </div>

          <div className="p-6">
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Last Modified</span>
            <div className="text-sm font-semibold text-slate-800 mt-1.5">
              {formatDate(item.updatedAt)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Last price/points revision</p>
          </div>
        </div>
      </div>

      {/* Real Sales History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Sales History</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All transactions and invoices that include this catalog item.
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-200">
            {salesPagination?.total ?? 0} {salesPagination?.total === 1 ? 'sale' : 'sales'} recorded
          </span>
        </div>

        {isSalesLoading ? (
          <div className="space-y-3 py-6">
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        ) : sales.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              No sales recorded for this item yet.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              When sales include this item, immutable price & reward point snapshots will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Painter</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Price / Unit</th>
                    <th className="px-4 py-3 text-right">Points Earned</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {formatDate(s.date || s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {s.painter ? (
                          <div>
                            <span className="font-semibold text-slate-900">{s.painter.firstName}</span>
                            {s.painter.mobile && (
                              <span className="block text-[11px] text-slate-400 font-mono">{s.painter.mobile}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {s.customer ? (
                          <div>
                            <span className="font-medium text-slate-800">{s.customer.name}</span>
                            {s.customer.mobile && (
                              <span className="block text-[11px] text-slate-400 font-mono">{s.customer.mobile}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {s.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatCurrency(s.pricePerUnit)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          +{s.pointsEarned} pts
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(s.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {salesPagination && salesPagination.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <div>
                  Page <span className="font-semibold text-slate-800">{salesPagination.page}</span> of{' '}
                  <span className="font-semibold text-slate-800">{salesPagination.totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={salesPage <= 1}
                    onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={salesPage >= salesPagination.totalPages}
                    onClick={() => setSalesPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={item}
        onSuccess={triggerToast}
      />

      {/* Status Confirmation Modal */}
      <ItemStatusConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, actionType: 'deactivate' })}
        item={item}
        actionType={confirmModal.actionType}
        onConfirm={handleConfirmStatusChange}
        isSubmitting={deactivateMutation.isPending || activateMutation.isPending}
      />
    </div>
  );
}
