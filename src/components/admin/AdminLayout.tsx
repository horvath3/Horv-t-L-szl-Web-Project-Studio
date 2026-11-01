import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  Bell,
  ArrowLeft,
  Check,
  AlertCircle,
  Menu,
  LayoutDashboard,
  Gauge,
  Inbox,
  Settings,
  Smartphone,
  Radio,
} from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { authService, notificationService } from '../../services/storage';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationService.getAll());
  const { openIOSGuide } = usePWAInstall();
  const location = useLocation();

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    window.addEventListener('admin_auth_changed', handleAuthChange);
    return () => window.removeEventListener('admin_auth_changed', handleAuthChange);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!password) {
      setLoginError('Kérjük, add meg az adminisztrátori jelszót.');
      return;
    }
    const success = authService.login(password);
    if (success) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      setLoginError('Helytelen jelszó! (Alapértelmezett: admin2026)');
    }
  };

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getAll());
  };

  // If not logged in, show secure login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* Glows */}
        <div className="ambient-glow-indigo top-10 left-1/4" />
        <div className="ambient-glow-purple bottom-10 right-1/4" />

        <div className="w-full max-w-md relative z-10">
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Vissza a stúdió weboldalára</span>
            </Link>
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold font-display text-white">
              Studio Admin Belépés
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Horvát László – Web & Project Studio belső vezérlőpult
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl">
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Adminisztrátori Jelszó
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Add meg a jelszót..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                Biztonságos Belépés
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <span className="text-[11px] text-slate-500 block">
                Alapértelmezett fejlesztői jelszó: <code className="text-indigo-400 font-mono">admin2026</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getBreadcrumbLabel = () => {
    const sub = location.pathname.replace('/admin', '').replace('/', '');
    if (!sub) return 'Dashboard';
    if (sub === 'projektkapacitas') return 'Projektkapacitás';
    if (sub === 'email-sablonok') return 'E-mail sablonok';
    if (sub === 'ajanlatkeresek') return 'Ajánlatkérések';
    if (sub === 'promociok') return 'Promóciók';
    if (sub === 'projektek') return 'Projektek';
    if (sub === 'letoltesek') return 'Letöltések';
    if (sub === 'beallitasok') return 'Beállítások';
    return sub;
  };

  return (
    <div className="min-h-screen bg-[#080a0f] flex text-slate-100 antialiased">
      <AdminSidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Header */}
        <header className="min-h-16 border-b border-white/5 bg-[#080a0f]/85 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 ios-safe-top">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
              aria-label="Menü megnyitása"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Admin</span>
              <span>/</span>
              <span className="text-white font-medium">{getBreadcrumbLabel()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Web Sync Pill */}
            <div
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-medium"
              title="A weboldal és az admin felület valós időben szinkronizálva van"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Valós idejű szinkron</span>
            </div>

            {/* Quick Switch to Public Website */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-medium transition-colors"
              title="Váltás a fő weboldalra"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Weboldal</span>
            </Link>

            {/* Quick Live Stream Control */}
            <Link
              to="/admin/elo-kozvetites"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-medium transition-colors"
              title="Ablak- és képernyőmegosztás indítása"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Élő Adás</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 relative transition-colors"
                title="Értesítések"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl border border-white/10 shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Értesítések</span>
                    {unreadNotifs > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mind olvasott</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 text-center">Nincs új értesítés</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-lg text-xs border ${
                            n.read
                              ? 'bg-transparent border-transparent text-slate-400'
                              : 'bg-white/5 border-white/5 text-slate-200'
                          }`}
                        >
                          <span className="font-semibold block text-white mb-0.5">{n.title}</span>
                          <p className="text-[11px] text-slate-400">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User tag */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                HL
              </div>
              <span className="text-xs font-medium text-slate-300 hidden sm:inline">Horvát László</span>
            </div>
          </div>
        </header>

        {/* Admin Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex-1 overflow-x-hidden">
          {children}
        </main>

        {/* iOS Native-Style Mobile Bottom Tab Bar for Admin */}
        <nav
          aria-label="Admin mobil alsó navigáció"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080a0f]/92 backdrop-blur-2xl border-t border-white/10 ios-safe-bottom"
        >
          <div className="grid grid-cols-5 items-center h-16 px-1">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Áttekintés</span>
            </NavLink>

            <NavLink
              to="/admin/projektkapacitas"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Gauge className="w-5 h-5" />
              <span>Kapacitás</span>
            </NavLink>

            <NavLink
              to="/admin/ajanlatkeresek"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Inbox className="w-5 h-5" />
              <span>Kérések</span>
            </NavLink>

            <NavLink
              to="/admin/beallitasok"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Settings className="w-5 h-5" />
              <span>Beállítások</span>
            </NavLink>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
              <span>Összes</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};
