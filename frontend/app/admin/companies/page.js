'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import CompanyModal from '@/components/admin/companies/CompanyModal';
import CompanyStatusConfirmModal from '@/components/admin/companies/CompanyStatusConfirmModal';
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeactivateCompany,
  useActivateCompany,
} from '@/lib/hooks/useCompanies';

export default function AdminCompaniesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, error } = useCompanies({
    page,
    limit: 10,
    search: searchTerm,
    status: statusFilter,
  });

  const companies = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const counts = data?.counts || { total: 0, active: 0, deactivated: 0 };

  // Mutations
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deactivateMutation = useDeactivateCompany();
  const activateMutation = useActivateCompany();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    company: null,
    actionType: 'deactivate',
    error: '',
  });

  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchQuery.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchTerm('');
    setPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleSaveCompany = async (formData) => {
    if (selectedCompany) {
      const res = await updateMutation.mutateAsync({
        id: selectedCompany.id || selectedCompany._id,
        data: formData,
      });
      triggerToast(`Company "${res.data?.name || formData.name}" updated successfully.`);
    } else {
      const res = await createMutation.mutateAsync(formData);
      triggerToast(`Company "${res.data?.name || formData.name}" registered successfully.`);
    }
  };

  const handleOpenStatusConfirm = (company, actionType) => {
    setConfirmModal({
      isOpen: true,
      company,
      actionType,
      error: '',
    });
  };

  const handleConfirmStatus = async () => {
    if (!confirmModal.company) return;
    try {
      const companyId = confirmModal.company.id || confirmModal.company._id;
      if (confirmModal.actionType === 'deactivate') {
        await deactivateMutation.mutateAsync(companyId);
        triggerToast(`Company "${confirmModal.company.name}" deactivated successfully.`);
      } else {
        await activateMutation.mutateAsync(companyId);
        triggerToast(`Company "${confirmModal.company.name}" activated successfully.`);
      }
      setConfirmModal({ isOpen: false, company: null, actionType: 'deactivate', error: '' });
    } catch (err) {
      setConfirmModal((prev) => ({
        ...prev,
        error: err.message || 'Failed to update company status.',
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

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
        title="Companies"
        description="Manage paint manufacturers and incentive partners."
        badge="Partners"
        actions={[
          {
            label: 'Add Company',
            onClick: handleOpenCreate,
            icon: (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            ),
          },
        ]}
      />

      {/* ── Top Summary Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Active Companies */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Total Active Companies</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? '…' : counts.active}
            </span>
          </div>
        </div>

        {/* Total Companies */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
              <line x1="10" x2="14" y1="6" y2="6" />
              <line x1="10" x2="14" y1="10" y2="10" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Total Companies</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? '…' : counts.total}
            </span>
          </div>
        </div>

        {/* Deactivated Companies */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Deactivated Companies</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? '…' : counts.deactivated}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Content Card ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Bar: Tabs & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Companies
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('active');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('deactivated');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'deactivated'
                  ? 'bg-white text-slate-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Deactivated
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies..."
                className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Loading / Error / Empty States */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading companies…</div>
        ) : isError ? (
          <div className="p-12 text-center text-xs text-red-500">
            {error?.message || 'Failed to load companies.'}
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                <line x1="10" x2="14" y1="6" y2="6" />
                <line x1="10" x2="14" y1="10" y2="10" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No companies found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? `No company names match "${searchTerm}".`
                  : statusFilter !== 'all'
                  ? `No companies found with status "${statusFilter}".`
                  : 'Register partner paint manufacturers (e.g. Asian Paints, Berger Paints, Nerolac) to track brand master records.'}
              </p>
            </div>
            {!searchTerm && statusFilter === 'all' && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
              >
                + Add First Company
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                    <th className="py-3.5 px-5">Company Name</th>
                    <th className="py-3.5 px-5">Details</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Created</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((company) => {
                    const isActive = company.status === 'active';
                    const companyId = company.id || company._id;

                    return (
                      <tr key={companyId} className="hover:bg-slate-50/50 transition-colors">
                        {/* Company Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {company.name.slice(0, 2)}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">
                              {company.name}
                            </span>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="py-4 px-5 max-w-xs">
                          <span className="text-slate-600 text-xs line-clamp-2">
                            {company.details || <span className="text-slate-300 italic">No notes</span>}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        {/* Created */}
                        <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                          {formatDate(company.createdAt)}
                        </td>

                        {/* Actions (NO DELETE) */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(company)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenStatusConfirm(
                                  company,
                                  isActive ? 'deactivate' : 'activate'
                                )
                              }
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                                isActive
                                  ? 'text-amber-700 hover:bg-amber-50 border-amber-200'
                                  : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                              }`}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Visible only on mobile) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {companies.map((company) => {
                const isActive = company.status === 'active';
                const companyId = company.id || company._id;

                return (
                  <div key={companyId} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {company.name.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">
                            {company.name}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Created {formatDate(company.createdAt)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </div>

                    {company.details && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {company.details}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(company)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenStatusConfirm(
                            company,
                            isActive ? 'deactivate' : 'activate'
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                          isActive
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs bg-slate-50/30">
            <span className="text-slate-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCompany}
        company={selectedCompany}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <CompanyStatusConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, company: null, actionType: 'deactivate', error: '' })}
        onConfirm={handleConfirmStatus}
        company={confirmModal.company}
        actionType={confirmModal.actionType}
        isSubmitting={deactivateMutation.isPending || activateMutation.isPending}
        error={confirmModal.error}
      />
    </div>
  );
}
