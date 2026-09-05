'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import EmptyState from '@/components/admin/EmptyState';
import ActiveCycleBanner from '@/components/admin/sales/ActiveCycleBanner';
import RecordSaleModal from '@/components/admin/sales/RecordSaleModal';
import SaleTable from '@/components/admin/sales/SaleTable';
import SaleCardList from '@/components/admin/sales/SaleCardList';
import { useSales } from '@/lib/hooks/useSales';
import { useCycles } from '@/lib/hooks/useCycles';

export default function AdminSalesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Fetch cycles to detect active cycle
  const { data: cyclesData, isLoading: cyclesLoading } = useCycles({ page: 1, limit: 10 });
  const activeCycle = cyclesData?.activeCycle || null;

  // Fetch paginated sales with search and aggregated summary
  const {
    data: salesData,
    isLoading: salesLoading,
    isError,
    error,
    isPlaceholderData,
  } = useSales({
    page,
    limit: 10,
    search,
  });

  const sales = salesData?.data || [];
  const pagination = salesData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const summary = salesData?.summary || { totalAmount: 0, totalPoints: 0, totalCount: 0 };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Sales & Points"
        description="Record and manage painter-referred purchases, item price snapshots, and reward points."
        badge="Ledger"
        actions={{
          label: 'Record Sale',
          onClick: () => setIsRecordModalOpen(true),
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ),
        }}
      />

      {/* Active Cycle Status Banner */}
      <ActiveCycleBanner activeCycle={activeCycle} isLoading={cyclesLoading} />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoices"
          value={salesLoading ? null : summary.totalCount}
          subtitle="Recorded painter sales"
          color="blue"
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />

        <StatCard
          title="Total Sales Value"
          value={salesLoading ? null : `₹${(summary.totalAmount || 0).toLocaleString('en-IN')}`}
          subtitle="Gross referred revenue"
          color="indigo"
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <StatCard
          title="Total Points Issued"
          value={salesLoading ? null : `+${(summary.totalPoints || 0).toLocaleString('en-IN')} pts`}
          subtitle="Accumulated painter rewards"
          color="emerald"
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />

        <StatCard
          title="Active Reward Cycle"
          value={cyclesLoading ? null : (activeCycle ? 'Open' : 'None')}
          subtitle={activeCycle ? `${activeCycle.startDate?.slice(0, 7)} to ${activeCycle.endDate?.slice(0, 7)}` : 'Create cycle to record'}
          color={activeCycle ? 'emerald' : 'amber'}
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search customer name or mobile..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 shadow-xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main List Section */}
      {salesLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-4 shadow-xs">
          <div className="w-8 h-8 mx-auto border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading sales records...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 shadow-xs">
          <p className="font-semibold text-sm">Failed to load sales</p>
          <p className="text-xs text-red-500 mt-1">{error?.message || 'Server error'}</p>
        </div>
      ) : sales.length === 0 ? (
        <EmptyState
          title={search ? 'No sales found matching search' : 'No sales recorded yet'}
          description={
            search
              ? `No customer records or invoices matched "${search}". Try checking the spelling or mobile number.`
              : 'Log customer invoices with referring painters. Reward points and immutable price snapshots will be calculated automatically.'
          }
          actionLabel={search ? 'Clear Search' : 'Record First Sale'}
          onAction={() => {
            if (search) {
              setSearch('');
              setPage(1);
            } else {
              setIsRecordModalOpen(true);
            }
          }}
          icon={
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          note="Item prices and reward points are permanently snapshotted upon sale creation to preserve historical accounting."
        />
      ) : (
        <div className="space-y-4">
          <SaleTable sales={sales} />
          <SaleCardList sales={sales} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{pagination.total}</span> sales
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

      {/* Record Sale Modal */}
      <RecordSaleModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={(msg) => triggerToast(msg)}
        activeCycle={activeCycle}
      />
    </div>
  );
}
