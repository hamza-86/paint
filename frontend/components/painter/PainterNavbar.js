'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/auth';
import { usePainterPortalMe } from '@/lib/hooks/usePainterPortal';

const navLinks = [
  { href: '/painter', label: 'Dashboard', icon: '🏠' },
  { href: '/painter/points', label: 'My Points', icon: '⭐' },
  { href: '/painter/sales', label: 'Sales History', icon: '📋' },
  { href: '/painter/rewards', label: 'Rewards Received', icon: '🎁' },
  { href: '/painter/profile', label: 'My Profile', icon: '👤' },
];

export default function PainterNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: meData } = usePainterPortalMe();
  const painter = meData?.data;

  const handleLogout = async () => {
    await logoutUser(router);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Identifier */}
          <div className="flex items-center gap-3">
            <Link href="/painter" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                🎨
              </div>
              <div>
                <div className="font-bold text-base tracking-tight leading-tight flex items-center gap-2">
                  <span>Paint Shop</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                    Painter Portal
                  </span>
                </div>
                <p className="text-xs text-slate-400">Reward & Points Tracker</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/painter'
                  ? pathname === '/painter'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Profile Chip & Logout */}
          <div className="flex items-center gap-3">
            {painter && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 text-xs">
                {painter.photoUrl ? (
                  <img
                    src={painter.photoUrl}
                    alt={painter.firstName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {painter.firstName?.[0] || 'P'}
                  </div>
                )}
                <span className="font-medium text-slate-200">
                  {painter.firstName}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 transition-colors"
              title="Sign Out"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 px-2 py-2">
        {navLinks.map((link) => {
          const isActive =
            link.href === '/painter'
              ? pathname === '/painter'
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-indigo-400 bg-slate-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span className="truncate max-w-[64px]">{link.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
