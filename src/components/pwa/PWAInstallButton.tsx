import React from 'react';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'mobile-drawer' | 'footer' | 'admin';
  onActionComplete?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  onActionComplete,
}) => {
  const { isInstallable, isInstalled, install, openIOSGuide } = usePWAInstall();

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        openIOSGuide();
      }
    } else {
      openIOSGuide();
    }
    if (onActionComplete) {
      onActionComplete();
    }
  };

  if (isInstalled) {
    if (variant === 'navbar') {
      return null;
    }
    return (
      <button
        type="button"
        onClick={openIOSGuide}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium cursor-pointer"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>iOS / Web App Aktív</span>
      </button>
    );
  }

  if (variant === 'navbar') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-indigo-500/40 rounded-lg transition-all cursor-pointer"
        title="Web App telepítése vagy mentése kezdőképernyőre"
      >
        <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden lg:inline">App</span>
      </button>
    );
  }

  if (variant === 'mobile-drawer') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-indigo-200 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-xl transition-all cursor-pointer"
      >
        <Smartphone className="w-4 h-4 text-indigo-400" />
        <span>{isInstallable ? 'Alkalmazás Telepítése' : 'Mobil Web App Információ'}</span>
      </button>
    );
  }

  if (variant === 'admin') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition-all cursor-pointer"
      >
        <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="truncate">Mobil App Info</span>
      </button>
    );
  }

  // Footer variant
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-xs font-semibold text-indigo-300 hover:text-white transition-all cursor-pointer"
    >
      {isInstallable ? (
        <Download className="w-3.5 h-3.5 text-indigo-400" />
      ) : (
        <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
      )}
      <span>Mobil Web App Telepítése</span>
    </button>
  );
};
