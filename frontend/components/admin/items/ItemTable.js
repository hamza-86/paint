'use client';

import React from 'react';
import Link from 'next/link';

export default function ItemTable({ items, onEditClick, onStatusClick }) {
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '—';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(val);
    } catch {
      return `₹${val}`;
    }
  };

  return (
    <div className="hidden md:block overflow-hidden bg-white rounded-xl border border-slate-200 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3">
                Item
              </th>
              <th scope="col" className="px-3 py-3.5">
                Brand & Category
              </th>
              <th scope="col" className="px-3 py-3.5">
                Price
              </th>
              <th scope="col" className="px-3 py-3.5">
                Points / Unit
              </th>
              <th scope="col" className="px-3 py-3.5">
                Status
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {items.map((item) => {
              const isActive = item.status === 'active';

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Image & Name */}
                  <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-50 shadow-xs"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0 shadow-xs ${
                          item.imageUrl ? 'hidden' : ''
                        }`}
                      >
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <line x1="12" x2="12" y1="2" y2="12" />
                        </svg>
                      </div>
                      <div className="max-w-xs truncate">
                        <Link
                          href={`/admin/items/${item.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <div className="text-xs text-slate-400">
                          ID: {item.id ? `${item.id.slice(0, 8)}...` : '—'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Brand & Category */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-800">
                      {item.brand || <span className="text-slate-400">Generic</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.category || <span className="text-slate-400">Uncategorized</span>}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 font-mono">
                      {formatCurrency(item.price)}
                    </span>
                  </td>

                  {/* Points / Unit */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-semibold">
                      <svg
                        className="w-3.5 h-3.5 text-amber-600"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {item.points} pts / unit
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
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

                  {/* Actions */}
                  <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {/* View details */}
                      <Link
                        href={`/admin/items/${item.id}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View item details"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEditClick(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit item"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>

                      {/* Deactivate / Reactivate */}
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => onStatusClick(item, 'deactivate')}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-md border border-amber-200 transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onStatusClick(item, 'activate')}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-md border border-emerald-200 transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
