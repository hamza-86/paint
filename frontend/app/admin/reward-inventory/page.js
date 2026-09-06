'use client';

import React, { useState, useCallback, useMemo } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import RewardInventoryModal from '@/components/reward-inventory/RewardInventoryModal';
import RewardInventoryStatusConfirmModal from '@/components/reward-inventory/RewardInventoryStatusConfirmModal';
import {
  useRewardInventory,
  useCreateRewardInventory,
  useUpdateRewardInventory,
  useDeactivateRewardInventory,
  useActivateRewardInventory,
} from '@/lib/hooks/useRewardInventory';
import { useCompanies } from '@/lib/hooks/useCompanies';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function formatNumber(val) {
  if (val === undefined || val === null) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
}

// ── Summary Card Component ────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Empty State Component ─────────────────────────────────────────────────────

function EmptyState({ filtered, onClearSearch, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      </div>
      {filtered ? (
        <>
          <p className="font-semibold text-slate-700 text-lg">No inventory matches your filters</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Try adjusting your search query, status, or availability filters.
          </p>
          <button
            onClick={onClearSearch}
            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </>
      ) : (
        <>
          <p className="font-semibold text-slate-700 text-lg">No reward inventory items yet</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Convert company incentive rewards into inventoried items for painters.
          </p>
          <button
            onClick={onAdd}
            className="mt-4 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
          >
            + Add First Reward Item
          </button>
        </>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function RewardInventoryPage() {
  // Filter and pagination states
  const [search, setSearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [statusModalItem, setStatusModalItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Queries
  const queryFilters = useMemo(
    () => ({
      page,
      limit,
      search: search.trim() || undefined,
      companyId: selectedCompanyId || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      availability: availabilityFilter !== 'all' ? availabilityFilter : undefined,
    }),
    [page, limit, search, selectedCompanyId, statusFilter, availabilityFilter]
  );

  const { data: inventoryData, isLoading, isError, error } = useRewardInventory(queryFilters);
  const { data: companiesData } = useCompanies({ limit: 100 });

  const companiesList = companiesData?.data || [];
  const items = inventoryData?.data || [];
  const pagination = inventoryData?.pagination || { page: 1, totalPages: 1, total: 0 };
  const summary = inventoryData?.summary || {
    totalInventoryItems: 0,
    totalQuantity: 0,
    totalRemainingQuantity: 0,
    totalAssignedQuantity: 0,
  };

  // Mutations
  const createMutation = useCreateRewardInventory();
  const updateMutation = useUpdateRewardInventory();
  const deactivateMutation = useDeactivateRewardInventory();
  const activateMutation = useActivateRewardInventory();

  // Toast handler
  const showToast = useCallback((msg, isErr = false) => {
    setToastMessage({ text: msg, isError: isErr });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Handlers
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, data: formData });
      showToast('Reward inventory item updated successfully.');
    } else {
      await createMutation.mutateAsync(formData);
      showToast('Reward inventory item created successfully.');
    }
    setIsFormModalOpen(false);
  };

  const handleToggleStatus = async () => {
    if (!statusModalItem) return;
    const isDeactivating = statusModalItem.status === 'active';
    try {
      if (isDeactivating) {
        await deactivateMutation.mutateAsync(statusModalItem.id);
        showToast('Reward inventory item deactivated.');
      } else {
        await activateMutation.mutateAsync(statusModalItem.id);
        showToast('Reward inventory item activated.');
      }
      setStatusModalItem(null);
    } catch (err) {
      showToast(err.message || 'Status update failed.', true);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCompanyId('');
    setStatusFilter('all');
    setAvailabilityFilter('all');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
      selectedCompanyId ||
      statusFilter !== 'all' ||
      availabilityFilter !== 'all'
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium transition-all ${
            toastMessage.isError
              ? 'bg-rose-900/90 text-white border-rose-700 backdrop-blur-md'
              : 'bg-slate-900/90 text-white border-slate-700 backdrop-blur-md'
          }`}
        >
          {toastMessage.isError ? (
            <svg className="w-5 h-5 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Reward Inventory"
        subtitle="Manage rewards received from paint companies and available for painter redemption."
        primaryAction={{
          label: '+ Add Reward Inventory',
          onClick: handleOpenCreate,
        }}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Reward Items"
          value={formatNumber(summary.totalInventoryItems)}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          }
          color="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          label="Total Quantity"
          value={formatNumber(summary.totalQuantity)}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 7h10" />
              <path d="M7 12h10" />
              <path d="M7 17h10" />
            </svg>
          }
          color="bg-purple-50 text-purple-600"
        />
        <SummaryCard
          label="Available Quantity"
          value={formatNumber(summary.totalRemainingQuantity)}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label="Assigned Quantity"
          value={formatNumber(summary.totalAssignedQuantity)}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          }
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search rewards by name..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Company Filter Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="">All Companies</option>
              {companiesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="all">All Availability</option>
              <option value="available">Available (&gt; 0)</option>
              <option value="fullyAssigned">Fully Assigned (0)</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full md:w-40">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table & Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-8 h-8 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-xs text-slate-400 mt-2 font-medium">Loading reward inventory...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-rose-600 text-sm">
            Failed to load inventory: {error?.message || 'Server error.'}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            filtered={hasActiveFilters}
            onClearSearch={handleClearFilters}
            onAdd={handleOpenCreate}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Reward Item</th>
                    <th className="py-3.5 px-4">Source Company</th>
                    <th className="py-3.5 px-4">Reward Period</th>
                    <th className="py-3.5 px-4 text-center">Total Qty</th>
                    <th className="py-3.5 px-4 text-center">Available Qty</th>
                    <th className="py-3.5 px-4 text-center">Assigned Qty</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Reward item name + thumbnail */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {it.imageUrl ? (
                              <img
                                src={it.imageUrl}
                                alt={it.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect width="18" height="14" x="3" y="8" rx="2" />
                                <path d="M12 5a3 3 0 1 0-3 3" />
                                <path d="M12 5a3 3 0 1 1 3 3" />
                                <path d="M3 12h18" />
                                <path d="M12 8v14" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-[220px]">
                              {it.name}
                            </p>
                            {it.sourceReward?.rewardItem?.name &&
                              it.sourceReward.rewardItem.name !== it.name && (
                                <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                                  Orig: {it.sourceReward.rewardItem.name}
                                </p>
                              )}
                          </div>
                        </div>
                      </td>

                      {/* Source Company */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {it.sourceReward?.company?.name || 'Company'}
                        </span>
                      </td>

                      {/* Reward Period */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(it.sourceReward?.dateFrom)} – {formatDate(it.sourceReward?.dateTo)}
                      </td>

                      {/* Total Qty */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {it.totalQty}
                      </td>

                      {/* Available Qty */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            it.remainingQty > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {it.remainingQty}
                        </span>
                      </td>

                      {/* Assigned Qty */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {it.assignedQty || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            it.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              it.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {it.status === 'active' ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(it)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit metadata"
                            aria-label="Edit item"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setStatusModalItem(it)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              it.status === 'active'
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={it.status === 'active' ? 'Deactivate item' : 'Activate item'}
                            aria-label={it.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {it.status === 'active' ? (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {items.map((it) => (
                <div key={it.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect width="18" height="14" x="3" y="8" rx="2" />
                            <path d="M12 5a3 3 0 1 0-3 3" />
                            <path d="M12 5a3 3 0 1 1 3 3" />
                            <path d="M3 12h18" />
                            <path d="M12 8v14" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{it.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {it.sourceReward?.company?.name || 'Company'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        it.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {it.status === 'active' ? 'Active' : 'Deactivated'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-center text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Total
                      </p>
                      <p className="font-bold text-slate-800 mt-0.5">{it.totalQty}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Available
                      </p>
                      <p
                        className={`font-bold mt-0.5 ${
                          it.remainingQty > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {it.remainingQty}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Assigned
                      </p>
                      <p className="font-bold text-blue-700 mt-0.5">{it.assignedQty || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {formatDate(it.sourceReward?.dateFrom)} – {formatDate(it.sourceReward?.dateTo)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(it)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setStatusModalItem(it)}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs ${
                          it.status === 'active'
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {it.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                <span>
                  Page <strong className="text-slate-700">{pagination.page}</strong> of{' '}
                  <strong className="text-slate-700">{pagination.totalPages}</strong> (
                  {pagination.total} total items)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Inventory Modal */}
      <RewardInventoryModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        item={editingItem}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Status Confirm Modal */}
      <RewardInventoryStatusConfirmModal
        isOpen={Boolean(statusModalItem)}
        onClose={() => setStatusModalItem(null)}
        item={statusModalItem}
        onConfirm={handleToggleStatus}
        isSubmitting={deactivateMutation.isPending || activateMutation.isPending}
      />
    </div>
  );
}
