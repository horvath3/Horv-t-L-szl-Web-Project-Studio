import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Globe,
  Lock,
  Layers,
  ExternalLink
} from 'lucide-react';
import { Project, ProjectStatus } from '../../types';
import { projectService } from '../../services/storage';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProjectEditModal } from '../../components/admin/ProjectEditModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState(projectService.getAll(true));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingProject, setEditingProject] = useState<Project | null | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<{ id: string; title: string } | null>(null);

  const reload = () => setProjects(projectService.getAll(true));

  useEffect(() => {
    window.addEventListener('store_hl_studio_projects', reload);
    return () => window.removeEventListener('store_hl_studio_projects', reload);
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.technologies.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateNew = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (proj: Project) => {
    setEditingProject(proj);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingProject) {
      projectService.delete(deletingProject.id);
      setDeletingProject(null);
      reload();
    }
  };

  const handleTogglePublish = (id: string) => {
    projectService.togglePublish(id);
    reload();
  };

  const handleSave = (saved: Project) => {
    projectService.save(saved);
    reload();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Projektek Kezelése</h1>
          <p className="text-xs text-slate-400 mt-1">
            Összesen {projects.length} rögzített projekt ({projects.filter((p) => p.isPublic).length} publikus).
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Új projekt hozzáadása</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Keresés név, slug vagy technológia alapján..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Státusz szűrő:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all" className="bg-slate-900">Összes státusz</option>
            <option value="Elkészült" className="bg-slate-900">Elkészült</option>
            <option value="Fejlesztés alatt" className="bg-slate-900">Fejlesztés alatt</option>
            <option value="Tesztelés" className="bg-slate-900">Tesztelés</option>
            <option value="Tervezés alatt" className="bg-slate-900">Tervezés alatt</option>
            <option value="Karbantartás" className="bg-slate-900">Karbantartás</option>
            <option value="Archivált" className="bg-slate-900">Archivált</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Projekt & Slug</th>
                <th className="py-3 px-4">Státusz</th>
                <th className="py-3 px-4">Láthatóság</th>
                <th className="py-3 px-4">Verzió</th>
                <th className="py-3 px-4">Technológiák</th>
                <th className="py-3 px-4 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Nem található a feltételeknek megfelelő projekt.
                  </td>
                </tr>
              ) : (
                filtered.map((proj) => (
                  <tr key={proj.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                          <img
                            src={proj.imageUrl}
                            alt={proj.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-white block">{proj.title}</span>
                          <span className="font-mono text-[11px] text-slate-400">/{proj.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={proj.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(proj.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                          proj.isPublic
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
                        }`}
                        title={proj.isPublic ? 'Kattints az elrejtéshez' : 'Kattints a publikáláshoz'}
                      >
                        {proj.isPublic ? (
                          <>
                            <Globe className="w-3 h-3" />
                            <span>Publikus</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Rejtett</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      v{proj.version}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {proj.technologies.join(', ')}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {proj.isPublic && (
                          <a
                            href={`/projektek/${proj.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="Publikus megtekintés"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => handleEdit(proj)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition-colors cursor-pointer"
                          title="Szerkesztés"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingProject({ id: proj.id, title: proj.title })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Törlés"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <ProjectEditModal
        project={editingProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingProject}
        title="Projekt törlése"
        message="Biztosan véglegesen törölni szeretnéd ezt a projektet a rendszerből?"
        itemName={deletingProject?.title}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProject(null)}
      />
    </div>
  );
};
