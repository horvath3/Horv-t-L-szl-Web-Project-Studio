import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Shield, Clock, HelpCircle, Gauge } from 'lucide-react';
import { ProjectRequestForm } from '../components/forms/ProjectRequestForm';
import { CapacityAlertBanner } from '../components/layout/CapacityAlertBanner';
import { capacityService, getModeBadgeInfo } from '../services/capacityService';

export const ProjectRequestPage: React.FC = () => {
  const [capacityState, setCapacityState] = useState(() => capacityService.getEffectiveState());

  useEffect(() => {
    const sync = () => setCapacityState(capacityService.getEffectiveState());
    window.addEventListener('store_hl_studio_capacity', sync);
    window.addEventListener('store_hl_studio_requests', sync);
    return () => {
      window.removeEventListener('store_hl_studio_capacity', sync);
      window.removeEventListener('store_hl_studio_requests', sync);
    };
  }, []);

  const modeBadge = getModeBadgeInfo(capacityState.effectiveMode);
  const { effectiveMode, config } = capacityState;

  return (
    <div className="relative min-h-screen pt-14 sm:pt-20 lg:pt-24 pb-20">
      <div className="ambient-glow-indigo top-20 left-1/4" />
      <div className="ambient-glow-purple bottom-20 right-1/4" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Projekt Ajánlatkérés & Egyeztetés</span>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${modeBadge.colorClass}`}
            >
              <span>{modeBadge.emoji}</span>
              <span>Kapacitás: {modeBadge.label}</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Projektet szeretnél?
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
            {effectiveMode === 'paused'
              ? 'Jelenleg a meglévő projektek kidolgozásán dolgozunk, ezért az új projektbeküldés átmenetileg szünetel.'
              : 'Küldd el a projektigényedet! Horvát László személyesen átnézi az elképzelésedet, és e-mailben felveszi veled a kapcsolatot a megvalósítás részleteiről és az ütemezésről.'}
          </p>
        </div>

        {/* Korlátozott mód figyelmeztető banner (4. KORLÁTOZOTT MÓD) */}
        {effectiveMode === 'limited' &&
          config.bannerEnabled &&
          (config.bannerPlacement === 'request-page' || config.bannerPlacement === 'both') && (
            <div className="mb-10">
              <CapacityAlertBanner variant="inline-card" />
            </div>
          )}

        {/* Benefits bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-3 text-xs text-slate-300">
            <div
              className={`p-2 rounded-xl ${
                effectiveMode === 'limited'
                  ? 'bg-amber-500/10 text-amber-400'
                  : effectiveMode === 'paused'
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-indigo-500/10 text-indigo-400'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <span>
              {effectiveMode === 'limited'
                ? `Visszajelzés: ${config.estimatedResponseTimeText || '48–96 órán belül'}`
                : effectiveMode === 'paused'
                ? 'Új beküldés jelenleg szünetel'
                : 'Gyors visszajelzés (24–48 órán belül)'}
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-3 text-xs text-slate-300">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <span>Bizalmas adatkezelés & garancia</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-3 text-xs text-slate-300">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              {effectiveMode === 'normal' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Gauge className="w-4 h-4" />
              )}
            </div>
            <span>
              {effectiveMode === 'limited'
                ? config.useCategorySpecificLimits
                  ? 'Kategória-alapú projektlimit aktív'
                  : `Projektlimit: 1 projekt / ${
                      config.limitPreset === 'custom' ? config.customLimitDays : config.limitPreset
                    } nap`
                : 'Nincs rejtett költség vagy elköteleződés'}
            </span>
          </div>
        </div>

        {/* The Form (or Paused / Limit Blocked View) */}
        <div className="mb-16">
          <ProjectRequestForm />
        </div>

        {/* Mini FAQ */}
        <div className="glass-panel rounded-3xl p-8 border border-white/8 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold font-display text-white">Gyakran ismételt kérdések</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300 pt-2">
            <div>
              <span className="font-semibold text-white block mb-1">Mi történik az űrlap elküldése után?</span>
              <p className="text-slate-400 leading-relaxed">
                Átolvasom az elküldött igényt, megvizsgálom a technológiai lehetőségeket, és e-mailben válaszolok egy első összefoglalóval és javaslattal.
              </p>
            </div>
            <div>
              <span className="font-semibold text-white block mb-1">Miért lehet korlátozott vagy szüneteltetett a projektfogadás?</span>
              <p className="text-slate-400 leading-relaxed">
                Minden projektet személyesen és magas minőségben dolgozok ki. Ha egyszerre több megbízás fut, a kapacitásvédelem biztosítja, hogy a meglévő ügyfelek projektjei időben és kompromisszumok nélkül készüljenek el.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
