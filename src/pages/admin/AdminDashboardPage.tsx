import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  FolderGit2,
  Download,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Shield,
  Eye,
  Trash2,
  Tag,
  Mail,
  Gauge
} from 'lucide-react';
import { projectService, downloadService, requestService, promotionService, emailTemplateService } from '../../services/storage';
import { capacityService, getModeBadgeInfo } from '../../services/capacityService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProjectRequest, Project, Promotion } from '../../types';
import { RequestDetailModal } from '../../components/admin/RequestDetailModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

export const AdminDashboardPage: React.FC = () => {
  const [projects, setProjects] = useState(projectService.getAll(true));
  const [requests, setRequests] = useState(requestService.getAll());
  const [downloads, setDownloads] = useState(downloadService.getAll());
  const [promotions, setPromotions] = useState(promotionService.getAll(true));
  const [capacityState, setCapacityState] = useState(() => capacityService.getEffectiveState());
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setProjects(projectService.getAll(true));
      setRequests(requestService.getAll());
      setDownloads(downloadService.getAll());
      setPromotions(promotionService.getAll(true));
      setCapacityState(capacityService.getEffectiveState());
    };
    window.addEventListener('store_hl_studio_projects', handleUpdate);
    window.addEventListener('store_hl_studio_requests', handleUpdate);
    window.addEventListener('store_hl_studio_downloads', handleUpdate);
    window.addEventListener('store_hl_studio_promotions', handleUpdate);
    window.addEventListener('store_hl_studio_capacity', handleUpdate);
    window.addEventListener('hl_studio_remote_synced', handleUpdate);
    return () => {
      window.removeEventListener('store_hl_studio_projects', handleUpdate);
      window.removeEventListener('store_hl_studio_requests', handleUpdate);
      window.removeEventListener('store_hl_studio_downloads', handleUpdate);
      window.removeEventListener('store_hl_studio_promotions', handleUpdate);
      window.removeEventListener('store_hl_studio_capacity', handleUpdate);
      window.removeEventListener('hl_studio_remote_synced', handleUpdate);
    };
  }, []);

  const capBadge = getModeBadgeInfo(capacityState.effectiveMode);

  const newRequestsCount = requests.filter((r) => r.status === 'Új').length;
  const activePromotionsCount = promotionService.getActive().length;
  const inProgressProjects = projects.filter((p) => p.status === 'Fejlesztés alatt' || p.status === 'Tesztelés' || p.status === 'Tervezés alatt').length;
  const completedProjects = projects.filter((p) => p.status === 'Elkészült').length;
  const totalDownloads = downloads.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);

  const recentRequests = requests.slice(0, 5);

  const handleStatusChange = (id: string, status: any) => {
    requestService.updateStatus(id, status);
    setRequests(requestService.getAll());
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest({ ...selectedRequest, status });
    }
  };

  const handleNotesChange = (id: string, notes: string) => {
    requestService.updateNotes(id, notes);
    setRequests(requestService.getAll());
  };

  const handleConfirmDelete = () => {
    if (deletingRequest) {
      requestService.delete(deletingRequest.id);
      if (selectedRequest && selectedRequest.id === deletingRequest.id) {
        setSelectedRequest(null);
      }
      setDeletingRequest(null);
      setRequests(requestService.getAll());
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Vezérlőpult</h1>
          <p className="text-xs text-slate-400 mt-1">
            Áttekintés a beérkezett igényekről, aktív projektekről és letöltési statisztikákról.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/"
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-emerald-500/30"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Főoldal (Appban)</span>
          </Link>

          <Link
            to="/admin/projektkapacitas"
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors border ${capBadge.colorClass}`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>
              Kapacitás: {capBadge.emoji} {capBadge.shortLabel}
            </span>
          </Link>

          <Link
            to="/admin/email-sablonok"
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-purple-500/30"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-mail sablonok ({emailTemplateService.getAll().length})</span>
          </Link>

          <Link
            to="/admin/promociok"
            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-indigo-500/30"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promóciók ({activePromotionsCount})</span>
          </Link>

          <Link
            to="/admin/projektek"
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Projektek</span>
          </Link>

          <Link
            to="/admin/ajanlatkeresek"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Ajánlatkérések ({newRequestsCount})</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: New Requests */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Új Megkeresések</span>
            <span className="text-3xl font-extrabold font-display text-white tabular-nums">
              {newRequestsCount}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Összesen: {requests.length} db</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 2: In-Progress Projects */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Folyamatban lévő projektek</span>
            <span className="text-3xl font-extrabold font-display text-amber-400 tabular-nums">
              {inProgressProjects}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Fejlesztés / Tesztelés</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3: Completed Projects */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Elkészült projektek</span>
            <span className="text-3xl font-extrabold font-display text-emerald-400 tabular-nums">
              {completedProjects}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Összes projekt: {projects.length} db</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 4: Total Downloads */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Összes Letöltés</span>
            <span className="text-3xl font-extrabold font-display text-sky-400 tabular-nums">
              {totalDownloads}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">{downloads.length} aktív fájlcsomag</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Requests & Quick Projects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Requests */}
        <div className="lg:col-span-8 glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold font-display text-white">Legutóbbi Ajánlatkérések</h3>
            </div>
            <Link
              to="/admin/ajanlatkeresek"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Összes megtekintése</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {recentRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">Nincs rögzített megkeresés</div>
            ) : (
              recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 hover:bg-white/[0.02] flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate block">
                        {req.projectName}
                      </span>
                      {req.promotionTitle && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-700/30 px-1.5 py-0.5 rounded">
                          🎁 {req.promotionTitle.replace('🎁', '').trim()}
                        </span>
                      )}
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{req.name}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500">{req.projectType}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500 font-mono">
                        {new Date(req.createdAt).toLocaleDateString('hu-HU')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Megtekintés és AI elemzés"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingRequest({ id: req.id, title: req.projectName })}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Megkeresés törlése"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Studio Projects Summary */}
        <div className="lg:col-span-4 glass-panel rounded-2xl border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold font-display text-white">Stúdió Projektek</h3>
            <Link
              to="/admin/projektek"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Kezelés
            </Link>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-semibold text-white block truncate">{p.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono">v{p.version} · {p.isPublic ? 'Publikus' : 'Rejtett'}</span>
                </div>
                <StatusBadge status={p.status} size="sm" />
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/admin/projektek"
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Új projekt rögzítése</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          onTrackingUpdated={(updated) => {
            setSelectedRequest(updated);
            setRequests(requestService.getAll());
          }}
          onDelete={(id) => {
            requestService.delete(id);
            setSelectedRequest(null);
            setRequests(requestService.getAll());
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingRequest}
        title="Megkeresés törlése"
        message="Biztosan véglegesen törölni szeretnéd ezt a beérkezett projektmegkeresést?"
        itemName={deletingRequest?.title}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRequest(null)}
      />
    </div>
  );
};
