'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import EmptyState from '@/components/admin/EmptyState';
import { useCustomers } from '@/lib/hooks/useCustomers';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));
  } catch {
    return '—';
  }
};

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, isPlaceholderData } = useCustomers({
    page,
    limit: 10,
    search,
  });

  const customers = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="View referred customers associated with painter sales invoices."
        badge="Directory"
      />

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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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

      {/* Customer List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-4 shadow-xs">
          <div className="w-8 h-8 mx-auto border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading customers...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 shadow-xs">
          <p className="font-semibold text-sm">Failed to load customers</p>
          <p className="text-xs text-red-500 mt-1">{error?.message || 'Server error'}</p>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          title={search ? 'No customers found' : 'No customers recorded yet'}
          description={
            search
              ? `No customer records matched "${search}".`
              : 'Customers are automatically registered and deduplicated by mobile when recording sales invoices.'
          }
          actionLabel="View Sales"
          onAction={() => {
            window.location.href = '/admin/sales';
          }}
          icon={
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          note="Customers do not need separate authentication accounts; their mobile numbers associate referred sales."
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="w-full bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5">Mobile Number</th>
                  <th className="px-5 py-3.5 text-center">Invoices / Sales</th>
                  <th className="px-5 py-3.5">Last Sale Date</th>
                  <th className="px-5 py-3.5 text-center">First Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {c.name}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      {c.mobile}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                        {c.salesCount} {c.salesCount === 1 ? 'sale' : 'sales'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {formatDate(c.lastSaleDate)}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-400 text-[11px]">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {customers.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{c.mobile}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                    {c.salesCount} sales
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-50 flex justify-between">
                  <span>Last purchase: {formatDate(c.lastSaleDate)}</span>
                  <span>Member since: {formatDate(c.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{pagination.total}</span> customers
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
    </div>
  );
}
