'use client';

import React, { useState, useTransition } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import EmptyState from '@/components/admin/EmptyState';
import PainterTable from '@/components/admin/painters/PainterTable';
import PainterCardList from '@/components/admin/painters/PainterCardList';
import AddPainterModal from '@/components/admin/painters/AddPainterModal';
import StatusConfirmModal from '@/components/admin/painters/StatusConfirmModal';
import {
  usePainters,
  useDeactivatePainter,
  useActivatePainter,
} from '@/lib/hooks/usePainters';

export default function AdminPaintersPage() {
  // Query state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [, startTransition] = useTransition();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    painter: null,
    actionType: 'deactivate',
  });
  const [toastMessage, setToastMessage] = useState('');

  // Debounced search handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    // Debounce state update
    if (window._searchTimeout) clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(val);
        setPage(1); // Reset to page 1 on new search
      });
    }, 350);
  };

  // TanStack Query for server state
  const { data, isLoading, isError, error, isPlaceholderData } = usePainters({
    page,
    limit,
    search: debouncedSearch,
    status: statusFilter,
  });

  const deactivateMutation = useDeactivatePainter();
  const activateMutation = useActivatePainter();

  // Show temporary toast message
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Open confirmation modal for status toggle
  const handleStatusClick = (painter, actionType) => {
    setConfirmModal({
      isOpen: true,
      painter,
      actionType,
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmModal.painter) return;
    const { painter, actionType } = confirmModal;

    try {
      if (actionType === 'deactivate') {
        await deactivateMutation.mutateAsync(painter.id);
        triggerToast(`Painter "${painter.firstName}" deactivated successfully.`);
      } else {
        await activateMutation.mutateAsync(painter.id);
        triggerToast(`Painter "${painter.firstName}" reactivated successfully.`);
      }
      setConfirmModal({ isOpen: false, painter: null, actionType: 'deactivate' });
    } catch (err) {
      alert(err.message || 'Failed to update painter status.');
    }
  };

  const painters = data?.painters || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
  const counts = data?.counts || { total: 0, active: 0, deactivated: 0 };

  const hasAnyPainters = counts.total > 0;
  const isFilteringOrSearching = debouncedSearch.trim() !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <PageHeader
        title="Painters"
        description="Manage painters, view their profiles and control their account status."
        badge="Painter Roster"
        actions={{
          label: 'Add Painter',
          onClick: () => setIsAddModalOpen(true),
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          ),
        }}
      />

      {/* ── Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Painters */}
        {isLoading ? (
          <div className="h-28 bg-white rounded-xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
            <div className="h-4 bg-slate-200 rounded-sm w-24" />
            <div className="h-7 bg-slate-200 rounded-sm w-16" />
          </div>
        ) : (
          <StatCard
            title="Total Painters"
            value={counts.total}
            subtitle="Registered in platform"
            badge="Roster"
            accent="blue"
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
        )}

        {/* Active Painters */}
        {isLoading ? (
          <div className="h-28 bg-white rounded-xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
            <div className="h-4 bg-slate-200 rounded-sm w-24" />
            <div className="h-7 bg-slate-200 rounded-sm w-16" />
          </div>
        ) : (
          <StatCard
            title="Active Painters"
            value={counts.active}
            subtitle="Can log in & earn points"
            badge="Active"
            accent="emerald"
            icon={
              <svg
                className="w-5 h-5"
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
        )}

        {/* Deactivated Painters */}
        {isLoading ? (
          <div className="h-28 bg-white rounded-xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
            <div className="h-4 bg-slate-200 rounded-sm w-24" />
            <div className="h-7 bg-slate-200 rounded-sm w-16" />
          </div>
        ) : (
          <StatCard
            title="Deactivated"
            value={counts.deactivated}
            subtitle="Access suspended, history kept"
            badge="Suspended"
            accent="slate"
            icon={
              <svg
                className="w-5 h-5"
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
        )}
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        {/* Search input with icon */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search painters by name, mobile, email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto self-stretch sm:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'deactivated', label: 'Deactivated' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-4 shadow-xs">
          <div className="h-6 bg-slate-100 rounded-sm w-1/4 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-center space-y-2">
          <p className="text-sm font-semibold text-red-800">Failed to load painters</p>
          <p className="text-xs text-red-600">{error?.message || 'Server error occurred.'}</p>
        </div>
      ) : !hasAnyPainters && !isFilteringOrSearching ? (
        /* Empty State when no painters exist in the shop at all */
        <EmptyState
          title="No painters added yet"
          description="Register your shop's painters to track their customer purchases, calculate point commissions, and reward their business."
          actionLabel="Add First Painter"
          onAction={() => setIsAddModalOpen(true)}
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          note="Historical records for registered painters are protected and will never be purged."
        />
      ) : painters.length === 0 ? (
        /* Empty State for no matching search/filter results */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-xl mx-auto flex items-center justify-center text-slate-400">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="font-bold text-sm text-slate-800">No matching painters found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No painters matched your current filter criteria. Try adjusting your search query or status filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setDebouncedSearch('');
              setStatusFilter('all');
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* List with Desktop Table and Mobile Cards */
        <div className="space-y-4">
          <PainterTable
            painters={painters}
            onStatusClick={handleStatusClick}
          />

          <PainterCardList
            painters={painters}
            onStatusClick={handleStatusClick}
          />

          {/* ── Pagination ────────────────────────────────────────────── */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
              <span className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {pagination.total}
                </span>{' '}
                painters
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || isPlaceholderData}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-slate-600 px-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || isPlaceholderData}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add Painter Modal ────────────────────────────────────────── */}
      <AddPainterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => triggerToast('New painter registered successfully.')}
      />

      {/* ── Status Confirmation Modal ─────────────────────────────────── */}
      <StatusConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, painter: null, actionType: 'deactivate' })}
        onConfirm={handleConfirmStatusChange}
        painter={confirmModal.painter}
        actionType={confirmModal.actionType}
        isLoading={deactivateMutation.isPending || activateMutation.isPending}
      />
    </div>
  );
}
