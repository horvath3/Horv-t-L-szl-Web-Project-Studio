import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Layers,
  HardDrive,
  Github,
  ExternalLink,
  Clock
} from 'lucide-react';
import { Download as DownloadType } from '../types';
import { projectService, downloadService, downloadFlowService } from '../services/storage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DownloadProcessModal } from '../components/ui/DownloadProcessModal';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedDownload, setSelectedDownload] = useState<DownloadType | null>(null);

  const project = slug ? projectService.getBySlug(slug) : undefined;

  if (!project) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center text-center px-4">
        <div className="glass-panel rounded-3xl p-12 max-w-lg border border-white/10 space-y-4">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-2xl font-bold font-display text-white">
            A keresett projekt nem található
          </h2>
          <p className="text-sm text-slate-400">
            Lehetséges, hogy a projekt neve megváltozott, vagy még nem publikus.
          </p>
          <Link
            to="/projektek"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-indigo-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vissza a projektekhez</span>
          </Link>
        </div>
      </div>
    );
  }

  const downloads = downloadService.getForProject(project);
  const hasActiveDownload =
    downloads.length > 0 &&
    (project.status === 'Elkészült' || Boolean(project.downloadUrl) || Boolean(project.downloadId));

  const handleDownloadTrigger = (dl: DownloadType) => {
    const cfg = downloadFlowService.resolveConfig(dl, project);
    if (!cfg.enabled) {
      downloadService.incrementCount(dl.id);
      if (dl.fileUrl) {
        window.open(dl.fileUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    setSelectedDownload(dl);
  };

  return (
    <div className="relative min-h-screen pt-14 sm:pt-20 lg:pt-24 pb-20">
      <div className="ambient-glow-indigo top-20 left-10" />
      <div className="ambient-glow-purple bottom-20 right-10" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Back */}
        <div className="mb-8">
          <Link
            to="/projektek"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vissza a portfólióhoz</span>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={project.status} size="md" />
            {project.version && (
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-black/50 border border-white/10 text-slate-300">
                v{project.version}
              </span>
            )}
            <span className="text-xs text-slate-500">
              Frissítve: {new Date(project.updatedAt).toLocaleDateString('hu-HU')}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            {project.title}
          </h1>

          <p className="text-lg text-slate-300 max-w-3xl leading-relaxed">
            {project.shortDescription}
          </p>
        </div>

        {/* Large Showcase Visual */}
        <div className="relative aspect-video sm:aspect-[21/9] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl mb-12 bg-slate-900 group">
          <img
            src={project.imageUrl}
            alt={project.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-black/20 to-transparent opacity-80" />
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Detailed Description */}
            <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/8 space-y-4">
              <h2 className="text-xl font-bold font-display text-white">
                A projektről részletesen
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line">
                {project.detailedDescription}
              </p>
            </div>

            {/* Features */}
            {project.features && project.features.length > 0 && (
              <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/8 space-y-6">
                <h3 className="text-xl font-bold font-display text-white">
                  Főbb funkciók & Képességek
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gallery if present */}
            {project.gallery && project.gallery.length > 1 && (
              <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/8 space-y-6">
                <h3 className="text-xl font-bold font-display text-white">
                  Képgaléria
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.gallery.map((imgUrl, i) => (
                    <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                      <img src={imgUrl} alt={`${project.title} screenshot ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Download or Status Action Card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 sticky top-28 space-y-6 shadow-xl">
              <h3 className="text-base font-bold font-display text-white">
                Elérhetőség & Letöltés
              </h3>

              {hasActiveDownload ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <span className="font-semibold block mb-1">A program elérhető és letölthető!</span>
                    <p className="text-emerald-400/80">Közvetlen asztali telepítő vagy hordozható archívum.</p>
                  </div>

                  {downloads.map((dl) => {
                    const cfg = downloadFlowService.resolveConfig(dl, project);
                    return (
                      <div key={dl.id} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadTrigger(dl)}
                          className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>
                            {cfg.buttonText || 'Letöltés'} ({dl.platform})
                          </span>
                        </button>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-slate-500" />
                            <span>{dl.fileSize}</span>
                          </span>
                          <span>v{dl.version}</span>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2 text-center">
                    <Link
                      to="/letoltesek"
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Összes letölthető verzió megtekintése →
                    </Link>
                  </div>
                </div>
              ) : project.status === 'Fejlesztés alatt' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>A projekt jelenleg fejlesztés alatt áll.</span>
                    </div>
                    <p className="text-amber-400/80 leading-relaxed">
                      Jelenleg a belső architektúra és funkciótesztek zajlanak. A letöltési csomag a béta fázis lezárása után válik elérhetővé.
                    </p>
                  </div>

                  <Link
                    to="/projekt-igeny"
                    className="w-full py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Hasonló projektet szeretnék</span>
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 text-xs text-slate-400">
                  <span>Ehhez a projekthez jelenleg nincs közvetlenül elérhető letöltési csomag.</span>
                </div>
              )}

              {/* Technologies */}
              <div className="pt-4 border-t border-white/5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Alkalmazott Technológiák
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-md bg-black/40 border border-white/10 text-xs text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links */}
              {(project.githubUrl || project.liveUrl) && (
                <div className="pt-4 border-t border-white/5 space-y-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Github className="w-3.5 h-3.5" />
                        <span>Forráskód (GitHub)</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Élő Demó</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedDownload && (
        <DownloadProcessModal
          isOpen={!!selectedDownload}
          onClose={() => setSelectedDownload(null)}
          download={selectedDownload}
          project={project}
        />
      )}
    </div>
  );
};
