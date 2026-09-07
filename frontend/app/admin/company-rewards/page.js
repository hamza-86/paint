'use client';

import React, { useState, useCallback, useMemo } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import CompanyRewardModal from '@/components/admin/companyRewards/CompanyRewardModal';
import {
  useCompanyRewards,
  useCreateCompanyReward,
  useUpdateCompanyReward,
} from '@/lib/hooks/useCompanyRewards';
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

function formatCurrency(val) {
  if (val === undefined || val === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatNumber(val) {
  if (val === undefined || val === null) return '—';
  return new Intl.NumberFormat('en-IN').format(val);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, color }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs`}>
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

function EmptyState({ filtered, onClearSearch, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-400 flex items-center justify-center mb-4">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      {filtered ? (
        <>
          <p className="font-semibold text-slate-700 text-lg">No entries match your filters</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">Try adjusting your search or date filters.</p>
          <button
            onClick={onClearSearch}
            className="mt-4 px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </>
      ) : (
        <>
          <p className="font-semibold text-slate-700 text-lg">No incentive records yet</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Log the first company incentive received to get started.
          </p>
          <button
            onClick={onAdd}
            className="mt-4 px-5 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors shadow-sm"
          >
            Log First Incentive
          </button>
        </>
      )}
    </div>
  );
}

function RewardItemsBadge({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50/90 border border-amber-200/80 text-xs text-amber-800 font-medium"
          >
            <span className="font-bold text-amber-900">{item.quantity}×</span>
            <span>{item.name}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Inventory Synced
        </span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminCompanyRewardsPage() {
  const [page, setPage] = useState(1);
  const [companyFilter, setCompanyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  }, []);

  // Data
  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      companyId: companyFilter || undefined,
      search: searchTerm || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [page, companyFilter, searchTerm, dateFrom, dateTo]
  );

  const { data, isLoading, isError, error } = useCompanyRewards(filters);
  const entries = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const summary = data?.summary || { totalEntries: 0, totalSaleValue: 0, totalQuantitySold: 0 };

  // All active companies for modal dropdown and filter bar
  const { data: companiesData } = useCompanies({ limit: 200, status: 'active' });
  const { data: allCompaniesData } = useCompanies({ limit: 200 });
  const activeCompanies = companiesData?.data || [];
  const allCompanies = allCompaniesData?.data || [];

  // Mutations
  const createMutation = useCreateCompanyReward();
  const updateMutation = useUpdateCompanyReward();

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleOpenCreate = useCallback(() => {
    setSelectedEntry(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  }, []);

  const handleSaveEntry = useCallback(
    async (formData) => {
      if (selectedEntry) {
        const res = await updateMutation.mutateAsync({
          id: selectedEntry.id || selectedEntry._id,
          data: formData,
        });
        triggerToast(`Incentive record for ${res.data?.company?.name || 'company'} updated.`);
      } else {
        const res = await createMutation.mutateAsync(formData);
        triggerToast(`Incentive record for ${res.data?.company?.name || 'company'} logged.`);
      }
    },
    [selectedEntry, createMutation, updateMutation, triggerToast]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchQuery.trim());
    setPage(1);
  };

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSearchTerm('');
    setCompanyFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

  const isFiltered = !!(searchTerm || companyFilter || dateFrom || dateTo);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white text-sm px-5 py-3.5 rounded-xl shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-200">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20,6 9,17 4,12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Company Reward History"
        description="Track incentives and rewards received from paint companies based on sales performance."
        badge={summary.totalEntries > 0 ? `${summary.totalEntries} Records` : undefined}
        actions={{
          label: 'Log Incentive',
          onClick: handleOpenCreate,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ),
        }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Records"
          value={formatNumber(summary.totalEntries)}
          color="bg-amber-50 text-amber-600"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11H3" /><path d="M11 7H3" /><path d="M13 3H3" />
              <path d="M15 3l6 6-6 6" />
            </svg>
          }
        />
        <SummaryCard
          label="Total Sale Value"
          value={formatCurrency(summary.totalSaleValue)}
          color="bg-emerald-50 text-emerald-600"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <SummaryCard
          label="Total Qty Sold"
          value={formatNumber(summary.totalQuantitySold)}
          color="bg-blue-50 text-blue-600"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          }
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Search
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by company or reward…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Company filter */}
          <div className="min-w-[180px]">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Company
            </label>
            <select
              value={companyFilter}
              onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-700"
            >
              <option value="">All Companies</option>
              {allCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors shadow-sm"
          >
            Apply
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Table / Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Loading records…</span>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex items-center gap-3 p-6 m-4 rounded-xl bg-red-50 border border-red-200">
            <svg className="w-5 h-5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-700">{error?.message || 'Failed to load incentive records.'}</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && entries.length === 0 && (
          <EmptyState
            filtered={isFiltered}
            onClearSearch={handleClearFilters}
            onAdd={handleOpenCreate}
          />
        )}

        {/* Table */}
        {!isLoading && !isError && entries.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Company</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Period</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Qty Sold</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Sale Value</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Reward Received</th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.id || entry._id} className="group hover:bg-slate-50 transition-colors">
                      {/* Company */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
                            {(entry.company?.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-tight">
                              {entry.company?.name || '—'}
                            </p>
                            {entry.company?.status !== 'active' && (
                              <span className="text-[10px] text-slate-400 italic">deactivated</span>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Period */}
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-700 font-medium">
                          {formatDate(entry.dateFrom)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          → {formatDate(entry.dateTo)}
                        </div>
                      </td>
                      {/* Qty */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-slate-800">{formatNumber(entry.quantitySold)}</span>
                      </td>
                      {/* Sale value */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-emerald-700">{formatCurrency(entry.saleValue)}</span>
                      </td>
                      {/* Reward */}
                      <td className="px-5 py-4 max-w-xs">
                        {entry.rewardItems && entry.rewardItems.length > 0 ? (
                          <RewardItemsBadge items={entry.rewardItems} />
                        ) : (
                          <p className="text-slate-700 text-xs leading-relaxed line-clamp-2">
                            {entry.rewardReceivedDescription || '—'}
                          </p>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit record"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                          </svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {entries.map((entry) => (
                <div key={entry.id || entry._id} className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-sm">
                        {(entry.company?.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{entry.company?.name || '—'}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(entry.dateFrom)} → {formatDate(entry.dateTo)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEdit(entry)}
                      className="shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </button>
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qty Sold</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{formatNumber(entry.quantitySold)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Sale Value</p>
                      <p className="text-sm font-bold text-emerald-700 mt-0.5">{formatCurrency(entry.saleValue)}</p>
                    </div>
                  </div>
                  {/* Reward details */}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1">Reward Items Received</p>
                    {entry.rewardItems && entry.rewardItems.length > 0 ? (
                      <RewardItemsBadge items={entry.rewardItems} />
                    ) : (
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.rewardReceivedDescription || '—'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-700">
                    {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-700">{pagination.total}</span> records
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15,18 9,12 15,6" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let p;
                    if (pagination.totalPages <= 5) {
                      p = i + 1;
                    } else if (page <= 3) {
                      p = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      p = pagination.totalPages - 4 + i;
                    } else {
                      p = page - 2 + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          p === page
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <CompanyRewardModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSaveEntry}
        entry={selectedEntry}
        companies={selectedEntry ? allCompanies : activeCompanies}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
