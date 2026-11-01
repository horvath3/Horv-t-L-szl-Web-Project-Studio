import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Monitor,
  Square,
  Play,
  Users,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  Sliders,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Globe,
  Zap,
  Coffee,
  Utensils,
  MessageSquare,
  Type,
  Layout
} from 'lucide-react';
import { liveStreamService, LiveStreamStatus, StreamOverlayConfig } from '../../services/liveStreamService';
import { LiveStreamOverlay } from './LiveStreamOverlay';
import { Link } from 'react-router-dom';

export const LiveStreamBroadcasterCard: React.FC = () => {
  const [isLive, setIsLive] = useState(liveStreamService.isLocalBroadcasting());
  const [isStarting, setIsStarting] = useState(false);
  const [title, setTitle] = useState('SmartLogistics Portál frontend fejlesztése');
  const [description, setDescription] = useState('React + TypeScript komponensek kódolása és stílusozása');
  const [isUnlisted, setIsUnlisted] = useState(false);
  const [linkMode, setLinkMode] = useState<'persistent' | 'ephemeral'>(() => liveStreamService.getLinkMode());
  const [persistentKey, setPersistentKey] = useState<string>(() => liveStreamService.getPersistentKey());
  const [keyRegeneratedNotice, setKeyRegeneratedNotice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<LiveStreamStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState('00:00');
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const hasLoadedInitialOverlay = useRef(false);

  // Overlay / HUD / Break Screen State
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [overlayMode, setOverlayMode] = useState<'hud' | 'break'>('hud');
  const [badgeText, setBadgeText] = useState('ÉLŐ MUNKA');
  const [overlayTitle, setOverlayTitle] = useState('SmartLogistics Portál frontend fejlesztése');
  const [overlaySubtitle, setOverlaySubtitle] = useState('React + TypeScript komponensek kódolása és stílusozása');
  const [overlayPosition, setOverlayPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-bar'>('bottom-left');
  const [overlaySize, setOverlaySize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [timerType, setTimerType] = useState<'countdown' | 'target-time' | 'none'>('countdown');
  const [countdownMinutes, setCountdownMinutes] = useState(15);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(() => Date.now() + 15 * 60 * 1000);
  const [targetTimeStr, setTargetTimeStr] = useState('13:30');
  const [isSavingOverlay, setIsSavingOverlay] = useState(false);
  const [overlaySavedNotice, setOverlaySavedNotice] = useState(false);

  // Poll status with admin permissions to read secret keys
  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      const data = await liveStreamService.getStatus({ isAdmin: true });
      if (!mounted) return;
      setStatus(data);
      if (data.isLive) {
        setIsLive(true);
        if (data.isUnlisted !== undefined) {
          setIsUnlisted(Boolean(data.isUnlisted));
        }
      } else if (!liveStreamService.isLocalBroadcasting()) {
        setIsLive(false);
      }

      // ONLY load initial overlay once on mount so polling doesn't overwrite user changes
      if (!hasLoadedInitialOverlay.current && data.overlay) {
        hasLoadedInitialOverlay.current = true;
        setOverlayEnabled(data.overlay.enabled);
        setOverlayMode(data.overlay.mode);
        if (data.overlay.badgeText) setBadgeText(data.overlay.badgeText);
        if (data.overlay.title) setOverlayTitle(data.overlay.title);
        if (data.overlay.subtitle !== undefined) setOverlaySubtitle(data.overlay.subtitle);
        if (data.overlay.position) setOverlayPosition(data.overlay.position);
        if (data.overlay.size) setOverlaySize(data.overlay.size);
        if (data.overlay.timerType) setTimerType(data.overlay.timerType);
        if (data.overlay.targetTimestamp) setTargetTimestamp(data.overlay.targetTimestamp);
        if (data.overlay.targetTimeDisplay) setTargetTimeStr(data.overlay.targetTimeDisplay);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!isLive || !status?.startedAt) {
      setElapsed('00:00');
      return;
    }
    const timer = setInterval(() => {
      const diffSec = Math.max(0, Math.floor((Date.now() - (status.startedAt || Date.now())) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;
      if (hours > 0) {
        setElapsed(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive, status?.startedAt]);

  const handleLinkModeChange = (mode: 'persistent' | 'ephemeral') => {
    setLinkMode(mode);
    liveStreamService.setLinkMode(mode);
  };

  const handleRegenerateKey = () => {
    const nextKey = liveStreamService.generateNewPersistentKey();
    setPersistentKey(nextKey);
    setCopied(false);
    setKeyRegeneratedNotice(true);
    setTimeout(() => setKeyRegeneratedNotice(false), 2500);
  };

  const currentOverlayConfig: StreamOverlayConfig = {
    enabled: overlayEnabled,
    mode: overlayMode,
    badgeText,
    title: overlayTitle,
    subtitle: overlaySubtitle,
    position: overlayPosition,
    size: overlaySize,
    timerType,
    targetTimestamp: timerType === 'countdown' ? (targetTimestamp || undefined) : undefined,
    targetTimeDisplay: timerType === 'target-time' ? targetTimeStr : undefined
  };

  const handleApplyOverlay = async (override?: Partial<StreamOverlayConfig>) => {
    setIsSavingOverlay(true);
    try {
      const isNowEnabled = override?.enabled !== undefined ? override.enabled : overlayEnabled;
      const targetMode = override?.mode || overlayMode;
      const tType = override?.timerType !== undefined ? override.timerType : timerType;
      const curSize = override?.size || overlaySize;
      const curPos = override?.position || overlayPosition;
      const curBadge = override?.badgeText !== undefined ? override.badgeText : badgeText;
      const curTitle = override?.title !== undefined ? override.title : overlayTitle;
      const curSubtitle = override?.subtitle !== undefined ? override.subtitle : overlaySubtitle;
      const curTargetTime = override?.targetTimeDisplay !== undefined ? override.targetTimeDisplay : targetTimeStr;

      let ts = targetTimestamp;
      if (override?.targetTimestamp !== undefined) {
        ts = override.targetTimestamp;
      } else if (tType === 'countdown' && (!ts || ts <= Date.now())) {
        ts = Date.now() + countdownMinutes * 60 * 1000;
        setTargetTimestamp(ts);
      }

      const cfg: StreamOverlayConfig = {
        enabled: isNowEnabled,
        mode: targetMode,
        badgeText: curBadge,
        title: curTitle,
        subtitle: curSubtitle,
        position: curPos,
        size: curSize,
        timerType: tType,
        targetTimestamp: tType === 'countdown' ? (ts || undefined) : undefined,
        targetTimeDisplay: tType === 'target-time' ? curTargetTime : undefined
      };

      await liveStreamService.updateOverlay(isNowEnabled ? cfg : null);
      setOverlaySavedNotice(true);
      setTimeout(() => setOverlaySavedNotice(false), 2500);
    } catch (err: any) {
      console.warn('Overlay update error:', err);
    } finally {
      setIsSavingOverlay(false);
    }
  };

  const handleToggleOverlay = async (nextState: boolean) => {
    setOverlayEnabled(nextState);
    await handleApplyOverlay({ enabled: nextState });
  };

  const handlePositionChange = async (pos: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-bar') => {
    setOverlayPosition(pos);
    if (overlayEnabled) {
      await handleApplyOverlay({ position: pos });
    }
  };

  const handleTimerTypeChange = async (type: 'countdown' | 'target-time' | 'none') => {
    setTimerType(type);
    let ts = targetTimestamp;
    if (type === 'countdown') {
      ts = Date.now() + countdownMinutes * 60 * 1000;
      setTargetTimestamp(ts);
    }
    if (overlayEnabled) {
      await handleApplyOverlay({
        timerType: type,
        targetTimestamp: type === 'countdown' ? ts || undefined : undefined
      });
    }
  };

  const handleSizeChange = async (newSize: 'sm' | 'md' | 'lg' | 'xl') => {
    setOverlaySize(newSize);
    if (overlayEnabled) {
      await handleApplyOverlay({ size: newSize });
    }
  };

  const handleCountdownMinutesChange = async (mins: number) => {
    setCountdownMinutes(mins);
    const newTs = Date.now() + mins * 60 * 1000;
    setTargetTimestamp(newTs);
    if (overlayEnabled && timerType === 'countdown') {
      await handleApplyOverlay({ targetTimestamp: newTs, timerType: 'countdown' });
    }
  };

  const applyPreset = async (preset: 'break-short' | 'break-lunch' | 'hud-focus' | 'hud-contact') => {
    if (preset === 'break-short') {
      const newTs = Date.now() + 5 * 60 * 1000;
      setOverlayEnabled(true);
      setOverlayMode('break');
      setBadgeText('☕ RÖVID SZÜNET');
      setOverlayTitle('Rövid technikai szünet');
      setOverlaySubtitle('Néhány perc és folytatjuk a közvetítést!');
      setTimerType('countdown');
      setCountdownMinutes(5);
      setTargetTimestamp(newTs);
      await handleApplyOverlay({
        enabled: true,
        mode: 'break',
        badgeText: '☕ RÖVID SZÜNET',
        title: 'Rövid technikai szünet',
        subtitle: 'Néhány perc és folytatjuk a közvetítést!',
        timerType: 'countdown',
        targetTimestamp: newTs
      });
    } else if (preset === 'break-lunch') {
      const newTs = Date.now() + 30 * 60 * 1000;
      setOverlayEnabled(true);
      setOverlayMode('break');
      setBadgeText('🍽️ EBÉDSZÜNET');
      setOverlayTitle('Jelenleg ebédszünetet tartok');
      setOverlaySubtitle('Jó étvágyat! Hamarosan folytatódik a fejlesztés.');
      setTimerType('countdown');
      setCountdownMinutes(30);
      setTargetTimestamp(newTs);
      await handleApplyOverlay({
        enabled: true,
        mode: 'break',
        badgeText: '🍽️ EBÉDSZÜNET',
        title: 'Jelenleg ebédszünetet tartok',
        subtitle: 'Jó étvágyat! Hamarosan folytatódik a fejlesztés.',
        timerType: 'countdown',
        targetTimestamp: newTs
      });
    } else if (preset === 'hud-focus') {
      setOverlayEnabled(true);
      setOverlayMode('hud');
      setBadgeText('🔴 ÉLŐ FÓKUSZ');
      setOverlayTitle(title || 'SmartLogistics – Frontend fejlesztés');
      setOverlaySubtitle(description || 'Komponensek és dizájn finomhangolása');
      setOverlayPosition('bottom-left');
      await handleApplyOverlay({
        enabled: true,
        mode: 'hud',
        badgeText: '🔴 ÉLŐ FÓKUSZ',
        title: title || 'SmartLogistics – Frontend fejlesztés',
        subtitle: description || 'Komponensek és dizájn finomhangolása',
        position: 'bottom-left'
      });
    } else if (preset === 'hud-contact') {
      setOverlayEnabled(true);
      setOverlayMode('hud');
      setBadgeText('💬 PROJEKTINDÍTÁS');
      setOverlayTitle('Kérdésed van vagy saját szoftvert szeretnél?');
      setOverlaySubtitle('Írj az Ajánlatkérés menüben, és felveszem veled a kapcsolatot!');
      setOverlayPosition('bottom-bar');
      await handleApplyOverlay({
        enabled: true,
        mode: 'hud',
        badgeText: '💬 PROJEKTINDÍTÁS',
        title: 'Kérdésed van vagy saját szoftvert szeretnél?',
        subtitle: 'Írj az Ajánlatkérés menüben, és felveszem veled a kapcsolatot!',
        position: 'bottom-bar'
      });
    }
  };

  const handleStartBroadcast = async () => {
    setErrorMsg(null);
    setIsStarting(true);
    try {
      const chosenKey = isUnlisted
        ? (linkMode === 'persistent' ? persistentKey : undefined)
        : undefined;

      const controller = await liveStreamService.startBroadcast({
        title,
        description,
        isUnlisted,
        secretKey: chosenKey,
        onEnded: () => {
          setIsLive(false);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
          }
        },
        onError: (err) => {
          setErrorMsg(err.message);
          setIsLive(false);
        }
      });

      setIsLive(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = controller.stream;
        videoPreviewRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setErrorMsg('Megszakítottad az ablak kiválasztását. Próbáld újra, ha készen állsz a közvetítésre.');
      } else {
        setErrorMsg(err?.message || 'Nem sikerült elindítani a képernyőmegosztást.');
      }
      setIsLive(false);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopBroadcast = async () => {
    await liveStreamService.stopBroadcast();
    setIsLive(false);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  };

  const currentUnlistedKey = isLive ? (status?.secretKey || persistentKey) : persistentKey;
  const secretShareUrl = currentUnlistedKey ? `${window.location.origin}/privat-elo/${currentUnlistedKey}` : '';

  const handleCopyLink = () => {
    if (!secretShareUrl) return;
    navigator.clipboard.writeText(secretShareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#0c101d] via-[#090b12] to-black">
      {/* Glow highlight */}
      <div className={`ambient-glow-indigo top-0 right-0 ${isLive ? 'opacity-40' : 'opacity-10'}`} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLive
                  ? isUnlisted
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Élő Stúdió Megosztás Vezérlőpult
            </span>
          </div>
          <h3 className="text-2xl font-bold font-display text-white">
            „Min dolgozom most?” — Képernyő / Ablak Közvetítés
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Oszd meg bármelyik alkalmazásod ablakát (pl. VS Code, Figma, Blender, Unity vagy böngésző lap). Választhatsz nyilvános adás vagy rejtett, ideiglenes titkos link között!
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLive && isUnlisted && secretShareUrl ? (
            <a
              href={secretShareUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Titkos oldal megnyitása</span>
              <ExternalLink className="w-3 h-3 text-amber-400" />
            </a>
          ) : (
            <Link
              to="/elo-munka"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Publikus oldal megnyitása</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          )}
        </div>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Controls Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left: Settings & Start/Stop Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Projekt neve / Munkafolyamat címe *
            </label>
            <input
              type="text"
              value={title}
              disabled={isLive}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pl. SmartLogistics Portál frontend fejlesztése"
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Rövid leírás / Aktuális teendő
            </label>
            <input
              type="text"
              value={description}
              disabled={isLive}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pl. Felhasználói felület finomhangolása, React komponensek írása"
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          {/* Broadcast Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Közvetítés Láthatósága / Típusa
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Public */}
              <button
                type="button"
                disabled={isLive}
                onClick={() => setIsUnlisted(false)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-60 ${
                  !isUnlisted
                    ? 'bg-indigo-600/15 border-indigo-500/60 ring-1 ring-indigo-500/40 text-white'
                    : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe className={`w-4 h-4 ${!isUnlisted ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-white">Nyilvános Közvetítés</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Megjelenik a főoldalon, a felső menüben (🔴 LIVE) és a portfólió látogatói számára.
                </p>
              </button>

              {/* Option 2: Unlisted / Temporary link */}
              <button
                type="button"
                disabled={isLive}
                onClick={() => setIsUnlisted(true)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-60 ${
                  isUnlisted
                    ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-white'
                    : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lock className={`w-4 h-4 ${isUnlisted ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-amber-300">Ideiglenes / Rejtett Link</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  100%-ban rejtve marad a főoldalról és a menüből. Csak a generált titkos linken érhető el.
                </p>
              </button>
            </div>
          </div>

          {/* Unlisted Link Mode & Settings Box */}
          {isUnlisted && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    Rejtett / Privát Link Beállítások
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-400/90 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 w-fit">
                  {isLive ? '🔴 Élő Közvetítés Adásban' : '⚙️ Készenlét'}
                </span>
              </div>

              {/* Link Mode Switch */}
              <div>
                <label className="block text-[11px] font-medium text-amber-200/90 mb-2">
                  Privát link viselkedése:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isLive}
                    onClick={() => handleLinkModeChange('persistent')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-60 ${
                      linkMode === 'persistent'
                        ? 'bg-amber-500/25 border-amber-400/80 ring-1 ring-amber-400/50 text-white shadow-lg'
                        : 'bg-black/40 border-amber-500/20 text-slate-400 hover:border-amber-500/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">📌</span>
                      <span className="text-xs font-bold text-amber-200">Állandó privát link (Fix)</span>
                    </div>
                    <p className="text-[10px] text-amber-200/70 leading-snug">
                      Mindig ugyanaz az egy link marad érvényben minden közvetítésednél. Nem kell minden alkalommal új linket küldened!
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={isLive}
                    onClick={() => handleLinkModeChange('ephemeral')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-60 ${
                      linkMode === 'ephemeral'
                        ? 'bg-amber-500/25 border-amber-400/80 ring-1 ring-amber-400/50 text-white shadow-lg'
                        : 'bg-black/40 border-amber-500/20 text-slate-400 hover:border-amber-500/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">🎲</span>
                      <span className="text-xs font-bold text-amber-200">Minden alkalommal új link</span>
                    </div>
                    <p className="text-[10px] text-amber-200/70 leading-snug">
                      Minden indításkor automatikusan egyedi, egyszeri link generálódik.
                    </p>
                  </button>
                </div>
              </div>

              {/* URL Display Box */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-amber-200/90 mb-1.5">
                  <span>
                    {isLive
                      ? 'Aktuális közvetítés linkje:'
                      : linkMode === 'persistent'
                      ? 'Mentett állandó fix link:'
                      : 'Ideiglenes link:'}
                  </span>
                  {linkMode === 'persistent' && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Fix link mentve
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      linkMode === 'persistent' || isLive
                        ? secretShareUrl
                        : `${window.location.origin}/privat-elo/... (Közvetítés indításakor generálódik)`
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-black/70 border border-amber-500/30 text-amber-200 text-xs font-mono select-all focus:outline-none"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={linkMode === 'ephemeral' && !isLive}
                      onClick={handleCopyLink}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Másolva!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Másolás</span>
                        </>
                      )}
                    </button>

                    {linkMode === 'persistent' && (
                      <button
                        type="button"
                        disabled={isLive}
                        onClick={handleRegenerateKey}
                        title="Új véletlenszerű kulcs generálása a fix linkhez (a korábbi nézők hozzáférése megszűnik)"
                        className="px-3 py-2.5 rounded-xl bg-black/60 hover:bg-black/90 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${keyRegeneratedNotice ? 'animate-spin text-emerald-400' : ''}`} />
                        <span className="hidden sm:inline">Új fix link</span>
                      </button>
                    )}

                    {(linkMode === 'persistent' || isLive) && (
                      <a
                        href={secretShareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/30 text-amber-300 hover:text-white transition-colors"
                        title="Megnyitás új lapon"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {keyRegeneratedNotice && (
                  <p className="mt-1.5 text-[11px] text-emerald-400 font-medium flex items-center gap-1 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Új fix privát link sikeresen legenerálva és elmentve!
                  </p>
                )}
              </div>

              {/* Explanatory notes */}
              <div className="text-[11px] text-amber-200/80 leading-relaxed bg-black/30 p-3 rounded-xl border border-amber-500/15">
                {linkMode === 'persistent' ? (
                  <p>
                    💡 <strong>Állandó fix link aktív:</strong> Bármikor elindítod a közvetítést, mindig ezen a fix linken lesz látható. Elég egyszer megosztanod a partnereddel! Ha vissza szeretnéd vonni a hozzáférést a korábbi nézőktől, csak kattints az <strong>„Új fix link”</strong> gombra.
                  </p>
                ) : (
                  <p>
                    💡 <strong>Egyszeri link aktív:</strong> Minden egyes közvetítés indításakor új, egyszer használatos link jön létre. Az adás leállításával a korábbi link érvényét veszti.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {!isLive ? (
              <button
                type="button"
                onClick={handleStartBroadcast}
                disabled={isStarting}
                className={`w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 ${
                  isUnlisted
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-amber-600/25'
                    : 'bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-rose-600/25'
                }`}
              >
                {isStarting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Ablak kiválasztása folyamatban...</span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-5 h-5" />
                    <span>
                      {isUnlisted
                        ? '🔒 Ablak kiválasztása és ideiglenes közvetítés indítása'
                        : '🔴 Ablak kiválasztása és nyilvános közvetítés indítása'}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopBroadcast}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <Square className="w-5 h-5 fill-white" />
                <span>Közvetítés Leállítása</span>
              </button>
            )}
          </div>

          {/* Helpful Information Notes */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hogyan választhatsz külön ablakot?</span>
            </div>
            <p className="leading-relaxed">
              Az indítás gombra kattintva a böngésző saját ablakválasztó menüt nyit meg. Válaszd ki a <strong>„Window / Ablak”</strong> fület, és jelöld ki közvetlenül a VS Code, Figma, Blender vagy böngésző ablakodat. Ezzel a saját személyes asztalod és egyéb ablakaid 100%-ban rejtve maradnak!
            </p>
          </div>
        </div>

        {/* Right: Live Monitor Preview & Stats */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Stúdió Előnézet (Monitor)</span>
            </span>

            <div className="flex items-center gap-2">
              {isLive ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                    <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                    <span>60 FPS</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase">
                    Adásban ({elapsed})
                  </span>
                </>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
                  Offline
                </span>
              )}
            </div>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-inner flex items-center justify-center group">
            <video
              ref={videoPreviewRef}
              muted
              playsInline
              className={`w-full h-full object-contain ${isLive ? 'block' : 'hidden'}`}
            />

            {/* Live Overlay in Local Broadcaster Preview */}
            <LiveStreamOverlay overlay={overlayEnabled ? currentOverlayConfig : null} isPreview={true} />

            {!isLive && (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-500 p-6 text-center">
                <Monitor className="w-8 h-8 text-slate-600" />
                <span className="text-xs font-medium text-slate-400">
                  Nincs aktív közvetítés.
                </span>
                <span className="text-[11px] text-slate-600">
                  Kattints a bal oldali indítás gombra az ablak megosztásához.
                </span>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          {isLive && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Jelenlegi nézők</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {status?.viewersCount || 1} online
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Közvetítési idő</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {elapsed}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Live Overlay & Break / Lunch Screen Controller */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Képernyőfelirat & Szünet Képernyő (HUD / BRB)
                </span>
              </div>

              {/* Toggle Enable Switch */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  {overlayEnabled ? 'Felirat Aktív' : 'Kikapcsolva'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleOverlay(!overlayEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    overlayEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={overlayEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      overlayEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick 1-Click Presets */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Gyors sablonok (1 kattintásos élesítés):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('break-short')}
                  className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-0.5">
                    <Coffee className="w-3.5 h-3.5" />
                    <span>5p Szünet</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">Visszaszámláló</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('break-lunch')}
                  className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-0.5">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Ebédszünet</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">30 perces szünet</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('hud-focus')}
                  className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span>Munka HUD</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">Aktuális feladat</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('hud-contact')}
                  className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold mb-0.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Kapcsolat</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">Ajánlatkérés sáv</p>
                </button>
              </div>
            </div>

            {/* Overlay Size Selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Kiírás / Felirat mérete:</span>
                <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                  {overlaySize === 'sm' && 'Kicsi (Kompakt)'}
                  {overlaySize === 'md' && 'Normál méret'}
                  {overlaySize === 'lg' && 'Nagy méret'}
                  {overlaySize === 'xl' && 'Kiemelt (Extra)'}
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10">
                {[
                  { id: 'sm', label: 'Kicsi' },
                  { id: 'md', label: 'Normál' },
                  { id: 'lg', label: 'Nagy' },
                  { id: 'xl', label: 'Extra' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSizeChange(s.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      overlaySize === s.id
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector (HUD Banner vs Full Break Screen) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOverlayMode('hud');
                  if (overlayEnabled) handleApplyOverlay({ mode: 'hud' });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  overlayMode === 'hud'
                    ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-md'
                    : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                Munka HUD Felirat
              </button>

              <button
                type="button"
                onClick={() => {
                  setOverlayMode('break');
                  if (overlayEnabled) handleApplyOverlay({ mode: 'break' });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  overlayMode === 'break'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md'
                    : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                Szünet / Ebédszünet
              </button>
            </div>

            {/* Specific Settings for Break Screen */}
            {overlayMode === 'break' ? (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Címke / Kategória
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Pl. 🍽️ EBÉDSZÜNET vagy ☕ SZÜNET"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Időzítő típusa
                    </label>
                    <select
                      value={timerType}
                      onChange={(e) => handleTimerTypeChange(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="countdown">Visszaszámláló (Perc)</option>
                      <option value="target-time">Fix visszatérési időpont (Óra:Perc)</option>
                      <option value="none">Időzítő nélkül (Csak szöveg)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Fő szünet üzenet
                  </label>
                  <input
                    type="text"
                    value={overlayTitle}
                    onChange={(e) => setOverlayTitle(e.target.value)}
                    placeholder="Pl. Jelenleg ebédszüneten vagyok"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Kiegészítő megjegyzés
                  </label>
                  <input
                    type="text"
                    value={overlaySubtitle}
                    onChange={(e) => setOverlaySubtitle(e.target.value)}
                    placeholder="Pl. A közvetítés hamarosan folytatódik a kódolással!"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Timer configuration inputs */}
                {timerType === 'countdown' && (
                  <div>
                    <label className="block text-[11px] font-medium text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Visszaszámláló időtartama:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {[5, 10, 15, 20, 30, 45].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleCountdownMinutesChange(m)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            countdownMinutes === m
                              ? 'bg-amber-500 text-black font-bold'
                              : 'bg-black/60 hover:bg-black/90 text-slate-300 border border-white/10'
                          }`}
                        >
                          {m}p
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={countdownMinutes}
                          onChange={(e) => handleCountdownMinutesChange(Math.max(1, Number(e.target.value) || 1))}
                          className="w-14 px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-xs text-center text-white focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-[11px] text-slate-400">perc</span>
                      </div>
                    </div>
                  </div>
                )}

                {timerType === 'target-time' && (
                  <div>
                    <label className="block text-[11px] font-medium text-amber-300 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Várható visszatérési időpont:</span>
                    </label>
                    <input
                      type="text"
                      value={targetTimeStr}
                      onChange={(e) => {
                        setTargetTimeStr(e.target.value);
                        if (overlayEnabled) {
                          handleApplyOverlay({ targetTimeDisplay: e.target.value });
                        }
                      }}
                      placeholder="Pl. 13:30 vagy 14:00"
                      className="w-full sm:w-48 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Specific Settings for HUD Banner */
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Kiemelt címke
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Pl. 🔴 ÉLŐ MUNKA vagy ⚡ FÓKUSZ"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Pozíció a videón
                    </label>
                    <select
                      value={overlayPosition}
                      onChange={(e) => handlePositionChange(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="bottom-left">Bal alsó sarok</option>
                      <option value="bottom-right">Jobb alsó sarok</option>
                      <option value="top-left">Bal felső sarok</option>
                      <option value="top-right">Jobb felső sarok</option>
                      <option value="bottom-bar">Alsó információs sáv</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Képernyőre írt felirat / Cím
                  </label>
                  <input
                    type="text"
                    value={overlayTitle}
                    onChange={(e) => setOverlayTitle(e.target.value)}
                    placeholder="Pl. SmartLogistics – Reszponzív menü kódolása"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Rövid kiegészítő leírás (opcionális)
                  </label>
                  <input
                    type="text"
                    value={overlaySubtitle}
                    onChange={(e) => setOverlaySubtitle(e.target.value)}
                    placeholder="Pl. React + TypeScript komponensek stílusozása"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Apply & Save Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => handleApplyOverlay({ enabled: true })}
                disabled={isSavingOverlay}
                className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                  overlayMode === 'break'
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                }`}
              >
                {isSavingOverlay ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mentés és élesítés...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {overlayMode === 'break'
                        ? '🍽️ Szünet Képernyő Aktiválása a Közvetítésben'
                        : '⚡ Felirat Frissítése a Képernyőn'}
                    </span>
                  </>
                )}
              </button>

              {overlayEnabled && (
                <button
                  type="button"
                  onClick={() => handleToggleOverlay(false)}
                  className="py-2.5 px-4 rounded-xl bg-black/40 hover:bg-black/70 border border-white/10 text-rose-300 hover:text-rose-200 text-xs font-medium cursor-pointer transition-colors shrink-0"
                >
                  Felirat elrejtése
                </button>
              )}
            </div>

            {overlaySavedNotice && (
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Képernyőfelirat sikeresen élesítve a közvetítésben (minden linken azonnal látható)!</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
