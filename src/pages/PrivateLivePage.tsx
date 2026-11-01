import React, { useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { LiveStreamPlayer } from '../components/stream/LiveStreamPlayer';
import { ArrowLeft, ExternalLink, ShieldCheck, Radio, Sparkles } from 'lucide-react';

export const PrivateLivePage: React.FC = () => {
  const { key: routeKey } = useParams<{ key?: string }>();
  const [searchParams] = useSearchParams();
  const key = routeKey || searchParams.get('key') || '';

  useEffect(() => {
    document.title = 'Élő Közvetítés · Horvát László Web & Project Studio';
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Subtle background ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-10 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Minimalist Provenance Header */}
      <header className="relative z-10 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Left: Origin Identity Branding */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            title="Ugrás a portfólió főoldalára"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-bold font-display text-sm shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              HL
            </div>
            <div>
              <span className="text-sm font-bold font-display text-white group-hover:text-indigo-300 transition-colors block leading-tight">
                Horvát László
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                Web & Project Studio
              </span>
            </div>
          </Link>

          <span className="hidden sm:inline text-slate-700">|</span>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-300">
            <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Ideiglenes Privát Közvetítés</span>
          </div>
        </div>

        {/* Right: Direct "Főoldal" Link */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-all transform active:scale-95 shadow-md shadow-black/40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Főoldal</span>
          </Link>
        </div>
      </header>

      {/* Main Focus Zone: Stream Viewer Only */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="w-full">
          <LiveStreamPlayer variant="minimal" streamKey={key} />
        </div>
      </main>

      {/* Minimalist Discreet Footer */}
      <footer className="relative z-10 border-t border-white/5 py-4 px-4 text-center text-xs text-slate-500 bg-black/40">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span>Ez a közvetítés <strong>Horvát László</strong> fejlesztési stúdiójából származik.</span>
          <span className="hidden sm:inline text-slate-700">·</span>
          <Link
            to="/"
            className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
          >
            <span>Főoldal megtekintése</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
};
