'use client';

import { usePainterPortalMe, usePainterPortalCycles } from '@/lib/hooks/usePainterPortal';

function formatINR(val) {
  if (typeof val !== 'number') return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(d);
  }
}

export default function PainterProfilePage() {
  const { data: meRes, isLoading: meLoading } = usePainterPortalMe();
  const { data: cyclesRes, isLoading: cyclesLoading } = usePainterPortalCycles();

  const painter = meRes?.data;
  const cycles = cyclesRes?.data || [];

  if (meLoading || cyclesLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-44 bg-slate-900 rounded-3xl border border-slate-800"></div>
        <div className="h-64 bg-slate-900 rounded-3xl border border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>👤</span>
          <span>My Profile & Cycle History</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Your registered details and performance record across all reward cycles.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {painter?.photoUrl ? (
          <img
            src={painter.photoUrl}
            alt={painter.firstName}
            className="w-24 h-24 rounded-3xl object-cover border-2 border-indigo-500/40 shadow-lg flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-lg flex-shrink-0">
            {painter?.firstName?.[0] || 'P'}
          </div>
        )}

        <div className="space-y-4 flex-1 text-center sm:text-left">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl font-black text-white">{painter?.firstName}</h2>
              <span className="self-center sm:self-auto inline-block px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                {painter?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Registered Painter Account (Read-Only)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Mobile Number:</span>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                {painter?.mobile || '—'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Email Address:</span>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                {painter?.email || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Cycles Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📅</span>
            <span>Reward Cycles History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Previous closed cycles remain visible for auditing your historical achievements.
          </p>
        </div>

        {cycles.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No cycle history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
                <tr>
                  <th className="py-3 px-4">Cycle Period</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Purchases</th>
                  <th className="py-3 px-4 text-right">Sales Total</th>
                  <th className="py-3 px-4 text-center">Points</th>
                  <th className="py-3 px-4 text-center">Rewards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cycles.map((item) => (
                  <tr
                    key={item.cycle.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      item.isCurrentCycle ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {formatDate(item.cycle.startDate)} — {formatDate(item.cycle.endDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isCurrentCycle ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-400 font-bold text-[10px] uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Current
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">
                      {item.salesCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                      {formatINR(item.totalSalesValue)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/60">
                        {item.totalPoints}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">
                      {item.rewardsCount > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          {item.rewardsCount} item{item.rewardsCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
