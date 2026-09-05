'use client';

import React from 'react';
import PageHeader from '@/components/admin/PageHeader';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminRewardsPage() {
  const handleAddReward = () => {
    alert('Reward inventory creation will be enabled in an upcoming phase.');
  };

  const handleAssignReward = () => {
    alert('Painter reward assignment will be enabled in an upcoming phase.');
  };

  return (
    <div>
      <PageHeader
        title="Rewards"
        description="Manage painter rewards, physical inventory, and reward tier thresholds."
        badge="Incentives"
        actions={[
          {
            label: 'Assign Reward',
            variant: 'secondary',
            onClick: handleAssignReward,
            icon: (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            ),
          },
          {
            label: 'Add Reward',
            onClick: handleAddReward,
            icon: (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="14" x="3" y="8" rx="2" />
                <path d="M12 5a3 3 0 1 0-3 3" />
                <path d="M12 5a3 3 0 1 1 3 3" />
                <path d="M3 12h18" />
                <path d="M12 8v14" />
              </svg>
            ),
          },
        ]}
      />

      <EmptyState
        title="No rewards created yet"
        description="Configure your reward inventory (e.g. appliances, tools, gift cards) and tier thresholds so painters can redeem earned points at the end of each cycle."
        actionLabel="Add Reward Item"
        onAction={handleAddReward}
        icon={
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="14" x="3" y="8" rx="2" />
            <path d="M12 5a3 3 0 1 0-3 3" />
            <path d="M12 5a3 3 0 1 1 3 3" />
            <path d="M3 12h18" />
            <path d="M12 8v14" />
          </svg>
        }
        note="Reward inventory tracking and painter redemptions will be enabled in a dedicated phase."
      />
    </div>
  );
}
