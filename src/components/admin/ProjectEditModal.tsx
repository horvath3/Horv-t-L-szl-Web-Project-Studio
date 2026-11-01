import React, { useState } from 'react';
import { X, Save, Trash2, Layers, Download as DownloadIcon, Sliders, Upload } from 'lucide-react';
import { Project, ProjectStatus, DownloadFlowConfig } from '../../types';
import { uploadImageFile } from '../../services/imageUploadService';
import {
  downloadService,
  downloadFlowService,
  DEFAULT_DOWNLOAD_FLOW_CONFIG,
  createDefaultDownloadSteps
} from '../../services/storage';
import { DownloadFlowConfigEditor } from './DownloadFlowConfigEditor';

interface ProjectEditModalProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
}

const STATUS_OPTIONS: ProjectStatus[] = [
  'Tervezés alatt',
  'Fejlesztés alatt',
  'Tesztelés',
  'Elkészült',
  'Karbantartás',
  'Archivált'
];

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const existingDownloads = project ? downloadService.getForProject(project) : [];
  const linkedDl = existingDownloads[0];
  const globalCfg = downloadFlowService.getGlobalConfig();

  const [activeTab, setActiveTab] = useState<'general' | 'download'>('general');

  const [formData, setFormData] = useState<Project>({
    id: project?.id || `proj-${Date.now()}`,
    slug: project?.slug || '',
    title: project?.title || '',
    shortDescription: project?.shortDescription || '',
    detailedDescription: project?.detailedDescription || '',
    status: project?.status || 'Elkészült',
    isPublic: project ? project.isPublic : true,
    category: project?.category || 'software',
    featured: project?.featured ?? true,
    version: project?.version || '1.0.0',
    imageUrl: project?.imageUrl || '/src/assets/images/studio_hero_visual_1790358021032.jpg',
    gallery: project?.gallery || [],
    technologies: project?.technologies || ['React', 'TypeScript'],
    features: project?.features || ['Modern felhasználói felület'],
    downloadId: project?.downloadId || linkedDl?.id || '',
    downloadUrl: project?.downloadUrl || linkedDl?.fileUrl || '',
    downloadFileName: project?.downloadFileName || linkedDl?.fileName || '',
    downloadFileSize: project?.downloadFileSize || linkedDl?.fileSize || '45 MB',
    downloadPlatform: project?.downloadPlatform || linkedDl?.platform || 'Windows',
    flowConfig:
      project?.flowConfig ||
      linkedDl?.flowConfig || {
        ...DEFAULT_DOWNLOAD_FLOW_CONFIG,
        ...globalCfg,
        useCustomConfig: false,
        steps:
          globalCfg.steps && globalCfg.steps.length > 0
            ? globalCfg.steps.map((s) => ({ ...s }))
            : createDefaultDownloadSteps()
      },
    githubUrl: project?.githubUrl || '',
    liveUrl: project?.liveUrl || '',
    createdAt: project?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [techInput, setTechInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const result = await uploadImageFile(file, 'proj');
      if (result.ok && result.url) {
        setFormData((prev) => ({ ...prev, imageUrl: result.url! }));
      } else {
        alert(result.error || 'Hiba a kép feltöltése során');
      }
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó|ö|ő/g, 'o')
      .replace(/ú|ü|ű/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug === '' || prev.slug === generateSlug(prev.title) ? generateSlug(title) : prev.slug
    }));
  };

  const addTech = () => {
    if (!techInput.trim()) return;
    if (!formData.technologies.includes(techInput.trim())) {
      setFormData({
        ...formData,
        technologies: [...formData.technologies, techInput.trim()]
      });
    }
    setTechInput('');
  };

  const removeTech = (item: string) => {
    setFormData({
      ...formData,
      technologies: formData.technologies.filter((t) => t !== item)
    });
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFormData({
      ...formData,
      features: [...formData.features, featureInput.trim()]
    });
    setFeatureInput('');
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const handleFlowChange = (updatedFlow: DownloadFlowConfig) => {
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
              {project ? 'Projekt & Letöltés Szerkesztése' : 'Új Projekt Létrehozása'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Állítsd be a projekt részleteit, a letölthető fájlt és a 10 lépéses animált státuszvonalat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-black/50 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1. Projekt Adatok</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('download')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'download'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>2. Letöltés Gomb & Státuszvonal</span>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {activeTab === 'general' ? (
            <div className="space-y-5">
              {/* Row 1: Title and Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Projekt neve *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="Pl. ConvertFlow Desktop"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="convertflow-desktop"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Status, Version, Category, Public */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Státusz *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-slate-900 text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Verzió
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kategória
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="web" className="bg-slate-900">🌐 Weboldal</option>
                    <option value="app" className="bg-slate-900">🌐 Webalkalmazás</option>
                    <option value="software" className="bg-slate-900">💻 Egyedi szoftver</option>
                    <option value="ai" className="bg-slate-900">🤖 AI projekt</option>
                    <option value="game" className="bg-slate-900">🎮 Játékprojekt</option>
                    <option value="mobile" className="bg-slate-900">📱 Mobilalkalmazás</option>
                    <option value="other" className="bg-slate-900">🧩 Egyéb projekt</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-300">Publikus az oldalon</span>
                  </label>
                </div>
              </div>

              {/* Image URL & Preview */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Főkép URL / elérési út
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="/uploads/... vagy https://..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-3 py-2.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Feltöltés...' : 'Feltöltés'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImage}
                      className="hidden"
                      onChange={handleProjectImageUpload}
                    />
                  </label>
                  {formData.imageUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-900">
                      <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rövid leírás * (Kártyákon megjelenő összefoglaló)
                </label>
                <input
                  type="text"
                  required
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Modern asztali videókonvertáló és tömörítő alkalmazás."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Részletes leírás * (Projekt aloldal)
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.detailedDescription}
                  onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Technológiák
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.technologies.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTech(t)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Pl. React, TypeScript, Electron, Unity, C#..."
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTech();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addTech}
                    className="px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/15"
                  >
                    Hozzáadás
                  </button>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Főbb funkciók listája
                </label>
                <div className="space-y-1.5 mb-2">
                  {formData.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 text-xs text-slate-300">
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Új funkció hozzáadása..."
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/15"
                  >
                    Hozzáadás
                  </button>
                </div>
              </div>

              {/* External links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GitHub Repository URL (opcionális)
                  </label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Élő demó URL (opcionális)
                  </label>
                  <input
                    type="url"
                    value={formData.liveUrl}
                    onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Quick card to jump to Download & Status Line Configuration */}
              <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Letölthető Csomag & 10 Lépéses Animált Státuszvonal
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {formData.downloadUrl
                      ? `Letöltés beállítva (${formData.downloadFileName || 'telepítő'}) — automatikusan megjelenik a Letöltés gomb és a státuszvonal.`
                      : 'Adj meg letöltési URL-t, hogy a projektnél és a Letöltések oldalon is megjelenjen az animált Letöltés gomb!'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('download')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Letöltés & Státuszvonal Beállítása →</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Direct Project Download Setup */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Projekt Letöltési Fájl Beállítása
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ha itt megadsz egy letöltési URL-t, a projekt automatikusan kap egy Letöltés gombot a kártyáján, a projekt aloldalán és a Letöltések (/letoltesek) oldalon is.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Letöltési URL (ha letölthető a projekt)
                    </label>
                    <input
                      type="text"
                      value={formData.downloadUrl || ''}
                      onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                      placeholder="Pl. https://github.com/.../release.zip vagy /downloads/Program_Setup.exe"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Fájlnév (megjelenő név)
                    </label>
                    <input
                      type="text"
                      value={formData.downloadFileName || ''}
                      onChange={(e) => setFormData({ ...formData, downloadFileName: e.target.value })}
                      placeholder={
                        formData.slug
                          ? `${formData.slug.replace(/-/g, '_')}_v${formData.version || '1.0.0'}.zip`
                          : 'Telepito_v1.0.0.exe'
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Platform
                      </label>
                      <select
                        value={formData.downloadPlatform || 'Windows'}
                        onChange={(e) =>
                          setFormData({ ...formData, downloadPlatform: e.target.value as any })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                      >
                        <option value="Windows">Windows</option>
                        <option value="macOS">macOS</option>
                        <option value="Linux">Linux</option>
                        <option value="Cross-platform">Cross-platform</option>
                        <option value="Web">Web</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Fájlméret
                      </label>
                      <input
                        type="text"
                        value={formData.downloadFileSize || ''}
                        onChange={(e) => setFormData({ ...formData, downloadFileSize: e.target.value })}
                        placeholder="64.5 MB"
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Full 10-step Status Line Flow Configurator for this project */}
              <DownloadFlowConfigEditor
                config={
                  formData.flowConfig || {
                    ...globalCfg,
                    useCustomConfig: false
                  }
                }
                onChange={handleFlowChange}
                isGlobal={false}
                sampleDownload={{
                  projectTitle: formData.title || 'Új Projekt',
                  fileName:
                    formData.downloadFileName ||
                    `${(formData.slug || 'projekt').replace(/-/g, '_')}_v${formData.version || '1.0.0'}.zip`,
                  fileSize: formData.downloadFileSize || '45 MB',
                  platform: formData.downloadPlatform || 'Windows',
                  version: formData.version || '1.0.0'
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {activeTab === 'download' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  ← Vissza a projekt adataihoz
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
