import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 backdrop-blur-md border border-amber-400/40 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl shadow-amber-500/20">
      <span className="h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline mód — Gyorsítótárazott adatok használata</span>
    </div>
  );
};
