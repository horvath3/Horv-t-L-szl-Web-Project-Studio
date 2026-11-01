import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Smartphone,
  PlusSquare,
  CheckCircle2,
  Download,
  Sparkles,
  Wifi,
  ShieldCheck,
  Layers,
  RefreshCw,
  FileCode2,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { settingsService } from '../../services/storage';
import { pullStateFromServer } from '../../services/syncService';

const DISMISS_STORAGE_KEY = 'hl_studio_ios_banner_dismissed_v1';

/**
 * Authentic iOS Safari Share Icon (Square with upward arrow)
 */
const IOSShareIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

export const IOSInstallModal: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [showFloatingBanner, setShowFloatingBanner] = useState(false);
  const [settings, setSettings] = useState(() => settingsService.get());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    }
  }, [isIOS]);

  useEffect(() => {
    const handleOpenGuide = () => {
      setSettings(settingsService.get());
      setIsOpen(true);
    };
    const handleSettingsChange = () => {
      setSettings(settingsService.get());
    };
    window.addEventListener('open_ios_pwa_guide', handleOpenGuide);
    window.addEventListener('store_hl_studio_settings', handleSettingsChange);
    return () => {
      window.removeEventListener('open_ios_pwa_guide', handleOpenGuide);
      window.removeEventListener('store_hl_studio_settings', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    if (isInstalled) {
      setShowFloatingBanner(false);
      return;
    }
    try {
      const dismissed = sessionStorage.getItem(DISMISS_STORAGE_KEY);
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowFloatingBanner(true);
        }, 2200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, [isInstalled]);

  const dismissBanner = () => {
    setShowFloatingBanner(false);
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors
    }
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setIsOpen(false);
      }
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    await pullStateFromServer();
    setSettings(settingsService.get());
    setTimeout(() => setSyncing(false), 500);
  };

  return (
    <>
      {/* Smart Mobile / iOS & Android Floating Banner (Above Bottom Tab Bar on Mobile) */}
      {showFloatingBanner && !isInstalled && !isOpen && (
        <div className="fixed bottom-[76px] md:bottom-5 left-3 right-3 md:left-auto md:right-5 md:w-[400px] z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl bg-[#0d111c]/95 backdrop-blur-2xl border border-indigo-500/35 p-3.5 shadow-2xl shadow-black/80">
            <div className="flex items-center gap-3">
              <img
                src="/apple-touch-icon.png"
                alt="HL Studio App Icon"
                className="w-12 h-12 rounded-[13px] border border-white/15 shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">
                    HL Studio – Mobil Web Alkalmazás
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                    Élő Sync
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  Teljes weboldal + beépített Admin panel, valós időben összekapcsolva!
                </p>
              </div>
              <button
                type="button"
                onClick={dismissBanner}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Bezárás"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Web ↔ App + Admin összekötve</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isInstallable && !isIOS) {
                    handleDirectInstall();
                  } else {
                    setIsOpen(true);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25 cursor-pointer whitespace-nowrap"
              >
                {isInstallable && !isIOS ? 'Alkalmazás Telepítése' : 'App Központ Megnyitása'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Interactive Android APK & iOS Safari Installation Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0b0e17] border-t sm:border border-white/15 shadow-2xl text-slate-100 p-5 sm:p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src="/apple-touch-icon.png"
                    alt="HL Studio App Icon"
                    className="w-14 h-14 rounded-[16px] border border-indigo-500/40 shadow-xl shadow-indigo-500/20"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0b0e17] flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-slate-950" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold font-display text-white">
                      HL Studio – Mobil Web Alkalmazás
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                      {isInstalled ? 'Telepítve' : 'v2.4.0'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Teljes weboldal + Admin panel valós idejű szinkronizációval
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Ablak bezárása"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Web <-> App Sync Banner */}
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="text-[11px] text-emerald-200 leading-snug">
                  <strong className="text-white block">Valós idejű Web ↔ App + Admin összeköttetés aktív</strong>
                  Minden módosítás (ajánlatkérés, kapacitás, Hero kép, projektek) azonnal szinkronizálódik.
                </div>
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                title="Azonnali szinkronizáció"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>

            {/* Platform Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/50 border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android / Chrome</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad (Safari)</span>
              </button>
            </div>

            {activeTab === 'android' ? (
              <div className="space-y-4">
                {/* Direct Web App Install */}
                <div className="p-4 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                        Telepítés Kezdőképernyőre
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        Teljes Alkalmazás + Beépített Admin Panel
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ugyanaz a teljes felület és Admin vezérlőpult jelenik meg az alkalmazásban, mint a fő weboldalon, közvetlen szerver-szinkronizációval és offline gyorsítótárral.
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleDirectInstall}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Alkalmazás Telepítése Most</span>
                    </button>
                  </div>
                </div>

                {/* Built-in Admin Quick Access inside the App */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Beépített Studio Admin Vezérlőpult
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Kapacitás, ajánlatkérések, Hero kép URL és promóciók kezelése az appból
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shrink-0 transition-colors"
                  >
                    Admin Megnyitása
                  </Link>
                </div>

                {/* Chrome Android Manual Guide */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-1.5 text-xs text-slate-300">
                  <p className="font-semibold text-white">
                    Android Chrome „Alkalmazás telepítése” lépések:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                    <li>
                      Koppints a jobb felső <strong className="text-slate-200">⋮ (Menü)</strong> ikonra, majd válaszd az <strong className="text-slate-200">„Alkalmazás telepítése”</strong> opciót.
                    </li>
                    <li>
                      Az Android rendszer létrehozza és telepíti a <strong className="text-slate-200">HL Studio WebAPK</strong> alkalmazást a főképernyődre és az alkalmazáslistába.
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-200 leading-relaxed">
                  Az iOS rendszeren az alkalmazást közvetlenül a <strong>Safari</strong> böngészőből
                  tudod elmenteni a főképernyődre. Így böngészősáv nélkül,{' '}
                  <strong>teljes képernyős natív alkalmazásként</strong> fog működni (az Admin panellel együtt)!
                </div>

                {/* 3 Steps for iOS Safari */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 font-bold">
                      <IOSShareIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                        1. Lépés
                      </span>
                      <p className="text-xs font-semibold text-white mt-0.5">
                        Koppints a „Megosztás” (Share) gombra a Safariban
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Az iPhone képernyő alján található négyzetből felfelé mutató nyíl ikonra.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                      <PlusSquare className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                        2. Lépés
                      </span>
                      <p className="text-xs font-semibold text-white mt-0.5">
                        Válaszd a „Főképernyőhöz adás” lehetőséget
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Görgess lefelé a Safari menüjében, majd koppints a{' '}
                        <strong className="text-slate-200">
                          Főképernyőhöz adás (Add to Home Screen)
                        </strong>{' '}
                        sorra.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        3. Lépés
                      </span>
                      <p className="text-xs font-semibold text-white mt-0.5">
                        Koppints a jobb felső „Hozzáadás” (Add) gombra
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        A <strong className="text-slate-200">HL Studio</strong> alkalmazás azonnal
                        megjelenik a főképernyőn saját ikonnal és indítóképernyővel!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PWA Features Summary */}
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <Layers className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <span className="block text-[10px] font-semibold text-white">1:1 Felület</span>
                <span className="block text-[9px] text-slate-400">Web + Admin Panel</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <Wifi className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="block text-[10px] font-semibold text-white">Élő Szinkron</span>
                <span className="block text-[9px] text-slate-400">Azonnali adatfrissítés</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <ShieldCheck className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span className="block text-[10px] font-semibold text-white">PWA & iOS</span>
                <span className="block text-[9px] text-slate-400">Teljes képernyős app</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-5 w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Bezárás
            </button>
          </div>
        </div>
      )}
    </>
  );
};
