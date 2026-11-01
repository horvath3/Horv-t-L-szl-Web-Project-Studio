import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center text-center px-4 relative">
      <div className="ambient-glow-indigo top-20 left-1/3" />
      <div className="glass-panel rounded-3xl p-12 max-w-lg border border-white/10 space-y-6 relative z-10 shadow-2xl">
        <span className="font-mono text-7xl font-extrabold text-indigo-500/80 block">
          404
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-display text-white">
            Az oldal nem található
          </h1>
          <p className="text-sm text-slate-400">
            A keresett oldal nem létezik, át lett helyezve vagy a megadott hivatkozás pontatlan.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Főoldal</span>
          </Link>
          <Link
            to="/projektek"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Projektek</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
