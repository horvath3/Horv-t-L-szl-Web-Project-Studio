import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, ShieldCheck, Smartphone } from 'lucide-react';
import { authService } from '../../services/storage';
import { capacityService, getModeBadgeInfo } from '../../services/capacityService';
import { TopPromotionBanner } from './TopPromotionBanner';
import { CapacityAlertBanner } from './CapacityAlertBanner';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { liveStreamService } from '../../services/liveStreamService';

interface NavSparkParticle {
  id: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  isStar: boolean;
}

const SPARK_COLORS = [
  '#e879f9', // fuchsia-400
  '#c084fc', // purple-400
  '#a855f7', // purple-500
  '#818cf8', // indigo-400
  '#6366f1', // indigo-500
  '#38bdf8', // sky-400
  '#ffffff', // pure white core
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(authService.isAuthenticated());
  const [capacityState, setCapacityState] = useState(() => capacityService.getEffectiveState());
  const [isLive, setIsLive] = useState(false);
  const { openIOSGuide } = usePWAInstall();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const checkLive = async () => {
      try {
        const status = await liveStreamService.getStatus();
        if (mounted) setIsLive(!!status.isLive);
      } catch {
        // Ignore polling error
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sliding & Sparkling Nav Indicator state
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(80);
  const navContainerRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const prevIndicatorRef = useRef<{ left: number; width: number } | null>(null);
  const slideTimeoutRef = useRef<number | null>(null);

  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [sparks, setSparks] = useState<NavSparkParticle[]>([]);

  const navLinks = [
    { to: '/', label: 'Főoldal' },
    { to: '/rolam', label: 'Rólam' },
    { to: '/szolgaltatasok', label: 'Szolgáltatások' },
    { to: '/projektek', label: 'Projektek' },
    { to: '/letoltesek', label: 'Letöltések' },
    { to: '/elo-munka', label: 'Élő Munka', isLiveBadge: isLive },
    { to: '/kapcsolat', label: 'Kapcsolat' },
  ];

  const getActiveLinkPath = useCallback((pathname: string): string | null => {
    if (pathname === '/') return '/';
    const matched = navLinks.find(
      (l) => l.to !== '/' && (pathname === l.to || pathname.startsWith(l.to + '/'))
    );
    return matched ? matched.to : null;
  }, []);

  const spawnSparklesAlongPath = useCallback(
    (fromLeft: number, fromWidth: number, toLeft: number, toWidth: number) => {
      const startCenter = fromLeft + fromWidth / 2;
      const endCenter = toLeft + toWidth / 2;
      const distance = endCenter - startCenter;
      const dir = distance >= 0 ? 'right' : 'left';
      setSlideDirection(dir);
      setIsSliding(true);

      if (slideTimeoutRef.current) {
        window.clearTimeout(slideTimeoutRef.current);
      }

      const count = Math.min(26, Math.max(14, Math.round(Math.abs(distance) / 10) + 12));
      const now = Date.now();
      const newSparks: NavSparkParticle[] = [];

      for (let i = 0; i < count; i++) {
        const progress = count > 1 ? i / (count - 1) : 0.5;
        // Position along the travel path of the bar
        const pathX =
          Math.abs(distance) > 4
            ? startCenter + distance * progress + (Math.random() - 0.5) * 18
            : toLeft + Math.random() * toWidth;
        const pathY = (Math.random() - 0.5) * 4;

        // Drift trailing slightly behind the motion + upward/downward scatter
        const trailDrag = dir === 'right' ? -8 - Math.random() * 18 : 8 + Math.random() * 18;
        const tx = Math.abs(distance) > 4 ? trailDrag : (Math.random() - 0.5) * 28;
        const ty = (Math.random() - 0.55) * 26;

        newSparks.push({
          id: `spark-${now}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          x: pathX,
          y: pathY,
          tx,
          ty,
          size: 3.5 + Math.random() * 4.5,
          color: SPARK_COLORS[i % SPARK_COLORS.length],
          delay: Math.round(progress * 260 + Math.random() * 45),
          duration: Math.round(380 + Math.random() * 240),
          isStar: i % 2 === 0,
        });
      }

      setSparks(newSparks);

      slideTimeoutRef.current = window.setTimeout(() => {
        setIsSliding(false);
        setSparks([]);
      }, 680);
    },
    []
  );

  const updateIndicatorPosition = useCallback(
    (animateSparkles = true) => {
      const activePath = getActiveLinkPath(location.pathname);
      if (!activePath || !navContainerRef.current) {
        setIndicator((prev) => ({ ...prev, opacity: 0 }));
        prevIndicatorRef.current = null;
        return;
      }

      const targetEl = linkRefs.current[activePath];
      if (!targetEl) {
        setIndicator((prev) => ({ ...prev, opacity: 0 }));
        return;
      }

      // Compute position relative to nav container, inset by horizontal padding (12px)
      const padX = 12;
      const newLeft = targetEl.offsetLeft + padX;
      const newWidth = Math.max(20, targetEl.offsetWidth - padX * 2);

      const prev = prevIndicatorRef.current;
      if (
        animateSparkles &&
        prev !== null &&
        (Math.abs(prev.left - newLeft) > 2 || Math.abs(prev.width - newWidth) > 2)
      ) {
        spawnSparklesAlongPath(prev.left, prev.width, newLeft, newWidth);
      }

      prevIndicatorRef.current = { left: newLeft, width: newWidth };
      setIndicator({
        left: newLeft,
        width: newWidth,
        opacity: 1,
      });
    },
    [location.pathname, getActiveLinkPath, spawnSparklesAlongPath]
  );

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.offsetHeight;
      if (h > 0) {
        setHeaderHeight(h);
      }
    };

    measure();
    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [location.pathname, capacityState]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    const handleCapacityUpdate = () => {
      setCapacityState(capacityService.getEffectiveState());
    };
    const handleResize = () => {
      updateIndicatorPosition(false);
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('store_hl_studio_capacity', handleCapacityUpdate);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('store_hl_studio_capacity', handleCapacityUpdate);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateIndicatorPosition]);

  useEffect(() => {
    setIsOpen(false);
    setIsAdmin(authService.isAuthenticated());
    setCapacityState(capacityService.getEffectiveState());
    updateIndicatorPosition(true);
  }, [location.pathname, updateIndicatorPosition]);

  const handleNavClick = (targetPath: string) => {
    const targetEl = linkRefs.current[targetPath];
    if (!targetEl) return;
    const padX = 12;
    const newLeft = targetEl.offsetLeft + padX;
    const newWidth = Math.max(20, targetEl.offsetWidth - padX * 2);
    const prev = prevIndicatorRef.current;

    if (prev && Math.abs(prev.left - newLeft) <= 2) {
      // Clicked already-active tab: emit a celebratory local sparkle burst
      spawnSparklesAlongPath(newLeft, newWidth, newLeft, newWidth);
    }
  };

  const modeBadge = getModeBadgeInfo(capacityState.effectiveMode);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ios-safe-top ${
          scrolled
            ? 'glass-nav shadow-lg shadow-black/30'
            : 'bg-[#080a0f]/85 backdrop-blur-xl border-b border-white/8'
        }`}
      >
        <div ref={headerRef as React.RefObject<HTMLDivElement>}>
          <TopPromotionBanner />
          <CapacityAlertBanner variant="top-bar" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Zone 1: Single text element wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2 group text-xl font-bold tracking-tight font-display text-white"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${modeBadge.dotClass} group-hover:scale-125 transition-transform`}
              title={`Projektfogadás: ${modeBadge.label}`}
            />
            <span className="hover:text-indigo-400 transition-colors">Horvát László</span>
          </Link>

          {/* Zone 2: Navigation links with Smooth Sliding & Sparkling Indicator */}
          <nav
            ref={navContainerRef}
            className="hidden md:flex items-center space-x-1 lg:space-x-2 relative py-1"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                ref={(el) => {
                  linkRefs.current[link.to] = el;
                }}
                onClick={() => handleNavClick(link.to)}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium transition-colors duration-300 relative select-none flex items-center gap-1.5 ${
                    isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                <span>{link.label}</span>
                {link.isLiveBadge && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    LIVE
                  </span>
                )}
              </NavLink>
            ))}

            {/* Sparkling Particle Trail Container */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 bottom-0.5 h-0 overflow-visible z-20"
            >
              {sparks.map((spark) => (
                <span
                  key={spark.id}
                  style={
                    {
                      left: `${spark.x}px`,
                      top: `${spark.y}px`,
                      width: `${spark.size}px`,
                      height: `${spark.size}px`,
                      '--tx': `${spark.tx}px`,
                      '--ty': `${spark.ty}px`,
                      '--delay': `${spark.delay}ms`,
                      '--dur': `${spark.duration}ms`,
                    } as React.CSSProperties
                  }
                  className="absolute -translate-x-1/2 -translate-y-1/2 animate-nav-sparkle"
                >
                  {spark.isStar ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill={spark.color}
                      className="w-full h-full overflow-visible"
                      style={{
                        filter: `drop-shadow(0 0 5px ${spark.color}) drop-shadow(0 0 10px #a855f7)`,
                      }}
                    >
                      <path d="M12 0 L14.8 9.2 L24 12 L14.8 14.8 L12 24 L9.2 14.8 L0 12 L9.2 9.2 Z" />
                    </svg>
                  ) : (
                    <span
                      className="block w-full h-full rounded-full"
                      style={{
                        backgroundColor: spark.color,
                        boxShadow: `0 0 6px ${spark.color}, 0 0 12px #8b5cf6`,
                      }}
                    />
                  )}
                </span>
              ))}
            </div>

            {/* Smoothly Sliding Purple-Indigo Underline Bar */}
            <div
              aria-hidden="true"
              style={{
                transform: `translate3d(${indicator.left}px, 0, 0)`,
                width: `${indicator.width}px`,
                opacity: indicator.opacity,
                transition:
                  'transform 480ms cubic-bezier(0.22, 1, 0.36, 1), width 480ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, box-shadow 300ms ease',
              }}
              className={`pointer-events-none absolute bottom-0 left-0 h-[2.5px] rounded-full bg-gradient-to-r from-indigo-500 via-purple-400 to-fuchsia-500 z-10 ${
                isSliding
                  ? 'shadow-[0_0_18px_rgba(168,85,247,1),0_0_8px_rgba(99,102,241,1)] brightness-125'
                  : 'shadow-[0_0_10px_rgba(139,92,246,0.65)]'
              }`}
            >
              {/* Soft ambient under-glow */}
              <span
                className={`absolute -inset-x-1 -inset-y-1 rounded-full bg-gradient-to-r from-indigo-500/40 via-purple-400/50 to-fuchsia-500/40 blur-[4px] transition-opacity duration-300 ${
                  isSliding ? 'opacity-100' : 'opacity-60'
                }`}
              />

              {/* Leading Comet Sparkle Head while sliding */}
              {isSliding && (
                <span
                  className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-nav-comet ${
                    slideDirection === 'right' ? '-right-1.5' : '-left-1.5'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="#ffffff"
                    className="w-full h-full"
                    style={{
                      filter:
                        'drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 12px #d946ef) drop-shadow(0 0 18px #6366f1)',
                    }}
                  >
                    <path d="M12 0 L15 9 L24 12 L15 15 L12 24 L9 15 L0 12 L9 9 Z" />
                  </svg>
                </span>
              )}
            </div>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <PWAInstallButton variant="navbar" />

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/40 rounded-lg transition-colors"
                title="Admin felület megnyitása"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            <Link
              to="/projekt-igeny"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 rounded-lg shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all transform active:scale-95 whitespace-nowrap"
            >
              <span>Projektet szeretnék</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={openIOSGuide}
              className="p-2 rounded-lg text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors cursor-pointer"
              title="Mentés iOS főképernyőre (Safari) vagy Mobil Alkalmazás"
              aria-label="Mobil Alkalmazás Telepítése"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <Link
              to="/projekt-igeny"
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md"
            >
              Ajánlatkérés
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Menü kinyitása"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden glass-panel border-b border-white/10 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-indigo-600/20 text-indigo-300 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`
              }
            >
              <span>{link.label}</span>
              {link.isLiveBadge && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  ÉLŐ ADÁS
                </span>
              )}
            </NavLink>
          ))}

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <PWAInstallButton
              variant="mobile-drawer"
              onActionComplete={() => setIsOpen(false)}
            />
            <Link
              to="/projekt-igeny"
              className="w-full text-center py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md"
            >
              Projektet szeretnék
            </Link>
            <Link
              to="/admin"
              className="w-full text-center py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Admin Belépés
            </Link>
          </div>
        </div>
      )}
      </header>
      <div
        aria-hidden="true"
        style={{ height: `${headerHeight}px` }}
        className="w-full shrink-0"
      />
    </>
  );
};
