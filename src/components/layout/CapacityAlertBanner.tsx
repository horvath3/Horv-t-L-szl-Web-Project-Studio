import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, X, ArrowRight, Plane, ShieldAlert } from 'lucide-react';
import {
  capacityService,
  EffectiveCapacityState,
  formatCapacityDateDot
} from '../../services/capacityService';
import { CapacityBannerTheme } from '../../types';

interface CapacityAlertBannerProps {
  variant?: 'top-bar' | 'inline-card';
}

const THEME_STYLES: Record<
  CapacityBannerTheme,
  {
    topBar: string;
    card: string;
    iconBox: string;
    title: string;
    badge: string;
    button: string;
  }
> = {
  amber: {
    topBar:
      'bg-gradient-to-r from-amber-950/95 via-yellow-950/90 to-amber-950/95 border-b border-amber-500/35 text-amber-100',
    card: 'bg-gradient-to-br from-amber-950/55 via-slate-900/90 to-amber-950/40 border-amber-500/40 text-amber-100 shadow-amber-950/30',
    iconBox: 'bg-amber-500/20 border-amber-500/35 text-amber-300',
    title: 'text-amber-200',
    badge: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
    button: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
  },
  indigo: {
    topBar:
      'bg-gradient-to-r from-indigo-950/95 via-slate-950/95 to-indigo-950/95 border-b border-indigo-500/35 text-indigo-100',
    card: 'bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-indigo-950/40 border-indigo-500/40 text-indigo-100 shadow-indigo-950/30',
    iconBox: 'bg-indigo-500/20 border-indigo-500/35 text-indigo-300',
    title: 'text-indigo-200',
    badge: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
    button: 'bg-indigo-500 hover:bg-indigo-400 text-white font-bold'
  },
  rose: {
    topBar:
      'bg-gradient-to-r from-rose-950/95 via-red-950/90 to-rose-950/95 border-b border-rose-500/35 text-rose-100',
    card: 'bg-gradient-to-br from-rose-950/60 via-slate-900/90 to-rose-950/40 border-rose-500/40 text-rose-100 shadow-rose-950/30',
    iconBox: 'bg-rose-500/20 border-rose-500/35 text-rose-300',
    title: 'text-rose-200',
    badge: 'bg-rose-500/20 text-rose-200 border-rose-500/30',
    button: 'bg-rose-500 hover:bg-rose-400 text-white font-bold'
  },
  purple: {
    topBar:
      'bg-gradient-to-r from-purple-950/95 via-fuchsia-950/90 to-purple-950/95 border-b border-purple-500/35 text-purple-100',
    card: 'bg-gradient-to-br from-purple-950/60 via-slate-900/90 to-purple-950/40 border-purple-500/40 text-purple-100 shadow-purple-950/30',
    iconBox: 'bg-purple-500/20 border-purple-500/35 text-purple-300',
    title: 'text-purple-200',
    badge: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    button: 'bg-purple-500 hover:bg-purple-400 text-white font-bold'
  },
  emerald: {
    topBar:
      'bg-gradient-to-r from-emerald-950/95 via-teal-950/90 to-emerald-950/95 border-b border-emerald-500/35 text-emerald-100',
    card: 'bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-emerald-950/40 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30',
    iconBox: 'bg-emerald-500/20 border-emerald-500/35 text-emerald-300',
    title: 'text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
    button: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
  },
  cyan: {
    topBar:
      'bg-gradient-to-r from-cyan-950/95 via-sky-950/90 to-cyan-950/95 border-b border-cyan-500/35 text-cyan-100',
    card: 'bg-gradient-to-br from-cyan-950/60 via-slate-900/90 to-cyan-950/40 border-cyan-500/40 text-cyan-100 shadow-cyan-950/30',
    iconBox: 'bg-cyan-500/20 border-cyan-500/35 text-cyan-300',
    title: 'text-cyan-200',
    badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
    button: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
  }
};

