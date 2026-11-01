import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Download as DownloadIcon,
  X,
  HardDrive,
  Monitor,
  ShieldCheck,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import {
  Download as DownloadType,
  Project,
  DownloadFlowConfig,
  DownloadAccentTheme,
  DownloadSpinnerStyle,
  DownloadCheckmarkStyle
} from '../../types';
import { downloadFlowService, downloadService } from '../../services/storage';

interface DownloadProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  download: DownloadType;
  project?: Project | null;
  overrideConfig?: DownloadFlowConfig;
  isPreviewMode?: boolean;
  onDownloadComplete?: () => void;
}

const THEME_STYLES: Record<
  DownloadAccentTheme,
  {
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    barGradient: string;
    activeStepBg: string;
    activeStepBorder: string;
    spinnerStroke: string;
    glowClass: string;
    buttonGradient: string;
  }
> = {
  indigo: {
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/30',
    barGradient: 'from-indigo-600 via-purple-500 to-cyan-400',
    activeStepBg: 'bg-indigo-950/45',
    activeStepBorder: 'border-indigo-500/50',
    spinnerStroke: '#818cf8',
    glowClass: 'shadow-indigo-500/25',
    buttonGradient: 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
  },
  emerald: {
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
    barGradient: 'from-emerald-600 via-teal-500 to-cyan-400',
    activeStepBg: 'bg-emerald-950/40',
    activeStepBorder: 'border-emerald-500/50',
    spinnerStroke: '#34d399',
    glowClass: 'shadow-emerald-500/25',
    buttonGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
  },
  cyan: {
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/30',
    barGradient: 'from-cyan-500 via-sky-500 to-indigo-500',
    activeStepBg: 'bg-cyan-950/40',
    activeStepBorder: 'border-cyan-400/50',
    spinnerStroke: '#22d3ee',
    glowClass: 'shadow-cyan-500/25',
    buttonGradient: 'from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500'
  },
  purple: {
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/30',
    barGradient: 'from-purple-600 via-fuchsia-500 to-indigo-400',
    activeStepBg: 'bg-purple-950/45',
    activeStepBorder: 'border-purple-500/50',
    spinnerStroke: '#c084fc',
    glowClass: 'shadow-purple-500/25',
    buttonGradient: 'from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500'
  },
  amber: {
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30',
    barGradient: 'from-amber-500 via-orange-500 to-yellow-400',
    activeStepBg: 'bg-amber-950/40',
    activeStepBorder: 'border-amber-500/50',
    spinnerStroke: '#fbbf24',
    glowClass: 'shadow-amber-500/25',
    buttonGradient: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
  },
  rose: {
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/30',
    barGradient: 'from-rose-600 via-pink-500 to-purple-500',
    activeStepBg: 'bg-rose-950/40',
    activeStepBorder: 'border-rose-500/50',
    spinnerStroke: '#fb7185',
    glowClass: 'shadow-rose-500/25',
    buttonGradient: 'from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500'
  }
};

