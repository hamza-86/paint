'use client';

import React from 'react';

/**
 * ActivityFeed
 * Unified real-time feed across sales, painter reward assignments, and company rewards.
 */
export default function ActivityFeed({ activities = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasData = Array.isArray(activities) && activities.length > 0;

  const typeStyles = {
    sale: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'Sale',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    reward_assignment: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: 'Gift Awarded',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="14" x="3" y="8" rx="2" />
          <path d="M12 5a3 3 0 1 0-3 3" />
          <path d="M12 5a3 3 0 1 1 3 3" />
          <path d="M12 8v14" />
          <path d="M3 13h18" />
        </svg>
      ),
    },
    company_reward: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'Company Entry',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <line x1="12" x2="12" y1="12" y2="22" />
        </svg>
      ),
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Live Activity Feed
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified stream of sales, reward assignments, and manufacturer entries
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-sm font-semibold text-slate-700">No Recent Activity</p>
          <p className="text-xs text-slate-400 mt-0.5">
            System events will appear here in chronological order.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {activities.map((act) => {
            const config = typeStyles[act.type] || typeStyles.sale;
            const dateFormatted = new Date(act.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={act.id} className="relative flex items-start justify-between gap-3 text-xs">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border shadow-xs ${config.bg}`}
                >
                  {config.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${config.bg}`}
                    >
                      {config.badge}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs truncate">
                    {act.description}
                  </p>
                </div>

                <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                  {dateFormatted}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
