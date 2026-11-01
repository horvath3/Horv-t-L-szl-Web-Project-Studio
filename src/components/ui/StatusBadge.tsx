import React from 'react';
import { ProjectStatus, RequestStatus } from '../../types';

interface StatusBadgeProps {
  status: ProjectStatus | RequestStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'Elkészült':
      case 'Befejezve':
        return {
          bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          dot: 'bg-teal-400'
        };
      case 'Elfogadva':
      case 'Aktív':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-400'
        };
      case 'Folyamatban':
      case 'Fejlesztés alatt':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-400'
        };
      case 'Tesztelés':
      case 'Átnézés alatt':
        return {
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          dot: 'bg-sky-400'
        };
      case 'Kapcsolatfelvétel':
        return {
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          dot: 'bg-cyan-400'
        };
      case 'Ajánlat egyeztetése':
      case 'Egyeztetés':
      case 'Tervezés alatt':
      case 'Tervezett':
        return {
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          dot: 'bg-indigo-400'
        };
      case 'Új':
        return {
          bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          dot: 'bg-violet-400'
        };
      case 'Lejárt':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-300'
        };
      case 'Elutasítva':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dot: 'bg-rose-400'
        };
      case 'Karbantartás':
        return {
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          dot: 'bg-orange-400'
        };
      case 'Archivált':
      case 'Lezárva':
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          dot: 'bg-slate-400'
        };
    }
  };

  const { bg, dot } = getStyles();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${bg} ${sizeClasses} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};
