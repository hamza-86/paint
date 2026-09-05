import React from 'react';
import Link from 'next/link';

/**
 * PageHeader — Standardized Header for Admin Section Pages.
 *
 * @param {object} props
 * @param {string} props.title - Page heading
 * @param {string} [props.description] - Descriptive summary
 * @param {object|object[]} [props.actions] - Primary or secondary action button(s)
 * @param {string} [props.badge] - Optional badge tag
 */
export default function PageHeader({
  title,
  description,
  actions,
  badge,
}) {
  const actionsList = actions
    ? Array.isArray(actions)
      ? actions
      : [actions]
    : [];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionsList.length > 0 && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actionsList.map((act, idx) => {
            const isPrimary = act.variant !== 'secondary';
            const baseClass = isPrimary
              ? 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs hover:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-500'
              : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all';

            if (act.href) {
              return (
                <Link key={idx} href={act.href} className={baseClass}>
                  {act.icon}
                  <span>{act.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={act.onClick}
                className={baseClass}
              >
                {act.icon}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
