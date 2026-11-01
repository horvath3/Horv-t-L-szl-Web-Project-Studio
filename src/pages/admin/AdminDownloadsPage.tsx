import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sliders,
  Play,
  Save
} from 'lucide-react';
import { Download as DownloadType, DownloadFlowConfig } from '../../types';
import { downloadService, downloadFlowService } from '../../services/storage';
import { DownloadEditModal } from '../../components/admin/DownloadEditModal';
import { DownloadFlowConfigEditor } from '../../components/admin/DownloadFlowConfigEditor';
import { DownloadProcessModal } from '../../components/ui/DownloadProcessModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

export const AdminDownloadsPage: React.FC = () => {
  const [downloads, setDownloads] = useState(downloadService.getAll());
  const [editingDownload, setEditingDownload] = useState<DownloadType | null | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ id: string; fileName: string } | null>(null);

  const [showGlobalFlowPanel, setShowGlobalFlowPanel] = useState(false);
  const [globalFlowConfig, setGlobalFlowConfig] = useState<DownloadFlowConfig>(
    downloadFlowService.getGlobalConfig()
  );
  const [globalSavedToast, setGlobalSavedToast] = useState(false);
  const [testingDownload, setTestingDownload] = useState<DownloadType | null>(null);

  const reload = () => {
    setDownloads(downloadService.getAll());
    setGlobalFlowConfig(downloadFlowService.getGlobalConfig());
  };

  useEffect(() => {
    window.addEventListener('store_hl_studio_downloads', reload);
    window.addEventListener('store_hl_studio_download_flow_config', reload);
    return () => {
      window.removeEventListener('store_hl_studio_downloads', reload);
      window.removeEventListener('store_hl_studio_download_flow_config', reload);
    };
  }, []);

  const handleCreateNew = () => {
    setEditingDownload(null);
    setIsModalOpen(true);
  };

  const handleEdit = (dl: DownloadType) => {
    setEditingDownload(dl);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      downloadService.delete(deletingItem.id);
      setDeletingItem(null);
      reload();
    }
  };

  const handleToggleActive = (dl: DownloadType) => {
    downloadService.save({ ...dl, isActive: !dl.isActive });
    reload();
  };

  const handleSave = (saved: DownloadType) => {
    downloadService.save(saved);
    reload();
  };

  const handleSaveGlobalFlow = () => {
    downloadFlowService.saveGlobalConfig(globalFlowConfig);
    setGlobalSavedToast(true);
    setTimeout(() => setGlobalSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">
            Letölthető Fájlok & Státuszvonal Kezelése
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Itt kezelheted a letölthető csomagokat, és teljesen testreszabhatod a Letöltés gombra kattintva megjelenő 10 lépéses animált státuszvonalat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGlobalFlowPanel((v) => !v)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border ${
              showGlobalFlowPanel
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/25'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>
              {showGlobalFlowPanel
                ? 'Státuszvonal Testreszabó Bezárása'
                : 'Státuszvonal & 10 Feladat Globális Testreszabása'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Új letöltés hozzáadása</span>
          </button>
        </div>
      </div>

      {/* Global Download Flow Customizer Panel */}
      {showGlobalFlowPanel && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-indigo-500/30 space-y-4">
          <DownloadFlowConfigEditor
            config={globalFlowConfig}
            onChange={setGlobalFlowConfig}
            isGlobal={true}
            sampleDownload={downloads[0]}
          />

          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs">
              {globalSavedToast && (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Globális letöltési státuszvonal és feladatlista sikeresen elmentve!</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveGlobalFlow}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Globális Státuszvonal Beállítások Mentése</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Projekt & Fájlnév</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Verzió & Méret</th>
                <th className="py-3 px-4">Státuszvonal Folyamat</th>
                <th className="py-3 px-4">Letöltések</th>
                <th className="py-3 px-4">Státusz</th>
                <th className="py-3 px-4 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {downloads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Nincs rögzített letölthető fájl.
                  </td>
                </tr>
              ) : (
                downloads.map((dl) => {
                  const resolvedCfg = downloadFlowService.resolveConfig(dl);
                  const isCustom = !!dl.flowConfig?.useCustomConfig;

                  return (
                    <tr key={dl.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{dl.projectTitle}</span>
                        <span className="font-mono text-[11px] text-slate-400">{dl.fileName}</span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {dl.platform}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        v{dl.version} ({dl.fileSize})
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              isCustom
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                            }`}
                          >
                            {isCustom ? 'Egyedi' : 'Globális'} ({resolvedCfg.steps.length} feladat •{' '}
                            {resolvedCfg.totalDurationSeconds} mp)
                          </span>
                          <button
                            type="button"
                            onClick={() => setTestingDownload(dl)}
                            className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Letöltési státuszvonal élő tesztelése"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Teszt</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300 tabular-nums">
                        {dl.downloadCount || 0} db
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(dl)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                            dl.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                          title={dl.isActive ? 'Kattints a letiltáshoz' : 'Kattints az aktiváláshoz'}
                        >
                          {dl.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktív</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inaktív</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={dl.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="Fájl megnyitása / ellenőrzése"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => handleEdit(dl)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition-colors cursor-pointer"
                            title="Szerkesztés & Státuszvonal testreszabása"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingItem({ id: dl.id, fileName: dl.fileName })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Törlés"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <DownloadEditModal
        download={editingDownload}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Live Test Modal */}
      {testingDownload && (
        <DownloadProcessModal
          isOpen={!!testingDownload}
          onClose={() => setTestingDownload(null)}
          download={testingDownload}
          isPreviewMode={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingItem}
        title="Letöltés törlése"
        message="Biztosan véglegesen törölni szeretnéd ezt a letölthető fájlt a rendszerből?"
        itemName={deletingItem?.fileName}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
};
