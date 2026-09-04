import Link from 'next/link';

/**
 * Homepage — Setup Verification Page
 *
 * Single-Shop Painter Management Platform (Next.js Frontend)
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-6 py-16 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Single-Shop Architecture Ready
        </div>

        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-900/40">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
            />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          Paint Shop Platform
        </h1>
        <p className="text-xl text-blue-200 font-medium mb-2">
          Painter Rewards & Management System
        </p>
        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
          Single Paint Shop · 2 Roles (Admin & Painter) · Next.js Frontend · Express REST API
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
          {[
            { label: 'Scope', status: 'Single Shop' },
            { label: 'Roles', status: 'Admin & Painter' },
            { label: 'Super Admin', status: 'Removed' },
            { label: 'Frontend Routing', status: '/login, /admin, /painter' },
            { label: 'Backend Models (11)', status: 'Compiled' },
            { label: 'Frontend & Backend', status: 'Fully Separated' },
          ].map(({ label, status }) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10"
            >
              <span className="text-slate-300 text-sm">{label}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                {status}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
        >
          Go to Login (Placeholder)
        </Link>
      </div>
    </main>
  );
}