export const CapacityAlertBanner: React.FC<CapacityAlertBannerProps> = ({
  variant = 'top-bar'
}) => {
  const [state, setState] = useState<EffectiveCapacityState>(() =>
    capacityService.getEffectiveState()
  );
  const [dismissedTop, setDismissedTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const syncState = () => {
      setState(capacityService.getEffectiveState());
    };
    window.addEventListener('store_hl_studio_capacity', syncState);
    window.addEventListener('store_hl_studio_requests', syncState);
    const interval = setInterval(syncState, 30000);
    return () => {
      window.removeEventListener('store_hl_studio_capacity', syncState);
      window.removeEventListener('store_hl_studio_requests', syncState);
      clearInterval(interval);
    };
  }, []);

  const { effectiveMode, config, isTravelModeEffective, reopenDateFormatted } = state;

  if (effectiveMode === 'normal') {
    return null;
  }

  const isRequestRoute =
    location.pathname.startsWith('/projekt-igeny') ||
    location.pathname.startsWith('/ajanlatkeres');

  // Check placement visibility for top-bar
  if (variant === 'top-bar') {
    if (dismissedTop) return null;
    if (!config.bannerEnabled && effectiveMode === 'limited') return null;
    if (config.bannerPlacement === 'request-page' && !isRequestRoute) {
      return null;
    }
  }

  if (variant === 'inline-card') {
    if (!config.bannerEnabled && effectiveMode === 'limited') return null;
    if (config.bannerPlacement === 'top' && isRequestRoute && effectiveMode === 'limited') {
      // Even if top-only, on inline-card we only render if placement is 'request-page' or 'both'
      return null;
    }
  }

  const themeKey: CapacityBannerTheme =
    effectiveMode === 'paused' ? 'rose' : config.bannerTheme || 'amber';
  const styles = THEME_STYLES[themeKey] || THEME_STYLES.amber;

  const displayIcon =
    effectiveMode === 'paused'
      ? config.pausedIcon || '🚧'
      : isTravelModeEffective
      ? '✈️'
      : config.bannerIcon || '⚠️';

  const displayTitle =
    effectiveMode === 'paused'
      ? config.pausedTitle || 'Projektbeküldés átmenetileg szünetel'
      : isTravelModeEffective
      ? 'Utazás / Szabadság – Korlátozott projektfogadás'
      : config.bannerTitle || 'Megnövekedett projektterhelés';

  const displayText =
    effectiveMode === 'paused'
      ? `${config.pausedSubtitle} ${config.pausedDescription}`
      : isTravelModeEffective && config.travelCustomNote
      ? config.travelCustomNote
      : config.bannerText;

  if (variant === 'top-bar') {
    return (
      <div
        role="status"
        aria-label="Projektkapacitás tájékoztató"
        className={`relative z-50 transition-all ${styles.topBar}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 text-center sm:text-left min-w-0">
              <span
                className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 text-base ${styles.iconBox}`}
              >
                {displayIcon}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className={`font-bold font-display uppercase tracking-wider ${styles.title}`}>
                    {displayTitle}
                  </span>
                  {effectiveMode === 'limited' && (
                    <span className="text-[11px] opacity-90">
                      · 🟡 Korlátozott mód
                    </span>
                  )}
                  {effectiveMode === 'paused' && (
                    <span className="text-[11px] opacity-90">
                      · 🔴 {state.effectiveReasonBadge}
                    </span>
                  )}
                  {reopenDateFormatted && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono opacity-95">
                      <Clock className="w-3 h-3" />
                      <span>Várható normál üzemmód: {reopenDateFormatted}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-200/90 line-clamp-1">
                  {displayText.replace(/\n+/g, ' ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isRequestRoute && (
                <Link
                  to="/projekt-igeny"
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] uppercase tracking-wider transition-all ${styles.button}`}
                >
                  <span>Részletek</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setDismissedTop(true)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Sáv elrejtése"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline card variant (used on ProjectRequestPage / StatusPage)
  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden ${styles.card}`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-13 h-13 rounded-2xl border flex items-center justify-center text-2xl shrink-0 shadow-lg ${styles.iconBox}`}
          >
            {displayIcon}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`font-bold uppercase tracking-wider ${styles.title}`}>
                {effectiveMode === 'limited' ? '🟡 Korlátozott projektfogadási mód' : '🔴 Szüneteltetett projektfogadás'}
              </span>
              {isTravelModeEffective && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="inline-flex items-center gap-1 text-sky-300 font-medium">
                    <Plane className="w-3.5 h-3.5" />
                    <span>Utazási mód aktív</span>
                  </span>
                </>
              )}
              {reopenDateFormatted && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="font-mono text-white/90">
                    Normál mód: {reopenDateFormatted}
                  </span>
                </>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold font-display text-white">
              {displayIcon} {displayTitle}
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line max-w-3xl">
              {displayText}
            </p>

            {effectiveMode === 'limited' && config.userLimitEnabled && (
              <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 font-medium text-white">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aktív projektlimit:</span>
                </span>
                {config.useCategorySpecificLimits ? (
                  <>
                    <span>🌐 Weboldal: {config.categoryRules['Weboldal / Webalkalmazás']?.limitDays || 7} nap</span>
                    <span className="text-white/30">·</span>
                    <span>🎮 Játékprojekt: {config.categoryRules['Játékprojekt']?.limitDays || 30} nap</span>
                    <span className="text-white/30">·</span>
                    <span>🤖 AI projekt: {config.categoryRules['AI projekt']?.limitDays || 14} nap</span>
                  </>
                ) : (
                  <span>
                    1 projekt /{' '}
                    {config.limitPreset === 'custom' ? config.customLimitDays : config.limitPreset} nap
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {config.estimatedResponseTimeText && effectiveMode === 'limited' && (
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 shrink-0 text-xs space-y-1 md:text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
              Várható visszajelzés
            </span>
            <span className="font-bold text-white flex items-center md:justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{config.estimatedResponseTimeText}</span>
            </span>
            {isTravelModeEffective && config.travelReturnDate && (
              <span className="text-[11px] text-sky-300 block font-mono">
                Visszatérés: {formatCapacityDateDot(config.travelReturnDate)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
