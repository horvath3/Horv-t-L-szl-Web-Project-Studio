import React, { useState } from 'react';
import { X, Save, FileDown, Sliders } from 'lucide-react';
import { Download, DownloadFlowConfig } from '../../types';
import {
  projectService,
  downloadFlowService,
  DEFAULT_DOWNLOAD_FLOW_CONFIG,
  createDefaultDownloadSteps
} from '../../services/storage';
import { DownloadFlowConfigEditor } from './DownloadFlowConfigEditor';

interface DownloadEditModalProps {
  download?: Download | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (download: Download) => void;
}

export const DownloadEditModal: React.FC<DownloadEditModalProps> = ({
  download,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const projects = projectService.getAll(true);
  const globalCfg = downloadFlowService.getGlobalConfig();

  const [activeSection, setActiveSection] = useState<'details' | 'flow'>('details');

  const [formData, setFormData] = useState<Download>({
    id: download?.id || `dl-${Date.now()}`,
    projectId: download?.projectId || (projects[0]?.id || ''),
    projectSlug: download?.projectSlug || (projects[0]?.slug || ''),
    projectTitle: download?.projectTitle || (projects[0]?.title || ''),
    fileName: download?.fileName || '',
    fileUrl: download?.fileUrl || '',
    version: download?.version || '1.0.0',
    platform: download?.platform || 'Windows',
    fileSize: download?.fileSize || '45 MB',
    releaseDate: download?.releaseDate || new Date().toISOString().split('T')[0],
    isActive: download ? download.isActive : true,
    downloadCount: download?.downloadCount || 0,
    changelog: download?.changelog || '',
    flowConfig: download?.flowConfig || {
      ...DEFAULT_DOWNLOAD_FLOW_CONFIG,
      ...globalCfg,
      useCustomConfig: false,
      steps:
        globalCfg.steps && globalCfg.steps.length > 0
          ? globalCfg.steps.map((s) => ({ ...s }))
          : createDefaultDownloadSteps()
    }
  });

  const handleProjectSelect = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setFormData((prev) => ({
        ...prev,
        projectId: proj.id,
        projectSlug: proj.slug,
        projectTitle: proj.title,
        version: proj.version || prev.version,
        fileName:
          prev.fileName ||
          `${proj.slug.replace(/-/g, '_')}_v${proj.version || '1.0.0'}.zip`
      }));
    }
  };

  const handleFlowConfigChange = (updatedFlow: DownloadFlowConfig) => {
    setFormData((prev) => ({
      ...prev,
      flowConfig: updatedFlow
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel rounded-2xl border border-white/10 w-full max-w-4xl my-8 overflow-hidden shadow-2xl">
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-display text-white">
              {download ? 'Letöltés & Státuszvonal Szerkesztése' : 'Új Letölthető Fájl & Folyamat Hozzáadása'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Állítsd be a letölthető csomag adatait és szabd testre a 10 lépéses animált státuszvonalat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-black/50 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveSection('details')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeSection === 'details'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>1. Fájl Adatok</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('flow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeSection === 'flow'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>2. Státuszvonal & 10 Feladat Testreszabása</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {activeSection === 'details' ? (
            <div className="space-y-4">
              {/* Project selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kapcsolódó projekt *
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.title} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Name & Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fájlnév *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    placeholder="Pl. ConvertFlow_Setup_1.2.4.exe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Platform *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Windows" className="bg-slate-900">Windows</option>
                    <option value="macOS" className="bg-slate-900">macOS</option>
                    <option value="Linux" className="bg-slate-900">Linux</option>
                    <option value="Cross-platform" className="bg-slate-900">Cross-platform</option>
                    <option value="Web" className="bg-slate-900">Web</option>
                  </select>
                </div>
              </div>

              {/* Download URL */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Fájl / Letöltési URL *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://github.com/.../releases/download/... vagy /downloads/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Version, Size, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Verzió
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.2.4"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fájlméret
                  </label>
                  <input
                    type="text"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    placeholder="74.2 MB"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kiadás dátuma
                  </label>
                  <input
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Changelog */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Újdonságok / Változásjegyzék
                </label>
                <textarea
                  rows={3}
                  value={formData.changelog}
                  onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
                  placeholder="Új funkciók, javítások..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              {/* Quick card to jump to Status Line / 10-step Flow Customization */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Animált Státuszvonal & 10 Lépéses Ellenőrző Folyamat
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {formData.flowConfig?.useCustomConfig
                      ? `Egyedi beállítás aktív (${formData.flowConfig.steps.length} feladat, ${formData.flowConfig.totalDurationSeconds} mp)`
                      : `Globális alapértelmezett folyamat (${globalCfg.steps.length} feladat, ${globalCfg.totalDurationSeconds} mp)`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('flow')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Státuszvonal & Feladatok Testreszabása →</span>
                </button>
              </div>

              {/* Active status */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-200">
                    Letöltés aktív (megjelenik a publikus Letöltések oldalon és a projektnél)
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <DownloadFlowConfigEditor
              config={
                formData.flowConfig || {
                  ...globalCfg,
                  useCustomConfig: false
                }
              }
              onChange={handleFlowConfigChange}
              isGlobal={false}
              sampleDownload={formData}
            />
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {activeSection === 'flow' && (
                <button
                  type="button"
                  onClick={() => setActiveSection('details')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  ← Vissza a fájl alapadataihoz
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Mentés</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
