'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSale } from '@/lib/hooks/useSales';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));
  } catch {
    return '—';
  }
};

const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(d));
  } catch {
    return '—';
  }
};

export default function AdminSaleDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useSale(id);

  const sale = data?.data;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading invoice details…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-2">
        <p className="font-semibold text-red-700 text-sm">Failed to load invoice</p>
        <p className="text-xs text-red-500">{error?.message || 'Server error'}</p>
        <Link
          href="/admin/sales"
          className="inline-block mt-3 text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
        >
          ← Back to Sales
        </Link>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
        <p className="text-sm text-slate-600 font-medium">Invoice not found.</p>
        <Link
          href="/admin/sales"
          className="inline-block mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
        >
          ← Back to Sales
        </Link>
      </div>
    );
  }

  const lineItems = sale.lineItems || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/admin/sales" className="hover:text-slate-800 transition-colors">
            Sales & Points
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-900 font-semibold">
            #{sale.id.slice(-6).toUpperCase()}
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/sales"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
            All Sales
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect width="12" height="8" x="6" y="14" />
            </svg>
            Print Receipt
          </button>
        </div>
      </div>

      {/* Invoice Banner / Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                Invoice #{sale.id.slice(-6).toUpperCase()}
              </h1>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                +{sale.totalPoints} Reward Points
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sale Date: <span className="font-semibold text-slate-800">{formatDate(sale.date)}</span>
              <span className="mx-2">•</span>
              Recorded: <span>{formatDateTime(sale.createdAt)}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Invoice Amount
            </span>
            <div className="text-2xl font-black text-slate-900">
              ₹{(sale.totalAmount || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Stakeholder Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Referring Painter */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Referring Painter
            </div>
            {sale.painter ? (
              <div>
                <Link
                  href={`/admin/painters/${sale.painter.id || sale.painterId}`}
                  className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors"
                >
                  {sale.painter.firstName}
                </Link>
                <div className="text-xs text-slate-600 mt-0.5">{sale.painter.mobile}</div>
                {sale.painter.email && (
                  <div className="text-[11px] text-slate-400">{sale.painter.email}</div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Painter ID: {sale.painterId}</p>
            )}
          </div>

          {/* Customer */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Purchasing Customer
            </div>
            {sale.customer ? (
              <div>
                <p className="font-bold text-sm text-slate-900">{sale.customer.name}</p>
                <div className="text-xs text-slate-600 mt-0.5">{sale.customer.mobile}</div>
                <div className="text-[10px] text-emerald-600 font-medium mt-1">Verified Customer</div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Customer record attached</p>
            )}
          </div>

          {/* Reward Cycle */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Reward Cycle Bound
            </div>
            {sale.cycle ? (
              <div>
                <p className="font-bold text-xs text-slate-900">
                  {formatDate(sale.cycle.startDate)} → {formatDate(sale.cycle.endDate)}
                </p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      sale.cycle.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {sale.cycle.isActive ? 'Active Cycle' : 'Archived / Closed'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Cycle ID: {sale.cycleId}</p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Purchased Line Items & Snapshots
            </h2>
            <span className="text-xs text-slate-500">
              {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Item Details</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Price / Unit</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                  <th className="px-4 py-3 text-right">Points / Unit</th>
                  <th className="px-4 py-3 text-right">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {lineItems.map((li, index) => {
                  const itemName = li.itemName || li.item?.name || 'Item';
                  const brand = li.item?.brand || '';

                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{itemName}</div>
                        {brand && <div className="text-[11px] text-slate-400">{brand}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                        {li.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600 font-mono">
                        ₹{(li.pricePerUnit || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 font-mono">
                        ₹{(li.lineTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600">
                        {li.pointsPerUnit} pts
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        +{li.pointsEarned} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-900">
                  <td colSpan={3} className="px-4 py-3.5 text-right uppercase tracking-wider text-slate-600">
                    Grand Totals:
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-black font-mono text-slate-900">
                    ₹{(sale.totalAmount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-500">—</td>
                  <td className="px-4 py-3.5 text-right text-sm font-black text-emerald-600">
                    +{sale.totalPoints} pts
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bill Image Attachment */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Invoice / Bill Image
            </span>
            {sale.billImageUrl && (
              <a
                href={sale.billImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1"
              >
                <span>Open original bill</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>

          {sale.billImageUrl ? (
            <div className="relative max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
              <img
                src={sale.billImageUrl}
                alt={`Bill for invoice ${sale.id}`}
                className="w-full h-auto max-h-60 object-contain bg-slate-100"
              />
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No bill image attached.</p>
          )}
        </div>

        {/* Immutability / Snapshot Integrity Notice */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3 text-emerald-900">
          <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div className="text-xs">
            <strong className="font-semibold text-emerald-950">
              Historical Snapshot Protected:
            </strong>{' '}
            The prices and points per unit displayed in this invoice were permanently locked when this sale was recorded. Future changes to Item catalog prices or reward points do not alter this historical invoice.
          </div>
        </div>
      </div>
    </div>
  );
}
