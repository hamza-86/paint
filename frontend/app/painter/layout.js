import PainterNavbar from '@/components/painter/PainterNavbar';

export const metadata = {
  title: 'Painter Portal | Paint Shop Platform',
  description: 'View your points, sales history, reward tiers, and physical rewards.',
};

export default function PainterLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <PainterNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Paint Shop Painter Reward Platform — Read-Only Painter Portal
      </footer>
    </div>
  );
}
