import React from 'react';
import { LiveStreamBroadcasterCard } from '../../components/stream/LiveStreamBroadcasterCard';
import { LiveStreamPlayer } from '../../components/stream/LiveStreamPlayer';
import { Radio, Monitor, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminLiveStreamPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Stúdió Közvetítő Központ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Élő Képernyő & Ablakmegosztás
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Indíts élő közvetítést bármely futó programodról (VS Code, böngésző, képszerkesztő) anélkül, hogy a teljes képernyődet megosztanád.
          </p>
        </div>

        <Link
          to="/elo-munka"
          target="_blank"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
        >
          <span>Látogatói oldal megnyitása</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Broadcaster Controller Card */}
      <LiveStreamBroadcasterCard />

      {/* Public View Preview */}
      <div className="pt-6 border-t border-white/5 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Látogatói Megjelenés Élő Előnézete
        </h3>
        <p className="text-xs text-slate-400">
          A weboldal látogatói pontosan az alábbi lejátszóban látják a közvetítésedet:
        </p>
        <LiveStreamPlayer />
      </div>
    </div>
  );
};
