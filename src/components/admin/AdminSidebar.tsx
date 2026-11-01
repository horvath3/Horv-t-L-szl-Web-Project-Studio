import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Inbox,
  Tag,
  Mail,
  Download,
  Settings,
  LogOut,
  ExternalLink,
  X,
  Gauge,
  Radio
} from 'lucide-react';
import {
  authService,
  requestService,
  promotionService,
  emailTemplateService
} from '../../services/storage';
import { capacityService, getModeBadgeInfo } from '../../services/capacityService';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface AdminSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navigate = useNavigate();
  const requests = requestService.getAll();
  const newRequestsCount = requests.filter((r) => (r.internalStatus || r.status) === 'Új').length;
  const activePromosCount = promotionService.getActive().length;
  const templatesCount = emailTemplateService.getAll().filter((t) => t.active).length;
  const capacityState = capacityService.getEffectiveState();
  const capBadge = getModeBadgeInfo(capacityState.effectiveMode);

  const handleLogout = () => {
    authService.logout();
    if (onCloseMobile) onCloseMobile();
    navigate('/admin');
  };

  const navItems = [
    { to: '/admin', end: true, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      to: '/admin/elo-kozvetites',
      end: false,
      label: 'Élő Közvetítés',
      icon: <Radio className="w-4 h-4 text-rose-400" />,
      badge: '🔴 LIVE'
    },
    {
      to: '/admin/projektkapacitas',
      end: false,
      label: 'Projektkapacitás',
      icon: <Gauge className="w-4 h-4" />,
      badge: `${capBadge.emoji} ${capBadge.shortLabel}`
    },
    { to: '/admin/projektek', end: false, label: 'Projektek', icon: <FolderGit2 className="w-4 h-4" /> },
    {
      to: '/admin/ajanlatkeresek',
      end: false,
      label: 'Ajánlatkérések',
      icon: <Inbox className="w-4 h-4" />,
      badge: newRequestsCount > 0 ? newRequestsCount : null
    },
    {
      to: '/admin/email-sablonok',
      end: false,
      label: 'E-mail sablonok',
      icon: <Mail className="w-4 h-4" />,
      badge: templatesCount > 0 ? templatesCount : null
    },
    {
      to: '/admin/promociok',
      end: false,
      label: 'Promóciók',
      icon: <Tag className="w-4 h-4" />,
      badge: activePromosCount > 0 ? activePromosCount : null
    },
    { to: '/admin/letoltesek', end: false, label: 'Letöltések', icon: <Download className="w-4 h-4" /> },
    { to: '/admin/beallitasok', end: false, label: 'Beállítások', icon: <Settings className="w-4 h-4" /> }
  ];

  const sidebarContent = (
    <aside className="w-64 bg-[#0a0d14] border-r border-white/5 flex flex-col justify-between shrink-0 h-full">
      <div>
        {/* Studio Admin Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link
            to="/admin"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              HL
            </div>
            <div>
              <span className="text-sm font-bold font-display text-white block">Studio Admin</span>
              <span className="text-[11px] text-slate-400">Horvát László</span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-violet-500 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <PWAInstallButton variant="admin" onActionComplete={onCloseMobile} />

        <Link
          to="/"
          onClick={onCloseMobile}
          className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/10 border border-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Főoldal / Weboldal (Appban)</span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Kijelentkezés</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">{sidebarContent}</div>

      {/* Mobile Drawer Sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
