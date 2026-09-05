'use client';

import React from 'react';
import Link from 'next/link';

export default function PainterTable({ painters, onStatusClick }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return '—';
    }
  };

  return (
    <div className="hidden md:block overflow-hidden bg-white rounded-xl border border-slate-200 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3">
                Painter
              </th>
              <th scope="col" className="px-3 py-3.5">
                Contact
              </th>
              <th scope="col" className="px-3 py-3.5">
                Status
              </th>
              <th scope="col" className="px-3 py-3.5">
                Joined
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {painters.map((painter) => {
              const isActive = painter.status === 'active';

              return (
                <tr
                  key={painter.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {/* Photo & Name */}
                  <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {painter.photoUrl ? (
                        <img
                          src={painter.photoUrl}
                          alt={painter.firstName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {painter.firstName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">
                          {painter.firstName}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: {painter.id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact (Mobile & Email) */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-slate-900 font-medium">
                      {painter.mobile}
                    </div>
                    <div className="text-xs text-slate-500">
                      {painter.email}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-4 whitespace-nowrap">
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

                  {/* Joined Date */}
                  <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-500">
                    {formatDate(painter.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 pl-3 pr-6 whitespace-nowrap text-right text-xs">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/painters/${painter.id}`}
                        className="px-3 py-1.5 font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View Profile
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          onStatusClick(
                            painter,
                            isActive ? 'deactivate' : 'activate'
                          )
                        }
                        className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                          isActive
                            ? 'text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60'
                            : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60'
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
    </div>
  );
}
