'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import RewardTierModal from '@/components/admin/rewards/RewardTierModal';
import RewardTierStatusConfirmModal from '@/components/admin/rewards/RewardTierStatusConfirmModal';
import {
  useRewardTiers,
  useCreateRewardTier,
  useUpdateRewardTier,
  useDeactivateRewardTier,
  useActivateRewardTier,
} from '@/lib/hooks/useRewardTiers';

export default function AdminRewardsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, isError, error } = useRewardTiers({
    page,
    limit: 10,
    status: statusFilter,
  });

  const tiers = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Mutations
  const createMutation = useCreateRewardTier();
  const updateMutation = useUpdateRewardTier();
  const deactivateMutation = useDeactivateRewardTier();
  const activateMutation = useActivateRewardTier();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    tier: null,
    actionType: 'deactivate',
    error: '',
  });

  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenCreate = () => {
    setSelectedTier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tier) => {
    setSelectedTier(tier);
    setIsModalOpen(true);
  };

  const handleSaveTier = async (formData) => {
    if (selectedTier) {
      const res = await updateMutation.mutateAsync({
        id: selectedTier.id || selectedTier._id,
        data: formData,
      });
      triggerToast(`Reward tier "${res.data?.suggestedRewardName}" updated successfully.`);
    } else {
      const res = await createMutation.mutateAsync(formData);
      triggerToast(`Reward tier "${res.data?.suggestedRewardName}" created successfully.`);
    }
  };

  const handleOpenStatusConfirm = (tier, actionType) => {
    setConfirmModal({
      isOpen: true,
      tier,
      actionType,
      error: '',
    });
  };

  const handleConfirmStatus = async () => {
    if (!confirmModal.tier) return;
    try {
      const tierId = confirmModal.tier.id || confirmModal.tier._id;
      if (confirmModal.actionType === 'deactivate') {
        await deactivateMutation.mutateAsync(tierId);
        triggerToast(`Tier "${confirmModal.tier.suggestedRewardName}" deactivated successfully.`);
      } else {
        await activateMutation.mutateAsync(tierId);
        triggerToast(`Tier "${confirmModal.tier.suggestedRewardName}" activated successfully.`);
      }
      setConfirmModal({ isOpen: false, tier: null, actionType: 'deactivate', error: '' });
    } catch (err) {
      setConfirmModal((prev) => ({
        ...prev,
        error: err.message || 'Failed to update tier status.',
      }));
    }
  };

  // Top metric calculations from all active tiers in view or dataset
  const activeTiers = tiers.filter((t) => t.status === 'active');
  const lowestThreshold = activeTiers.length > 0
    ? Math.min(...activeTiers.map((t) => t.minPoints))
    : null;
  const highestThreshold = activeTiers.length > 0
    ? Math.max(...activeTiers.map((t) => t.maxPoints))
    : null;

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
        title="Reward Tiers"
        description="Configure point ranges and the reward suggested for painters."
        badge="Reward Engine"
        actions={[
          {
            label: 'Add Reward Tier',
            onClick: handleOpenCreate,
            icon: (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            ),
          },
        ]}
      />

      {/* ── Top Summary Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Active Tiers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 8h10" />
              <path d="M7 12h10" />
              <path d="M7 16h6" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Active Reward Tiers</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? '…' : activeTiers.length}
            </span>
          </div>
        </div>

        {/* Lowest Threshold */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Lowest Threshold</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? '…' : lowestThreshold !== null ? `${lowestThreshold} pts` : 'None'}
            </span>
          </div>
        </div>

        {/* Highest Threshold */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Highest Threshold</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? '…' : highestThreshold !== null ? `${highestThreshold} pts` : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Content Card ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Tiers
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('active');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'deactivated'
                  ? 'bg-white text-slate-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Deactivated
            </button>
          </div>

          <span className="text-xs text-slate-400">
            {pagination.total} {pagination.total === 1 ? 'tier configured' : 'tiers configured'}
          </span>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reward tiers…</div>
        ) : isError ? (
          <div className="p-12 text-center text-xs text-red-500">
            {error?.message || 'Failed to load reward tiers.'}
          </div>
        ) : tiers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No reward tiers found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {statusFilter !== 'all'
                  ? 'No reward tiers match the selected status filter.'
                  : 'Configure point ranges and incentives so painters can see what rewards they are working towards.'}
              </p>
            </div>
            {statusFilter === 'all' && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
              >
                + Add First Tier
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                  <th className="py-3.5 px-5">Points Range</th>
                  <th className="py-3.5 px-5">Suggested Reward</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tiers.map((tier) => {
                  const isActive = tier.status === 'active';
                  const tierId = tier.id || tier._id;

                  return (
                    <tr key={tierId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-900 font-mono text-sm bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {tier.minPoints} &ndash; {tier.maxPoints} pts
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="font-bold text-slate-900 text-sm">
                            {tier.suggestedRewardName}
                          </span>
                        </div>
                      </td>
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
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tier)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenStatusConfirm(
                                tier,
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
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
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

      {/* ── Create / Edit Modal ───────────────────────────────────────── */}
      <RewardTierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTier(null);
        }}
        onSubmit={handleSaveTier}
        tier={selectedTier}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* ── Status Confirmation Modal ─────────────────────────────────── */}
      <RewardTierStatusConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, tier: null, actionType: 'deactivate', error: '' })
        }
        onConfirm={handleConfirmStatus}
        tier={confirmModal.tier}
        actionType={confirmModal.actionType}
        isSubmitting={deactivateMutation.isPending || activateMutation.isPending}
        error={confirmModal.error}
      />
    </div>
  );
}
