import React from 'react';
import Link from 'next/link';

/**
 * EmptyState — Reusable Placeholder Card for Empty Business Views.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon] - Centered visual icon
 * @param {string} props.title - Empty state title
 * @param {string} props.description - Explanatory message
 * @param {string} [props.actionLabel] - Call to action button text
 * @param {string} [props.actionHref] - Link URL for CTA
 * @param {() => void} [props.onAction] - Button callback
 * @param {string} [props.note] - Optional phase/context note
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  note,
}) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs my-4">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 mx-auto flex items-center justify-center mb-4 shadow-xs">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <div className="flex justify-center mb-4">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs hover:shadow-sm transition-all"
            >
              <span>{actionLabel}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs hover:shadow-sm transition-all"
            >
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      )}

      {note && (
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-4 mt-4">
          {note}
        </p>
      )}
    </div>
  );
}
