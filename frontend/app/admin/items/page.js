'use client';

import React, { useState, useTransition } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import EmptyState from '@/components/admin/EmptyState';
import ItemTable from '@/components/admin/items/ItemTable';
import ItemCardList from '@/components/admin/items/ItemCardList';
import ItemModal from '@/components/admin/items/ItemModal';
import ItemStatusConfirmModal from '@/components/admin/items/ItemStatusConfirmModal';
import {
  useItems,
  useDeactivateItem,
  useActivateItem,
} from '@/lib/hooks/useItems';

const CATEGORIES = [
  'All Categories',
  'Interior Paint',
  'Exterior Paint',
  'Primer',
  'Enamel',
  'Waterproofing',
  'Wall Putty',
  'Thinner',
  'Brush & Roller',
];

export default function AdminItemsPage() {
  // Query state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [, startTransition] = useTransition();

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    item: null,
    actionType: 'deactivate',
  });
  const [toastMessage, setToastMessage] = useState('');

  // Debounced search handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (window._itemSearchTimeout) clearTimeout(window._itemSearchTimeout);
    window._itemSearchTimeout = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(val);
        setPage(1); // Reset page on new search query
      });
    }, 350);
  };

  // TanStack Query for server state
  const { data, isLoading, isError, error, isPlaceholderData } = useItems({
    page,
    limit,
    search: debouncedSearch,
    status: statusFilter,
    category: categoryFilter === 'All Categories' ? 'all' : categoryFilter,
  });

  const deactivateMutation = useDeactivateItem();
  const activateMutation = useActivateItem();

  // Temporary toast notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Open modal to add item
  const handleOpenAddModal = () => {
    setSelectedItemForEdit(null);
    setIsItemModalOpen(true);
  };

  // Open modal to edit item
  const handleOpenEditModal = (item) => {
    setSelectedItemForEdit(item);
    setIsItemModalOpen(true);
  };

  // Status toggle confirmation
  const handleStatusClick = (item, actionType) => {
    setConfirmModal({
      isOpen: true,
      item,
      actionType,
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmModal.item) return;
    const { item, actionType } = confirmModal;

    try {
      if (actionType === 'deactivate') {
        await deactivateMutation.mutateAsync(item.id);
        triggerToast(`Item "${item.name}" deactivated.`);
      } else {
        await activateMutation.mutateAsync(item.id);
        triggerToast(`Item "${item.name}" reactivated.`);
      }
      setConfirmModal({ isOpen: false, item: null, actionType: 'deactivate' });
    } catch (err) {
      alert(err.message || 'Failed to update item status.');
    }
  };

  const items = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
  const counts = data?.counts || { total: 0, active: 0, deactivated: 0 };

  const hasAnyItems = counts.total > 0;
  const isFiltered =
    debouncedSearch.trim() !== '' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <svg
            className="w-4 h-4 text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Item Catalog"
        description="Manage paint products, set unit pricing, and configure painter reward points."
        badge="Inventory"
        actions={{
          label: 'Add Item',
          onClick: handleOpenAddModal,
          icon: (
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          ),
        }}
      />

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Catalog Items"
          value={isLoading ? null : counts.total}
          subtitle="Products in system"
          color="blue"
          icon={
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          }
        />
        <StatCard
          title="Active Items"
          value={isLoading ? null : counts.active}
          subtitle="Available for sales & points"
          color="emerald"
          icon={
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatCard
          title="Deactivated Items"
          value={isLoading ? null : counts.deactivated}
          subtitle="Preserved for historical sales"
          color="amber"
          icon={
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
        />
      </div>

      {/* Search and Filters Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search items by name, brand, or category..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Right: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c === 'All Categories' ? 'all' : c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('active');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active ({counts.active})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('deactivated');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'deactivated'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Deactivated ({counts.deactivated})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Cards / Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading catalog items...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 shadow-xs">
          <p className="font-semibold text-sm">Failed to load item catalog</p>
          <p className="text-xs text-red-500 mt-1">{error?.message || 'Server error'}</p>
        </div>
      ) : !hasAnyItems ? (
        <EmptyState
          title="No catalog items added yet"
          description="Create your inventory of paints, primers, wall putty, and thinners. Set prices and points earned per unit to calculate painter rewards."
          actionLabel="Add First Item"
          onAction={handleOpenAddModal}
          icon={
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          }
          note="Item points configure how many points a painter earns per unit sold."
        />
      ) : items.length === 0 && isFiltered ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">No matching items found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No items matched your current search filters. Try adjusting your search query or status filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setDebouncedSearch('');
              setStatusFilter('all');
              setCategoryFilter('all');
              setPage(1);
            }}
            className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <ItemTable
            items={items}
            onEditClick={handleOpenEditModal}
            onStatusClick={handleStatusClick}
          />

          {/* Mobile Card List View */}
          <ItemCardList
            items={items}
            onEditClick={handleOpenEditModal}
            onStatusClick={handleStatusClick}
          />

          {/* Pagination Bar */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{pagination.total}</span> items
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || isPlaceholderData}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="font-semibold text-slate-900 px-2">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || isPlaceholderData}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setSelectedItemForEdit(null);
        }}
        item={selectedItemForEdit}
        onSuccess={triggerToast}
      />

      {/* Status Confirmation Modal */}
      <ItemStatusConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null, actionType: 'deactivate' })}
        item={confirmModal.item}
        actionType={confirmModal.actionType}
        onConfirm={handleConfirmStatusChange}
        isSubmitting={deactivateMutation.isPending || activateMutation.isPending}
      />
    </div>
  );
}
