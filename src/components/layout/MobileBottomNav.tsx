import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  Send,
  SearchCheck,
  LayoutGrid,
  X,
  Smartphone,
  ShieldCheck,
  Download,
  User,
  Layers,
  Mail,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { capacityService, getModeBadgeInfo } from '../../services/capacityService';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const MobileBottomNav: React.FC = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [capacityState, setCapacityState] = useState(() => capacityService.getEffectiveState());
  const { openIOSGuide, isInstalled } = usePWAInstall();
  const location = useLocation();

  useEffect(() => {
    setSheetOpen(false);
    setCapacityState(capacityService.getEffectiveState());
  }, [location.pathname]);

  useEffect(() => {
    const handleCapacityUpdate = () => {
      setCapacityState(capacityService.getEffectiveState());
    };
    window.addEventListener('store_hl_studio_capacity', handleCapacityUpdate);
    return () => window.removeEventListener('store_hl_studio_capacity', handleCapacityUpdate);
  }, []);

  const modeBadge = getModeBadgeInfo(capacityState.effectiveMode);

  const moreLinks = [
    { to: '/elo-munka', label: 'Élő Munka (Közvetítés)', desc: 'Valós idejű ablak és folyamat betekintő', icon: Radio },
    { to: '/szolgaltatasok', label: 'Szolgáltatások', desc: 'Weboldal, szoftver és AI fejlesztés', icon: Layers },
    { to: '/letoltesek', label: 'Letöltések', desc: 'Sablonok, útmutatók és segédletek', icon: Download },
    { to: '/rolam', label: 'Rólam', desc: 'Horvát László szakmai bemutatkozás', icon: User },
    { to: '/kapcsolat', label: 'Kapcsolat', desc: 'Közvetlen elérhetőségek és üzenetküldés', icon: Mail },
  ];

  return (
    <>
      {/* iOS Bottom Sheet Drawer for "Több / App Menü" */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-sm flex items-end"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-[#0b0e17]/98 backdrop-blur-2xl border-t border-white/15 p-5 pb-24 space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Grab Handle */}
            <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/apple-touch-icon.png"
                  alt="HL Studio"
                  className="w-9 h-9 rounded-xl border border-white/15"
                />
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    Horvát László Studio
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${modeBadge.dotClass}`} />
                    <span>Projektfogadás: {modeBadge.label}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                aria-label="Menü bezárása"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/8 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-white">{item.label}</span>
                        <span className="block text-[11px] text-slate-400">{item.desc}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  openIOSGuide();
                }}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/35 text-indigo-200 text-xs font-semibold cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>{isInstalled ? 'Mobil Alkalmazás' : 'Mobil Web App'}</span>
              </button>

              <Link
                to="/admin"
                onClick={() => setSheetOpen(false)}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-200 text-xs font-semibold"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Studio Admin</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* iOS Native-Style Frosted Bottom Tab Bar */}
      <nav
        aria-label="Mobil alsó navigáció"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080a0f]/90 backdrop-blur-2xl border-t border-white/10 ios-safe-bottom"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span>Főoldal</span>
          </NavLink>

          <NavLink
            to="/projektek"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Briefcase className="w-5 h-5" />
            <span>Projektek</span>
          </NavLink>

          {/* Center Primary Action Tab: Ajánlatkérés */}
          <NavLink
            to="/projekt-igeny"
            className="flex flex-col items-center justify-center -mt-3"
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 relative ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-indigo-500/40 ring-2 ring-indigo-300/50'
                      : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-600/30'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080a0f] ${modeBadge.dotClass}`}
                  />
                </div>
                <span
                  className={`text-[10px] mt-1 font-semibold ${
                    isActive ? 'text-indigo-300' : 'text-slate-300'
                  }`}
                >
                  Ajánlat
                </span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/ajanlat-statusz"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <SearchCheck className="w-5 h-5" />
            <span>Státusz</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setSheetOpen(!sheetOpen)}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
              sheetOpen ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span>Menü</span>
          </button>
        </div>
      </nav>
    </>
  );
};