export const StepSpinnerIcon: React.FC<{
  styleType: DownloadSpinnerStyle;
  strokeColor: string;
  size?: number;
}> = ({ styleType, strokeColor, size = 22 }) => {
  if (styleType === 'dual-ring') {
    return (
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg className="w-full h-full animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="9.5"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2.5"
          />
          <path
            d="M12 2.5A9.5 9.5 0 0 1 21.5 12"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M12 21.5A9.5 9.5 0 0 1 2.5 12"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
        <span
          className="absolute w-1.5 h-1.5 rounded-full animate-ping"
          style={{ backgroundColor: strokeColor }}
        />
      </div>
    );
  }

  if (styleType === 'orbit') {
    return (
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg className="w-full h-full animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx="12" cy="3" r="2.5" fill={strokeColor} />
        </svg>
      </div>
    );
  }

  if (styleType === 'dots') {
    return (
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg className="w-full h-full animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="3.5" r="2" fill={strokeColor} />
          <circle cx="18.5" cy="6.5" r="1.8" fill={strokeColor} opacity="0.8" />
          <circle cx="20.5" cy="12" r="1.6" fill={strokeColor} opacity="0.6" />
          <circle cx="18.5" cy="17.5" r="1.4" fill={strokeColor} opacity="0.4" />
          <circle cx="12" cy="20.5" r="1.2" fill={strokeColor} opacity="0.25" />
          <circle cx="5.5" cy="17.5" r="1" fill={strokeColor} opacity="0.15" />
        </svg>
      </div>
    );
  }

  // Default 'ring'
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.5" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
        <path
          d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
          stroke={strokeColor}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export const AnimatedCheckmarkIcon: React.FC<{
  styleType: DownloadCheckmarkStyle;
  size?: number;
}> = ({ styleType, size = 22 }) => {
  if (styleType === 'shield') {
    return (
      <div
        className="relative flex items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-sm shadow-emerald-500/30 shrink-0 transition-transform duration-300 scale-100"
        style={{ width: size, height: size }}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      </div>
    );
  }

  if (styleType === 'pop') {
    return (
      <div
        className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/40 shrink-0 animate-bounce"
        style={{ width: size, height: size, animationIterationCount: 1, animationDuration: '380ms' }}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // Default 'draw' stroke animation
  return (
    <div
      className="relative flex items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/60 shadow-md shadow-emerald-500/25 shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none">
        <path
          d="M4.5 12.75l6 6 9-13.5"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 28,
            strokeDashoffset: 0,
            animation: 'hlCheckDraw 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        />
      </svg>
    </div>
  );
};

export const DownloadProcessModal: React.FC<DownloadProcessModalProps> = ({
  isOpen,
  onClose,
  download,
  project,
  overrideConfig,
  isPreviewMode = false,
  onDownloadComplete
}) => {
  const config = useMemo(
    () => overrideConfig || downloadFlowService.resolveConfig(download, project),
    [overrideConfig, download, project]
  );

  const steps = useMemo(
    () => (config.steps && config.steps.length > 0 ? config.steps : []),
    [config.steps]
  );

  // Calculate exact ms duration for each step based on timingMode
  const stepDurationsMs = useMemo(() => {
    if (steps.length === 0) return [1000];
    if (config.timingMode === 'per-step') {
      return steps.map((s) => Math.max(150, Number(s.durationMs) || 550));
    }
    // 'total' mode: distribute totalDurationSeconds across all steps proportionally to their durationMs weights
    const totalTargetMs = Math.max(1000, (Number(config.totalDurationSeconds) || 6) * 1000);
    const totalWeight = steps.reduce((acc, s) => acc + Math.max(100, Number(s.durationMs) || 500), 0);
    return steps.map((s) => {
      const weight = Math.max(100, Number(s.durationMs) || 500);
      return Math.max(150, Math.round((weight / totalWeight) * totalTargetMs));
    });
  }, [steps, config.timingMode, config.totalDurationSeconds]);

  const totalDurationMs = useMemo(
    () => stepDurationsMs.reduce((acc, d) => acc + d, 0),
    [stepDurationsMs]
  );

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [runKey, setRunKey] = useState<number>(0);

  const stepListRef = useRef<HTMLDivElement>(null);
  const activeStepItemRef = useRef<HTMLDivElement>(null);
  const hasTriggeredFileRef = useRef<boolean>(false);

  const triggerActualFileDownload = () => {
    if (isPreviewMode) return;
    downloadService.incrementCount(download.id);
    if (onDownloadComplete) {
      onDownloadComplete();
    }

    if (download.fileUrl && download.fileUrl.trim()) {
      const link = document.createElement('a');
      link.href = download.fileUrl;
      link.download = download.fileName || 'download';
      if (download.fileUrl.startsWith('http')) {
        link.target = '_blank';
        link.rel = 'noreferrer';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setCurrentStepIndex(0);
    setElapsedMs(0);
    setIsCompleted(false);
    hasTriggeredFileRef.current = false;

    const startTime = performance.now();
    // Cumulative thresholds for each step
    const cumulativeThresholds: number[] = [];
    let acc = 0;
    for (const d of stepDurationsMs) {
      acc += d;
      cumulativeThresholds.push(acc);
    }

    const interval = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - startTime;

      if (elapsed >= totalDurationMs) {
        setElapsedMs(totalDurationMs);
        setCurrentStepIndex(steps.length);
        setIsCompleted(true);
        window.clearInterval(interval);

        if (!hasTriggeredFileRef.current && config.autoStartDownload) {
          hasTriggeredFileRef.current = true;
          triggerActualFileDownload();
        }
        return;
      }

      setElapsedMs(elapsed);
      const nextStepIdx = cumulativeThresholds.findIndex((threshold) => elapsed < threshold);
      setCurrentStepIndex(nextStepIdx === -1 ? steps.length - 1 : nextStepIdx);
    }, 35);

    return () => window.clearInterval(interval);
  }, [isOpen, runKey, totalDurationMs, stepDurationsMs, steps.length]);

  // Auto-scroll step list so active step stays in view
  useEffect(() => {
    if (activeStepItemRef.current && stepListRef.current) {
      activeStepItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentStepIndex]);

  // Optional auto-close after completion
  useEffect(() => {
    if (!isOpen || !isCompleted || !config.autoCloseAfterSeconds || config.autoCloseAfterSeconds <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      onClose();
    }, config.autoCloseAfterSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [isOpen, isCompleted, config.autoCloseAfterSeconds, onClose]);

  if (!isOpen) return null;

  const theme = THEME_STYLES[config.accentTheme || 'indigo'] || THEME_STYLES.indigo;
  const overallPercent = Math.min(
    100,
    isCompleted ? 100 : Math.round((elapsedMs / Math.max(1, totalDurationMs)) * 100)
  );

  // Calculate current step's internal progress (0..100)
  let previousStepsCumulativeMs = 0;
  for (let i = 0; i < currentStepIndex; i++) {
    previousStepsCumulativeMs += stepDurationsMs[i] || 0;
  }
  const activeStepDuration = stepDurationsMs[currentStepIndex] || 500;
  const activeStepProgress = isCompleted
    ? 100
    : Math.min(
        100,
        Math.max(0, Math.round(((elapsedMs - previousStepsCumulativeMs) / activeStepDuration) * 100))
      );

  const activeStepObj = !isCompleted ? steps[currentStepIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <style>{`
        @keyframes hlCheckDraw {
          0% { stroke-dashoffset: 28; opacity: 0.3; transform: scale(0.8); }
          70% { transform: scale(1.08); }
          100% { stroke-dashoffset: 0; opacity: 1; transform: scale(1); }
        }
        @keyframes hlStripeMove {
          0% { background-position: 0 0; }
          100% { background-position: 28px 0; }
        }
      `}</style>

      <div className="glass-panel rounded-3xl border border-white/15 w-full max-w-2xl my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh] relative">
        {/* Top Ambient Accent Bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${theme.barGradient}`} />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Horvát László Studio • Release</span>
              </span>
              {isPreviewMode && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Előnézeti Teszt Mód
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold font-display text-white pt-1">
              {isCompleted ? config.completionTitle : config.modalTitle}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isCompleted ? config.completionSubtitle : config.modalSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* File Metadata Card */}
          {config.showFileInfoCard && (
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                >
                  <DownloadIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">
                    {download.projectTitle}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 block truncate">
                    {download.fileName}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-indigo-400" />
                  <span>{download.platform}</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-mono">
                  v{download.version}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1 font-mono">
                  <HardDrive className="w-3 h-3 text-emerald-400" />
                  <span>{download.fileSize}</span>
                </span>
              </div>
            </div>
          )}

          {/* ================= OVERALL STATUS LINE (STÁTUSZVONAL) ================= */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {!isCompleted ? (
                  <StepSpinnerIcon
                    styleType={config.spinnerStyle}
                    strokeColor={theme.spinnerStroke}
                    size={20}
                  />
                ) : (
                  <AnimatedCheckmarkIcon styleType={config.checkmarkStyle} size={20} />
                )}
                <span className="font-bold text-white truncate">
                  {isCompleted
                    ? config.completionTitle
                    : activeStepObj?.label || 'Folyamat végrehajtása...'}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                {config.showElapsedTimer && (
                  <span className="text-slate-400 text-[11px]">
                    {(elapsedMs / 1000).toFixed(1)}s / {(totalDurationMs / 1000).toFixed(1)}s
                  </span>
                )}
                {config.showPercentage && (
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`
                    }`}
                  >
                    {overallPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar Track */}
            {config.progressBarStyle === 'segmented' ? (
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.max(1, steps.length)}, minmax(0, 1fr))` }}>
                {steps.map((st, idx) => {
                  const isStepDone = isCompleted || idx < currentStepIndex;
                  const isStepCurrent = !isCompleted && idx === currentStepIndex;
                  return (
                    <div
                      key={st.id || idx}
                      className="h-2.5 rounded-full bg-white/10 overflow-hidden relative"
                    >
                      <div
                        className={`h-full transition-all duration-150 ${
                          isStepDone
                            ? 'bg-emerald-400 w-full'
                            : isStepCurrent
                            ? `bg-gradient-to-r ${theme.barGradient}`
                            : 'w-0'
                        }`}
                        style={isStepCurrent ? { width: `${activeStepProgress}%` } : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isCompleted
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                      : `bg-gradient-to-r ${theme.barGradient}`
                  }`}
                  style={{
                    width: `${overallPercent}%`,
                    ...(config.progressBarStyle === 'striped'
                      ? {
                          backgroundImage:
                            'linear-gradient(45deg, rgba(255,255,255,0.18) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.18) 75%, transparent 75%, transparent)',
                          backgroundSize: '28px 28px',
                          animation: 'hlStripeMove 0.8s linear infinite'
                        }
                      : {})
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Teljesített feladatok:{' '}
                <strong className="text-white font-mono">
                  {Math.min(steps.length, currentStepIndex)} / {steps.length}
                </strong>
              </span>
              <span>
                {isCompleted ? (
                  <span className="text-emerald-400 font-semibold">✓ Minden feladat sikeresen lefutott</span>
                ) : (
                  <span>Aktuális lépés: {activeStepProgress}%</span>
                )}
              </span>
            </div>
          </div>

          {/* ================= 10 SEQUENTIAL TASKS LIST ================= */}
          <div
            ref={stepListRef}
            className="space-y-2 max-h-[300px] overflow-y-auto pr-1"
          >
            {steps.map((step, idx) => {
              const isDone = isCompleted || idx < currentStepIndex;
              const isCurrent = !isCompleted && idx === currentStepIndex;
              const stepNum = String(idx + 1).padStart(2, '0');

              return (
                <div
                  key={step.id || idx}
                  ref={isCurrent ? activeStepItemRef : undefined}
                  className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                      : isCurrent
                      ? `${theme.activeStepBg} ${theme.activeStepBorder} text-white shadow-lg ${theme.glowClass}`
                      : 'bg-black/30 border-white/5 text-slate-500 opacity-65'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Left Status Icon: Spinner while active, Animated Checkmark when done, Circle when waiting */}
                    {isDone ? (
                      <AnimatedCheckmarkIcon styleType={config.checkmarkStyle} size={24} />
                    ) : isCurrent ? (
                      <StepSpinnerIcon
                        styleType={config.spinnerStyle}
                        strokeColor={theme.spinnerStroke}
                        size={24}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-white/15 bg-black/40 flex items-center justify-center text-[10px] font-mono text-slate-500 shrink-0">
                        {stepNum}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {config.showStepNumbers && (
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                              isDone
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : isCurrent
                                ? `${theme.badgeBg} ${theme.badgeText}`
                                : 'bg-white/5 text-slate-500'
                            }`}
                          >
                            #{stepNum}
                          </span>
                        )}
                        <span
                          className={`text-xs sm:text-sm truncate ${
                            isDone
                              ? 'font-semibold text-emerald-100'
                              : isCurrent
                              ? 'font-bold text-white'
                              : 'font-medium text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>

                      {config.showSubtexts && step.subtext && (
                        <span
                          className={`text-[11px] block truncate mt-0.5 ${
                            isDone
                              ? 'text-emerald-300/70'
                              : isCurrent
                              ? 'text-slate-300'
                              : 'text-slate-600'
                          }`}
                        >
                          {step.subtext}
                        </span>
                      )}

                      {isCurrent && (
                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mt-2">
                          <div
                            className={`h-full bg-gradient-to-r ${theme.barGradient} transition-all duration-75`}
                            style={{ width: `${activeStepProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Status Pill */}
                  <div className="shrink-0">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <span>✓</span>
                        <span>{step.doneBadgeText || 'Kész'}</span>
                      </span>
                    ) : isCurrent ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                      >
                        <span>{activeStepProgress}%</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-600 px-2 py-0.5">
                        Várakozik
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isCompleted && (
              <button
                type="button"
                onClick={() => setRunKey((k) => k + 1)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Folyamat újrafuttatása"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ellenőrzés újrafuttatása</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isCompleted && (
              <button
                type="button"
                onClick={triggerActualFileDownload}
                className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.buttonGradient} text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer`}
              >
                <DownloadIcon className="w-4 h-4" />
                <span>{config.manualDownloadButtonText || 'Közvetlen letöltés indítása'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              {config.closeButtonText || 'Bezárás'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
