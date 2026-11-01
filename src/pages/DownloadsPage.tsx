import React, { useState, useEffect } from 'react';
import { Download as DownloadIcon, ShieldCheck, AlertCircle } from 'lucide-react';
import { DownloadCard } from '../components/ui/DownloadCard';
import { downloadService, projectService } from '../services/storage';

export const DownloadsPage: React.FC = () => {
  const [downloads, setDownloads] = useState(() => downloadService.getAll(true));
  const [projects, setProjects] = useState(() => projectService.getAll());

  useEffect(() => {
    const reload = () => {
      setDownloads(downloadService.getAll(true));
      setProjects(projectService.getAll());
    };
    window.addEventListener('store_hl_studio_downloads', reload);
    window.addEventListener('store_hl_studio_projects', reload);
    window.addEventListener('hl_studio_remote_synced', reload);
    return () => {
      window.removeEventListener('store_hl_studio_downloads', reload);
      window.removeEventListener('store_hl_studio_projects', reload);
      window.removeEventListener('hl_studio_remote_synced', reload);
    };
  }, []);

  return (
    <div className="relative min-h-screen pt-14 sm:pt-20 lg:pt-24 pb-20">
      <div className="ambient-glow-indigo top-20 right-10" />
      <div className="ambient-glow-purple bottom-20 left-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Szoftverközpont & Letöltések
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Szoftverek & Letöltések
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
            Hivatalos asztali alkalmazások, segédprogramok és saját fejlesztésű eszközök közvetlen, biztonságos letöltése.
          </p>
        </div>

        {/* Security / Verification Trust note */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/8 mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Biztonságos & Tiszta Telepítők</span>
              <p className="text-xs text-slate-400">
                Minden csomag kártékony kódoktól, reklámprogramoktól mentes, közvetlenül a stúdió saját forráskódjából épített release.
              </p>
            </div>
          </div>
        </div>

        {/* Downloads Grid */}
        {downloads.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center border border-white/5 max-w-md mx-auto">
            <DownloadIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Jelenleg nincs aktív letölthető fájl</h3>
            <p className="text-xs text-slate-400">Nézz vissza később, vagy tekintsd meg a folyamatban lévő projekteket.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {downloads.map((dl) => {
              const proj = projects.find((p) => p.id === dl.projectId || p.slug === dl.projectSlug);
              return (
                <DownloadCard
                  key={dl.id}
                  download={dl}
                  project={proj}
                  projectDescription={proj?.shortDescription}
                  projectImageUrl={proj?.imageUrl}
                />
              );
            })}
          </div>
        )}

        {/* In-development info banner for Gaming Assistant */}
        <div className="mt-16 glass-panel rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300">
              Fejlesztés alatt álló projektek (pl. Gaming Assistant)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              A jelenleg aktív fejlesztés alatt álló programok és béta verziók addig nem jelennek meg a letöltések között, amíg a stabil build el nem készül és a belső tesztek sikeresen le nem zárulnak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
