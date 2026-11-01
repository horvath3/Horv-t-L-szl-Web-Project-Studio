import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock,
  Layers,
  Inbox,
  AlertCircle,
  Megaphone
} from 'lucide-react';
import { Promotion, PromotionStatus } from '../../types';
import {
  promotionService,
  getPromotionStatus,
  getProjectCategoryEmoji,
  formatHungarianDate
} from '../../services/storage';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PromotionEditModal } from '../../components/admin/PromotionEditModal';
import { PromotionPreviewModal } from '../../components/admin/PromotionPreviewModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

export const AdminPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>(promotionService.getAll(true));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewPromo, setPreviewPromo] = useState<Promotion | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<{ id: string; title: string } | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const reload = () => {
    setPromotions(promotionService.getAll(true));
  };

  useEffect(() => {
    window.addEventListener('store_hl_studio_promotions', reload);
    window.addEventListener('store_hl_studio_requests', reload);
    return () => {
      window.removeEventListener('store_hl_studio_promotions', reload);
      window.removeEventListener('store_hl_studio_requests', reload);
    };
  }, []);

  const filtered = promotions.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.shortTitle?.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q);

    const timingStatus = getPromotionStatus(p);
    const matchesStatus = statusFilter === 'all' || timingStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleToggleActive = (id: string) => {
    promotionService.toggleActive(id);
    reload();
  };

  const handleToggleArchive = (id: string) => {
    promotionService.toggleArchive(id);
    reload();
  };

  const handleConfirmDelete = () => {
    if (deletingPromo) {
      promotionService.delete(deletingPromo.id);
      setDeletingPromo(null);
      reload();
    }
  };

  const handleCopyLink = async (slug: string) => {
    const url = `${window.location.origin}/ajanlat/${slug}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      // fallback
    }
  };

  const activeCount = promotions.filter((p) => getPromotionStatus(p) === 'Aktív').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Promóciók & Időszakos Ajánlatok</h1>
          <p className="text-xs text-slate-400 mt-1">
            Összesen {promotions.length} promóció rögzítve ({activeCount} jelenleg aktív).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPromo(null);
            setIsEditModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Új Promóció Létrehozása</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Keresés cím, slug vagy leírás alapján..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Státusz:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all" className="bg-slate-900">Összes promóció</option>
            <option value="Aktív" className="bg-slate-900">Aktív</option>
            <option value="Tervezett" className="bg-slate-900">Tervezett</option>
            <option value="Lejárt" className="bg-slate-900">Lejárt</option>
            <option value="Archivált" className="bg-slate-900">Archivált</option>
          </select>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/50 border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Promóció & Ikon</th>
                <th className="py-3 px-4">Státusz</th>
                <th className="py-3 px-4">Kezdés</th>
                <th className="py-3 px-4">Lejárat</th>
                <th className="py-3 px-4 text-center">Felső Banner</th>
                <th className="py-3 px-4 text-center">Ajánlatkérések</th>
                <th className="py-3 px-4">Saját URL</th>
                <th className="py-3 px-4 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Nincs a szűrésnek megfelelő promóció.
                  </td>
                </tr>
              ) : (
                filtered.map((promo) => {
                  const status = getPromotionStatus(promo);
                  const requestsCount = promotionService.getRequestsCount(promo.id);

                  return (
                    <tr key={promo.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Title & Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl p-1.5 rounded-lg bg-black/40 border border-white/5 shrink-0">
                            {promo.icon || '🎁'}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate max-w-[200px]" title={promo.title}>
                              {promo.title}
                            </span>
                            {promo.projectCategory && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 rounded mt-0.5">
                                <span>{getProjectCategoryEmoji(promo.projectCategory)}</span>
                                <span>{promo.projectCategory}</span>
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 block truncate max-w-[200px] mt-0.5">
                              {promo.shortDescription}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={status} size="sm" />
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        {formatHungarianDate(promo.startDate, promo.startTime)}
                      </td>

                      {/* End Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        {formatHungarianDate(promo.endDate, promo.endTime)}
                      </td>

                      {/* Top Banner indicator */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {promo.showBanner ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Megaphone className="w-3 h-3" />
                            <span>Megjelenik</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600">Nem</span>
                        )}
                      </td>

                      {/* Requests Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Link
                          to={`/admin/ajanlatkeresek?promo=${promo.id}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-colors ${
                            requestsCount > 0
                              ? 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/30'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Kapcsolódó ajánlatkérések megtekintése"
                        >
                          <Inbox className="w-3.5 h-3.5" />
                          <span>{requestsCount} db</span>
                        </Link>
                      </td>

                      {/* Public URL & Copy */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <code className="text-slate-400 font-mono text-[11px] bg-black/40 px-2 py-1 rounded border border-white/5">
                            /ajanlat/{promo.slug}
                          </code>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(promo.slug)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                            title="Link másolása vágólapra"
                          >
                            {copiedSlug === promo.slug ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <a
                            href={`/ajanlat/${promo.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                            title="Publikus promóciós oldal megnyitása"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPromo(promo)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Előnézet megtekintése"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Előnézet</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPromo(promo);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            title="Szerkesztés"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleArchive(promo.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              promo.isArchived
                                ? 'text-amber-400 hover:bg-amber-500/10'
                                : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                            }`}
                            title={promo.isArchived ? 'Visszaállítás az archívumból' : 'Archiválás'}
                          >
                            {promo.isArchived ? (
                              <ArchiveRestore className="w-4 h-4" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingPromo({ id: promo.id, title: promo.title })}
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

      {/* Edit / Create Modal */}
      <PromotionEditModal
        promotion={editingPromo}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPromo(null);
        }}
        onSave={() => {
          reload();
        }}
      />

      {/* Preview Modal */}
      <PromotionPreviewModal
        promotion={previewPromo}
        isOpen={!!previewPromo}
        onClose={() => setPreviewPromo(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingPromo}
        title="Promóció törlése"
        message="Biztosan véglegesen törölni szeretnéd ezt a promóciót? A kapcsolódó ajánlatkérések nem vesznek el."
        itemName={deletingPromo?.title}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPromo(null)}
      />
    </div>
  );
};
