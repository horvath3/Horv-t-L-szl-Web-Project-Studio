import React from 'react';
import { LiveStreamPlayer } from '../components/stream/LiveStreamPlayer';
import { Radio, Sparkles, CheckCircle2, Shield, Eye, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LiveWorkPage: React.FC = () => {
  return (
    <div className="relative min-h-screen pt-14 sm:pt-20 lg:pt-24 pb-20">
      <div className="ambient-glow-indigo top-20 right-10" />
      <div className="ambient-glow-purple bottom-20 left-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Élő Stúdió Munka · Valós Idejű Megosztás
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Min Dolgozom Éppen?
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
            Nézz be közvetlenül a stúdióba! Itt valós időben követheted a kiválasztott fejlesztési ablakot, a legfrissebb kódolást, felhasználói felület tervezést és funkcióteszteket.
          </p>
        </div>

        {/* Live Stream Main Player */}
        <LiveStreamPlayer variant="full" />

        {/* Studio Transparency & Trust Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
          <div className="glass-panel rounded-3xl p-6 border border-white/8 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">
              100% Átláthatóság
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Az ügyfeleim bármikor betekintést nyerhetnek abba, hogyan épül fel a szoftverük, lépésről lépésre, modern architektúrákkal.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/8 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">
              Valós Kódolás & Tervezés
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Csak a dedikált munkaablak (VS Code, Figma, Blender) közvetítése látható, felesleges asztali sallangok és zavaró tényezők nélkül.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/8 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">
              Saját Projekt Megvalósítás
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tetszik a tempó és a látvány? Pár kattintással elküldheted az ajánlatkérésedet, és a te ötleted valósul meg következőként!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
