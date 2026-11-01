import React, { useState, useEffect } from 'react';
import { Coffee, Utensils, Clock, Sparkles } from 'lucide-react';
import { StreamOverlayConfig } from '../../services/liveStreamService';

interface LiveStreamOverlayProps {
  overlay?: StreamOverlayConfig | null;
  isPreview?: boolean;
}

export const LiveStreamOverlay: React.FC<LiveStreamOverlayProps> = ({ overlay, isPreview = false }) => {
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  useEffect(() => {
    if (!overlay || !overlay.enabled || overlay.mode !== 'break') {
      setRemainingSec(null);
      return;
    }

    if (overlay.timerType === 'countdown' && overlay.targetTimestamp) {
      const calcRemaining = () => {
        const ms = overlay.targetTimestamp! - Date.now();
        return Math.max(0, Math.ceil(ms / 1000));
      };

      setRemainingSec(calcRemaining());
      const interval = setInterval(() => {
        setRemainingSec(calcRemaining());
      }, 500);

      return () => clearInterval(interval);
    } else {
      setRemainingSec(null);
    }
  }, [overlay?.enabled, overlay?.mode, overlay?.timerType, overlay?.targetTimestamp]);

  if (!overlay || !overlay.enabled) {
    return null;
  }

  const size = overlay.size || 'md';

  // Format remaining seconds into MM:SS or HH:MM:SS
  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 1. BREAK / LUNCH BREAK SCREEN (Full Video Cover Overlay)
  if (overlay.mode === 'break') {
    const isLunch = overlay.badgeText?.toLowerCase().includes('ebéd') || overlay.title?.toLowerCase().includes('ebéd');

    const breakCardSizeClasses = {
      sm: 'max-w-sm p-4 sm:p-5 space-y-2.5',
      md: 'max-w-md p-6 sm:p-7 space-y-3.5',
      lg: 'max-w-lg p-7 sm:p-9 space-y-4',
      xl: 'max-w-xl p-8 sm:p-10 space-y-5'
    }[size];

    const breakTitleClasses = {
      sm: 'text-base sm:text-lg',
      md: 'text-xl sm:text-2xl',
      lg: 'text-2xl sm:text-3xl',
      xl: 'text-3xl sm:text-4xl'
    }[size];

    const breakTimerDigitsClasses = {
      sm: 'text-2xl sm:text-3xl',
      md: 'text-3xl sm:text-4xl',
      lg: 'text-4xl sm:text-5xl',
      xl: 'text-5xl sm:text-6xl'
    }[size];

    return (
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn transition-all select-none ${
          isPreview ? 'scale-90 origin-center' : ''
        }`}
      >
        {/* Soft background ambient gradient */}
        <div className="absolute inset-0 bg-radial from-indigo-950/40 via-black/80 to-black/95 pointer-events-none" />

        <div className={`relative z-10 w-full rounded-3xl bg-slate-900/90 border border-white/15 shadow-2xl text-center overflow-hidden backdrop-blur-xl ${breakCardSizeClasses}`}>
          {/* Subtle top light flare */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/20 blur-2xl rounded-full pointer-events-none" />

          {/* Icon badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-lg">
            {isLunch ? (
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{overlay.badgeText || (isLunch ? 'Ebédszünet' : 'Rövid szünet')}</span>
          </div>

          {/* Main Title */}
          <h2 className={`font-bold font-display text-white tracking-tight ${breakTitleClasses}`}>
            {overlay.title || (isLunch ? 'Jelenleg ebédszüneten vagyok' : 'Közvetítés szüneteltetve')}
          </h2>

          {/* Subtitle / Note */}
          {overlay.subtitle && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
              {overlay.subtitle}
            </p>
          )}

          {/* Timer Display */}
          {overlay.timerType === 'countdown' && remainingSec !== null && (
            <div className="pt-1 pb-1">
              <div className="p-3 sm:p-4 rounded-2xl bg-black/60 border border-white/10 shadow-inner inline-block min-w-[180px]">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Hátralévő idő</span>
                </div>
                {remainingSec > 0 ? (
                  <div className={`font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-indigo-300 tracking-wider ${breakTimerDigitsClasses}`}>
                    {formatCountdown(remainingSec)}
                  </div>
                ) : (
                  <div className="text-sm font-bold text-emerald-400 animate-pulse">
                    A közvetítés mindjárt folytatódik...
                  </div>
                )}
              </div>
            </div>
          )}

          {overlay.timerType === 'target-time' && overlay.targetTimeDisplay && (
            <div className="pt-1 pb-1">
              <div className="px-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 inline-flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300">Várható visszatérés:</span>
                <span className="text-sm sm:text-base font-bold font-mono text-amber-300">{overlay.targetTimeDisplay}</span>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Ne zárd be az oldalt, a közvetítés automatikusan folytatódik!</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. HUD OVERLAY (Floating Non-intrusive Glassmorphism Banner)
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-bar': 'bottom-0 left-0 right-0 w-full rounded-none border-x-0 border-b-0'
  }[overlay.position || 'bottom-left'];

  const isBottomBar = overlay.position === 'bottom-bar';

  const hudCardSizeClasses = {
    sm: 'p-2 sm:p-2.5 max-w-[240px]',
    md: 'p-3 sm:p-4 max-w-xs sm:max-w-sm',
    lg: 'p-4 sm:p-5 max-w-sm sm:max-w-md',
    xl: 'p-5 sm:p-6 max-w-md sm:max-w-lg'
  }[size];

  const hudTitleClasses = {
    sm: 'text-xs',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm sm:text-base',
    xl: 'text-base sm:text-lg'
  }[size];

  const hudBadgeClasses = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-xs'
  }[size];

  return (
    <div
      className={`absolute z-20 pointer-events-none animate-fadeIn ${positionClasses} ${
        isPreview ? 'scale-90 origin-bottom-left' : ''
      }`}
    >
      <div
        className={`pointer-events-auto backdrop-blur-md bg-black/85 border border-white/15 text-white shadow-2xl transition-all ${
          isBottomBar
            ? 'px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between gap-4'
            : `rounded-2xl ${hudCardSizeClasses}`
        }`}
      >
        <div className="space-y-1">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className={`font-bold uppercase tracking-wider text-indigo-300 ${hudBadgeClasses}`}>
              {overlay.badgeText || 'Élő Munka Fókusz'}
            </span>
          </div>

          {/* Title */}
          {overlay.title && (
            <h4 className={`font-bold text-white leading-snug font-display ${hudTitleClasses}`}>
              {overlay.title}
            </h4>
          )}

          {/* Subtitle */}
          {overlay.subtitle && !isBottomBar && (
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              {overlay.subtitle}
            </p>
          )}
        </div>

        {isBottomBar && overlay.subtitle && (
          <span className="hidden sm:inline text-xs text-slate-300 truncate max-w-md">
            {overlay.subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
