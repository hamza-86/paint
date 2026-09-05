'use client';

import React from 'react';
import PageHeader from '@/components/admin/PageHeader';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminCompaniesPage() {
  const handleAddCompany = () => {
    alert('Partner company registration will be enabled in an upcoming phase.');
  };

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Manage partner companies, distributor agreements, and company incentive history."
        badge="Partners"
        actions={{
          label: 'Add Company',
          onClick: handleAddCompany,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
              <line x1="10" x2="14" y1="6" y2="6" />
              <line x1="10" x2="14" y1="10" y2="10" />
            </svg>
          ),
        }}
      />

      <EmptyState
        title="No partner companies registered yet"
        description="Register partner paint manufacturers (e.g. Asian Paints, Berger, Nerolac) to track bulk incentives, volume schemes, and promotional rewards given to the shop."
        actionLabel="Add First Company"
        onAction={handleAddCompany}
        icon={
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
          </svg>
        }
        note="Company incentives & target volume tracking will be enabled in a future phase."
      />
    </div>
  );
}
