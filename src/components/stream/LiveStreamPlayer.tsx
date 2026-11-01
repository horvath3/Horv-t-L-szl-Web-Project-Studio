import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Users,
  Clock,
  Maximize2,
  Minimize2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Code2,
  MonitorPlay,
  Zap
} from 'lucide-react';
import { liveStreamService, LiveStreamStatus, StreamOverlayConfig } from '../../services/liveStreamService';
import { LiveStreamOverlay } from './LiveStreamOverlay';
import { Link } from 'react-router-dom';
import { authService } from '../../services/storage';

interface LiveStreamPlayerProps {
  variant?: 'full' | 'compact' | 'minimal';
  autoRefresh?: boolean;
  streamKey?: string;
}

export const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  variant = 'full',
  autoRefresh = true,
  streamKey
}) => {
  const [status, setStatus] = useState<LiveStreamStatus>({
    ok: true,
    isLive: false,
    title: '',
    description: '',
    startedAt: null,
    lastFrameAt: 0,
    hasFrame: false,
    viewersCount: 0
  });

  const [overlay, setOverlay] = useState<StreamOverlayConfig | null>(null);
  const [hasWebRtc, setHasWebRtc] = useState(false);
  const [webrtcState, setWebrtcState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [snapshotSrc, setSnapshotSrc] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedText, setElapsedText] = useState('00:00');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Poll Status
  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      const isAdmin = authService.isAuthenticated();
      const data = await liveStreamService.getStatus({ key: streamKey, isAdmin });
      if (!isMounted) return;
      setStatus(data);
      if (data.overlay !== undefined) {
        setOverlay(data.overlay);
      }

      if (data.isLive && data.hasFrame) {
        const keyVal = streamKey || data.secretKey || '';
        const keyParam = keyVal ? `&key=${encodeURIComponent(keyVal)}` : isAdmin ? '&admin=true' : '';
        setSnapshotSrc(`/api/live-stream/frame?t=${data.lastFrameAt || Date.now()}${keyParam}`);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, autoRefresh ? 1500 : 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [autoRefresh, streamKey]);

  // 2. Subscribe to 60 FPS WebRTC Stream when Live
  useEffect(() => {
    if (!status.isLive) {
      setHasWebRtc(false);
      setWebrtcState('idle');
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    setWebrtcState('connecting');
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = liveStreamService.subscribeWebRtcStream({
        streamKey,
        onStream: (mediaStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().then(() => {
              setHasWebRtc(true);
              setWebrtcState('connected');
            }).catch(() => {
              setHasWebRtc(true);
            });
          }
        },
        onStatusChange: (s) => {
          if (s === 'connected') {
            setHasWebRtc(true);
            setWebrtcState('connected');
          } else if (s === 'connecting') {
            setWebrtcState('connecting');
          } else {
            setHasWebRtc(false);
            setWebrtcState('idle');
          }
        },
        onOverlay: (newOverlay) => {
          setOverlay(newOverlay);
        },
        onEnded: () => {
          setHasWebRtc(false);
          setWebrtcState('idle');
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
      });
    } catch (err) {
      console.warn('[LiveStreamPlayer] WebRTC subscriber error:', err);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [status.isLive, streamKey]);

  // 3. Elapsed Stream Timer
  useEffect(() => {
    if (!status.isLive || !status.startedAt) {
      setElapsedText('00:00');
      return;
    }

    const updateTimer = () => {
      const diffSec = Math.max(0, Math.floor((Date.now() - (status.startedAt || Date.now())) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      if (hours > 0) {
        setElapsedText(
          `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else {
        setElapsedText(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [status.isLive, status.startedAt]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // OFFLINE STATE
  if (!status.isLive) {
    if (variant === 'minimal') {
      return (
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl text-center relative overflow-hidden bg-[#07090f]">
          <div className="ambient-glow-indigo top-0 left-1/2 -translate-x-1/2 opacity-20" />
          <div className="relative z-10 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
              <MonitorPlay className="w-7 h-7 text-indigo-400/80" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>A közvetítés jelenleg szünetel vagy befejeződött</span>
            </div>
            <h3 className="text-xl font-bold font-display text-white">
              Ideiglenes Közvetítés
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ez a közvetítési link jelenleg nem közvetít élő képet. Amint újraindul az adás a stúdióból, a lejátszó automatikusan 60 FPS-ben közvetíti a képet.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
              >
                <span>Főoldal megtekintése</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl text-center relative overflow-hidden bg-gradient-to-b from-[#0e121d] to-[#080a0f]">
        <div className="ambient-glow-indigo top-0 left-1/2 -translate-x-1/2 opacity-20" />

        <div className="relative z-10 max-w-xl mx-auto py-8 sm:py-12 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <MonitorPlay className="w-8 h-8 text-indigo-400/80" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Jelenleg nincs aktív élő közvetítés</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Min dolgozom most? — Élő Stúdió
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Amikor a stúdióban aktívan kódolok vagy grafikai/szoftveres munkát végzek, itt valós időben, 60 FPS sebességgel közvetítem a kiválasztott munkaablakot (pl. VS Code, Figma, böngésző).
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/projektek"
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
            >
              <span>Elkészült projektek</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              to="/projekt-igeny"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Új projekt indítása</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // LIVE STREAMING STATE (60 FPS Native Hardware Accelerated Video Player)
  return (
    <div
      ref={containerRef}
      className={`glass-panel rounded-3xl border ${
        status.isUnlisted ? 'border-amber-500/40 shadow-amber-950/20' : 'border-rose-500/30'
      } shadow-2xl overflow-hidden transition-all duration-300 bg-black/95 ${
        isFullscreen ? 'p-4 bg-black flex flex-col justify-center' : variant === 'minimal' ? 'p-4' : 'p-4 sm:p-6'
      }`}
    >
      {/* Stream Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Pulsing LIVE Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              status.isUnlisted
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                : 'bg-rose-600/20 border border-rose-500/50 text-rose-300'
            } text-xs font-bold uppercase tracking-wider animate-pulse`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status.isUnlisted ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
              }`}
            />
            <span>{status.isUnlisted ? '🔒 REJTETT ÉLŐ KÖZVETÍTÉS' : '🔴 ÉLŐ KÖZVETÍTÉS'}</span>
          </div>

          {/* Real-time WebRTC Status Tag */}
          {webrtcState === 'connected' ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              <span>60 FPS WebRTC (Aktív)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold animate-pulse">
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
              <span>Kapcsolódás (WebRTC)...</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-white font-bold">{elapsedText}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 font-mono">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-white font-bold">{status.viewersCount} néző</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Kilépés a teljes képernyőből' : 'Teljes képernyő'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Stream Info Header (only if title exists or not minimal) */}
      {variant !== 'minimal' && (
        <div className="mb-4 text-left">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Code2 className="w-3.5 h-3.5" />
            <span>Munkafolyamat · 60 FPS Élő Stúdió Közvetítés</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
            {status.title || 'Aktuális fejlesztési feladat'}
          </h2>
          {status.description && (
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {status.description}
            </p>
          )}
        </div>
      )}

      {/* 60 FPS Native Video Stream Screen */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl aspect-video flex items-center justify-center group">
        {/* Main 60 FPS HTML5 Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain select-none transition-opacity duration-300 ${
            hasWebRtc ? 'opacity-100 block' : 'opacity-0 hidden'
          }`}
        />

        {/* Snapshot Fallback / Loading Poster while WebRTC handshakes */}
        {!hasWebRtc && (
          snapshotSrc ? (
            <img
              src={snapshotSrc}
              alt="Élő ablakmegosztás előnézet"
              className="w-full h-full object-contain select-none"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-400" />
              <span className="text-xs">Csatlakozás a 60 FPS közvetítéshez...</span>
            </div>
          )
        )}

        {/* Dynamic HUD Banner & Break / Lunch Screen Overlay */}
        <LiveStreamOverlay overlay={overlay} />

        {/* Live Watermark Overlay */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-2 pointer-events-none">
          <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
          <span>Horvát László Studio · 60 FPS Élő Megosztás</span>
        </div>

        {/* Low-latency Fluid badge */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Akadásmentes WebRTC Stream</span>
        </div>
      </div>

      {/* Stream Footer Bar (only in full variant) */}
      {variant === 'full' && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Közvetítés minősége: <strong>60 FPS</strong> hardveresen gyorsított videófolyam</span>
          </div>

          <Link
            to="/projekt-igeny"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors font-medium"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Hasonló szoftvert szeretnél? Kérj ajánlatot</span>
          </Link>
        </div>
      )}
    </div>
  );
};
