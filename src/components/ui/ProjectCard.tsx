import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ArrowRight, Layers } from 'lucide-react';
import { Project } from '../../types';
import { StatusBadge } from './StatusBadge';
import { downloadService, downloadFlowService } from '../../services/storage';
import { DownloadProcessModal } from './DownloadProcessModal';

interface ProjectCardProps {
  project: Project;
  onDownloadClick?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDownloadClick }) => {
  const [imageError, setImageError] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const downloadItems = downloadService.getForProject(project);
  const primaryDownload = downloadItems[0];
  const hasDownload =
    downloadItems.length > 0 &&
    (project.status === 'Elkészült' || Boolean(project.downloadUrl) || Boolean(project.downloadId));

  const flowConfig = downloadFlowService.resolveConfig(primaryDownload, project);

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDownloadClick) {
      onDownloadClick(project);
      return;
    }
    if (primaryDownload) {
      if (!flowConfig.enabled) {
        downloadService.incrementCount(primaryDownload.id);
        if (primaryDownload.fileUrl) {
          window.open(primaryDownload.fileUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      setIsDownloadModalOpen(true);
    }
  };

  return (
    <>
      <article className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col h-full border border-white/8 group">
        {/* Visual Cover */}
        <Link to={`/projektek/${project.slug}`} className="block relative aspect-video overflow-hidden bg-slate-900">
          {!imageError && project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-6 text-center">
              <Layers className="w-10 h-10 text-indigo-400 mb-2 opacity-60" />
              <span className="text-sm font-medium text-slate-300">{project.title}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-transparent to-transparent opacity-80 pointer-events-none" />

          <div className="absolute top-3 left-3 z-10">
            <StatusBadge status={project.status} size="sm" />
          </div>

          {project.version && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2 py-0.5 text-[11px] font-mono font-medium bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 rounded">
                v{project.version}
              </span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <Link to={`/projektek/${project.slug}`} className="block">
              <h3 className="text-lg font-bold font-display text-white group-hover:text-indigo-400 transition-colors">
                {project.title}
              </h3>
            </Link>
            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
              {project.shortDescription}
            </p>
          </div>

          {/* Technologies - Clean unboxed text with typographic separators */}
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 pt-1">
            {project.technologies.slice(0, 4).map((tech, idx) => (
              <React.Fragment key={tech}>
                <span className="text-slate-300">{tech}</span>
                {idx < Math.min(project.technologies.length, 4) - 1 && (
                  <span className="text-slate-600" aria-hidden="true">·</span>
                )}
              </React.Fragment>
            ))}
            {project.technologies.length > 4 && (
              <span className="text-slate-400">+{project.technologies.length - 4}</span>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
            <Link
              to={`/projektek/${project.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white group-hover:text-indigo-400 transition-colors"
            >
              <span>Részletek megtekintése</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>

            {hasDownload && primaryDownload && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                title="Letöltés indítása"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{flowConfig.buttonText || 'Letöltés'}</span>
              </button>
            )}

            {!hasDownload && project.status === 'Fejlesztés alatt' && (
              <span className="text-[11px] text-amber-400/80 italic">
                Fejlesztés alatt
              </span>
            )}
          </div>
        </div>
      </article>

      {primaryDownload && (
        <DownloadProcessModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          download={primaryDownload}
          project={project}
        />
      )}
    </>
  );
};
