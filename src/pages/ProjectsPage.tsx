import React, { useState, useEffect } from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { ProjectCard } from '../components/ui/ProjectCard';
import { projectService } from '../services/storage';

export const ProjectsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'software' | 'web' | 'ai'>('all');
  const [allPublicProjects, setAllPublicProjects] = useState(() => projectService.getAll());

  useEffect(() => {
    const reload = () => setAllPublicProjects(projectService.getAll());
    window.addEventListener('store_hl_studio_projects', reload);
    window.addEventListener('hl_studio_remote_synced', reload);
    return () => {
      window.removeEventListener('store_hl_studio_projects', reload);
      window.removeEventListener('hl_studio_remote_synced', reload);
    };
  }, []);

  const filteredProjects = allPublicProjects.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'software') return p.category === 'software';
    if (filter === 'web') return p.category === 'web' || p.category === 'app';
    if (filter === 'ai') return p.category === 'ai';
    return true;
  });

  return (
    <div className="relative min-h-screen pt-14 sm:pt-20 lg:pt-24 pb-20">
      <div className="ambient-glow-indigo top-20 left-10" />
      <div className="ambient-glow-purple bottom-20 right-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Portfólió
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
              Projektek & Fejlesztések
            </h1>
            <p className="text-base text-slate-300 mt-3 leading-relaxed">
              Válogatás a saját készítésű asztali szoftverekből, webalkalmazásokból és jelenleg fejlesztés alatt álló rendszerekből.
            </p>
          </div>

          {/* Interactive filter tabs (functional buttons with click handlers) */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-black/40 border border-white/10 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Összes ({allPublicProjects.length})
            </button>
            <button
              onClick={() => setFilter('software')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === 'software'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Asztali szoftverek
            </button>
            <button
              onClick={() => setFilter('ai')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === 'ai'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AI & Intelligens
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center border border-white/5 max-w-md mx-auto">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Ebben a kategóriában jelenleg nincs projekt</h3>
            <p className="text-xs text-slate-400">Válassz egy másik szűrőt vagy tekintsd meg az összes projektet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
