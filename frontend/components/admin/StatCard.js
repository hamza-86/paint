import React from 'react';

/**
 * StatCard — Reusable KPI / Stat Display Component.
 * Supports clean placeholder states when real data is not yet recorded.
 *
 * @param {object} props
 * @param {string} props.title - Metric title
 * @param {string|number} [props.value] - Current value or placeholder indicator
 * @param {string} [props.subtitle] - Helper or context note
 * @param {React.ReactNode} [props.icon] - Metric icon
 * @param {string} [props.badge] - Optional status badge text
 * @param {'blue'|'amber'|'emerald'|'purple'|'slate'} [props.accent='blue'] - Color accent theme
 */
export default function StatCard({
  title,
  value = '—',
  subtitle,
  icon,
  badge,
  accent = 'blue',
}) {
  const accentStyles = {
    blue: {
      bg: 'bg-blue-50/70',
      text: 'text-blue-700',
      border: 'border-blue-100',
      iconBg: 'bg-blue-600 text-white',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    amber: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-700',
      border: 'border-amber-100',
      iconBg: 'bg-amber-500 text-white',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    emerald: {
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    purple: {
      bg: 'bg-purple-50/70',
      text: 'text-purple-700',
      border: 'border-purple-100',
      iconBg: 'bg-purple-600 text-white',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      iconBg: 'bg-slate-700 text-white',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  }[accent] || accentStyles.blue;

  const isPlaceholder = value === '—' || value === null || value === undefined;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isPlaceholder ? 'text-slate-400 font-mono' : 'text-slate-900'
              }`}
            >
              {value}
            </span>
          </div>
        </div>

        {icon && (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-xs shrink-0 ${accentStyles.iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-500 truncate">{subtitle}</span>
        {badge && (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${accentStyles.badge}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
