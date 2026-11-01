import React, { useState } from 'react';
import { Download, Monitor, Apple, Terminal, Globe, Calendar, HardDrive, CheckCircle2 } from 'lucide-react';
import { Download as DownloadType, Project } from '../../types';
import { downloadService, downloadFlowService } from '../../services/storage';
import { DownloadProcessModal } from './DownloadProcessModal';

interface DownloadCardProps {
  download: DownloadType;
  project?: Project;
  projectDescription?: string;
  projectImageUrl?: string;
  onDownloaded?: () => void;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({
  download,
  project,
  projectDescription,
  onDownloaded
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [localCount, setLocalCount] = useState(download.downloadCount || 0);

  const flowConfig = downloadFlowService.resolveConfig(download, project);

  const getPlatformIcon = (platform: DownloadType['platform']) => {
    switch (platform) {
      case 'Windows':
        return <Monitor className="w-4 h-4 text-sky-400" />;
      case 'macOS':
        return <Apple className="w-4 h-4 text-slate-300" />;
      case 'Linux':
        return <Terminal className="w-4 h-4 text-amber-400" />;
      default:
        return <Globe className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handleDownloadClick = () => {
    if (!flowConfig.enabled) {
      // Fallback if admin explicitly disabled the animated flow
      downloadService.incrementCount(download.id);
      setLocalCount((c) => c + 1);
      setDownloaded(true);
      if (download.fileUrl && download.fileUrl.trim()) {
        const link = document.createElement('a');
        link.href = download.fileUrl;
        link.download = download.fileName;
        if (download.fileUrl.startsWith('http')) {
          link.target = '_blank';
          link.rel = 'noreferrer';
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      if (onDownloaded) onDownloaded();
      setTimeout(() => setDownloaded(false), 4000);
      return;
    }

    setIsModalOpen(true);
  };

  const handleComplete = () => {
    setLocalCount((c) => c + 1);
    setDownloaded(true);
    if (onDownloaded) onDownloaded();
    setTimeout(() => setDownloaded(false), 5000);
  };

  return (
    <>
      <div
        id={download.projectSlug}
        className="glass-panel glass-panel-hover rounded-2xl p-6 border border-white/8 flex flex-col justify-between h-full"
      >
        <div>
          {/* Header with platform and version */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
              {getPlatformIcon(download.platform)}
              <span>{download.platform}</span>
            </div>

            <span className="font-mono text-xs font-medium text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-700/30">
              v{download.version}
            </span>
          </div>

          {/* Title & info */}
          <h3 className="text-xl font-bold font-display text-white mb-2">
            {download.projectTitle}
          </h3>

          <p className="text-sm text-slate-400 mb-6 leading-relaxed line-clamp-2">
            {projectDescription || `${download.projectTitle} hivatalos telepítőfájl.`}
          </p>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5 mb-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>Fájlméret:</span>
              <span className="font-mono text-slate-200">{download.fileSize}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Kiadás:</span>
              <span className="font-mono text-slate-200">{download.releaseDate}</span>
            </div>
          </div>

          {download.changelog && (
            <div className="mb-6 p-3 rounded-lg bg-black/30 border border-white/5 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block mb-1">Újdonságok:</span>
              <p className="line-clamp-2">{download.changelog}</p>
            </div>
          )}
        </div>

        {/* Download Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDownloadClick}
            className={`w-full py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              downloaded
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 hover:shadow-indigo-600/30'
            }`}
          >
            {isModalOpen ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{flowConfig.downloadingButtonText || 'Előkészítés folyamatban...'}</span>
              </>
            ) : downloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{flowConfig.completedButtonText || 'Letöltés elindult!'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  {flowConfig.buttonText || 'Letöltés'} ({download.fileName})
                </span>
              </>
            )}
          </button>

          <div className="mt-2 text-center">
            <span className="text-[11px] text-slate-500 font-mono">
              {localCount} sikeres letöltés eddig
            </span>
          </div>
        </div>
      </div>

      <DownloadProcessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        download={download}
        project={project}
        onDownloadComplete={handleComplete}
      />
    </>
  );
};
