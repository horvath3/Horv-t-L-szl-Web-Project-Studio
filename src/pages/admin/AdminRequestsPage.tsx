import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Eye,
  Mail,
  Trash2,
  ArrowUpDown,
  Tag,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { ProjectRequest, RequestStatus, ProjectCategory, GmailStatusInfo } from '../../types';
import {
  requestService,
  promotionService,
  getStatusEmoji,
  getProjectCategoryEmoji,
  formatTrackingDateTime,
  DEFAULT_PUBLIC_STATUS_MESSAGES
} from '../../services/storage';
import { gmailService } from '../../services/gmailService';
import { RequestDetailModal } from '../../components/admin/RequestDetailModal';
import { EmailReplyModal } from '../../components/admin/EmailReplyModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

const ALL_STATUSES: RequestStatus[] = [
  'Új',
  'Átnézés alatt',
  'Kapcsolatfelvétel',
  'Ajánlat egyeztetése',
  'Elfogadva',
  'Folyamatban',
  'Tesztelés',
  'Elkészült',
  'Lezárva',
  'Elutasítva'
];

const ALL_CATEGORIES: ProjectCategory[] = [
  'Weboldal',
  'Webalkalmazás',
  'Játékprojekt',
  'Mobilalkalmazás',
  'Egyedi szoftver',
  'AI projekt',
  'Egyéb projekt'
];

export const AdminRequestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPromoParam = searchParams.get('promo');

  const [requests, setRequests] = useState<ProjectRequest[]>(requestService.getAll());
  const [promotions, setPromotions] = useState(promotionService.getAll(true));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [promoFilter, setPromoFilter] = useState<string>(initialPromoParam || 'all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name' | 'project' | 'status'>('date-desc');
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [emailModalState, setEmailModalState] = useState<{
    request: ProjectRequest;
    initialStatus?: RequestStatus;
    transitionLabel?: string;
  } | null>(null);
  const [recentStatusChange, setRecentStatusChange] = useState<{
    request: ProjectRequest;
    from: RequestStatus;
    to: RequestStatus;
  } | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<{ id: string; title: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [gmailStatus, setGmailStatus] = useState<GmailStatusInfo>(gmailService.getCachedStatus());

  const reload = () => {
    setRequests(requestService.getAll());
    setPromotions(promotionService.getAll(true));
  };

  useEffect(() => {
    gmailService.fetchStatus().then((st) => setGmailStatus(st));
    const handleGmailEvent = (e: Event) => {
      const custom = e as CustomEvent<GmailStatusInfo>;
      if (custom.detail) setGmailStatus(custom.detail);
    };
    window.addEventListener('store_hl_studio_requests', reload);
    window.addEventListener('store_hl_studio_promotions', reload);
    window.addEventListener('gmail_status_changed', handleGmailEvent);
    return () => {
      window.removeEventListener('store_hl_studio_requests', reload);
      window.removeEventListener('store_hl_studio_promotions', reload);
      window.removeEventListener('gmail_status_changed', handleGmailEvent);
    };
  }, []);

  useEffect(() => {
    if (initialPromoParam) {
      setPromoFilter(initialPromoParam);
    }
  }, [initialPromoParam]);

  const handleCopyRequestId = (reqId: string) => {
    try {
      navigator.clipboard.writeText(reqId);
    } catch {
      // fallback
    }
    setCopiedId(reqId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtering logic
  const filtered = requests.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.projectName.toLowerCase().includes(q) ||
      r.shortDescription.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.requestId && r.requestId.toLowerCase().includes(q)) ||
      (r.projectCategory && r.projectCategory.toLowerCase().includes(q)) ||
      (r.gameName && r.gameName.toLowerCase().includes(q)) ||
      (r.gameType && r.gameType.toLowerCase().includes(q)) ||
      (r.platform && r.platform.toLowerCase().includes(q)) ||
      (r.inspiration && r.inspiration.toLowerCase().includes(q)) ||
      (r.promotionTitle && r.promotionTitle.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' ||
      r.internalStatus === statusFilter ||
      r.publicStatus === statusFilter ||
      r.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || r.projectCategory === categoryFilter;

    let matchesPromo = true;
    if (promoFilter === 'promo-only') {
      matchesPromo = !!r.promotionId;
    } else if (promoFilter === 'standard-only') {
      matchesPromo = !r.promotionId;
    } else if (promoFilter !== 'all') {
      matchesPromo = r.promotionId === promoFilter;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesPromo;
  });

  // Sorting logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'hu');
    }
    if (sortBy === 'project') {
      return a.projectName.localeCompare(b.projectName, 'hu');
    }
    if (sortBy === 'status') {
      return (a.internalStatus || a.status).localeCompare(b.internalStatus || b.status, 'hu');
    }
    return 0;
  });

  const handleInternalStatusChange = (req: ProjectRequest, newInternal: RequestStatus) => {
    const prevInternal = req.internalStatus || req.status || 'Új';
    const currentPublic = req.publicStatus || req.status || 'Új';
    const shouldSyncPublic = currentPublic === prevInternal;
    const nextPublic = shouldSyncPublic ? newInternal : currentPublic;

    let nextMsg = req.publicStatusMessage || '';
    if (
      shouldSyncPublic &&
      (!nextMsg.trim() || Object.values(DEFAULT_PUBLIC_STATUS_MESSAGES).includes(nextMsg.trim()))
    ) {
      nextMsg = DEFAULT_PUBLIC_STATUS_MESSAGES[newInternal] || '';
    }

    const updated = requestService.updateTrackingSettings(req.id, {
      internalStatus: newInternal,
      publicStatus: nextPublic,
      publicStatusMessage: nextMsg
    });
    reload();
    if (updated) {
      setRecentStatusChange({
        request: updated,
        from: prevInternal,
        to: newInternal
      });
      if (selectedRequest && selectedRequest.id === req.id) {
        setSelectedRequest(updated);
      }
    }
  };

  const handlePublicStatusChange = (req: ProjectRequest, newPublic: RequestStatus) => {
    const prevPublic = req.publicStatus || req.status || 'Új';
    let nextMsg = req.publicStatusMessage || '';
    if (!nextMsg.trim() || Object.values(DEFAULT_PUBLIC_STATUS_MESSAGES).includes(nextMsg.trim())) {
      nextMsg = DEFAULT_PUBLIC_STATUS_MESSAGES[newPublic] || '';
    }

    const updated = requestService.updateTrackingSettings(req.id, {
      internalStatus: req.internalStatus || req.status,
      publicStatus: newPublic,
      publicStatusMessage: nextMsg
    });
    reload();
    if (updated) {
      setRecentStatusChange({
        request: updated,
        from: prevPublic,
        to: newPublic
      });
      if (selectedRequest && selectedRequest.id === req.id) {
        setSelectedRequest(updated);
      }
    }
  };

  const handleStatusChange = (id: string, status: RequestStatus) => {
    const updated = requestService.updateStatus(id, status);
    reload();
    if (selectedRequest && selectedRequest.id === id && updated) {
      setSelectedRequest(updated);
    }
  };

  const handleNotesChange = (id: string, notes: string) => {
    requestService.updateNotes(id, notes);
    reload();
  };

  const handleConfirmDelete = () => {
    if (deletingRequest) {
      requestService.delete(deletingRequest.id);
      if (selectedRequest && selectedRequest.id === deletingRequest.id) {
        setSelectedRequest(null);
      }
      setDeletingRequest(null);
      reload();
    }
  };

  const newCount = requests.filter((r) => (r.internalStatus || r.status) === 'Új').length;
  const promoCount = requests.filter((r) => !!r.promotionId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Ajánlatkérések & Státuszkövetés</h1>
          <p className="text-xs text-slate-400 mt-1">
            Összesen {requests.length} beérkezett ajánlatkérés ({newCount} új, {promoCount} promóciós).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/beallitasok"
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              gmailStatus.state === 'connected' && gmailStatus.email
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
            title="Gmail kapcsolat és automatikus e-mail beállítások"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>
              {gmailStatus.state === 'connected' && gmailStatus.email
                ? `✓ Gmail: ${gmailStatus.email}`
                : 'Gmail kapcsolat'}
            </span>
          </Link>

          <Link
            to="/admin/email-sablonok"
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-mail sablonok</span>
          </Link>

          <Link
            to="/ajanlat-statusz"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            title="Ügyfél státuszkövető oldal megnyitása"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Státuszkövető oldal</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>

          <Link
            to="/admin/projektkapacitas"
            className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            title="Projekt kérések szüneteltetése és hibaüzenetek beállítása"
          >
            <span>🚫 Kérések szüneteltetése</span>
          </Link>

          <Link
            to="/admin/promociok"
            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promóciók kezelése</span>
          </Link>
        </div>
      </div>

      {/* Section 5: Status Change Notification Banner ("📧 E-mail küldése a státuszról") */}
      {recentStatusChange && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-900 border border-indigo-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div className="space-y-1">
            <div className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
              <span>
                Státusz módosítva ({recentStatusChange.request.name} – {recentStatusChange.request.projectName}):
              </span>
              <span className="px-2 py-0.5 rounded bg-black/50 text-slate-300 font-mono">
                {getStatusEmoji(recentStatusChange.from)} {recentStatusChange.from}
              </span>
              <span className="text-indigo-300">→</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-mono">
                {getStatusEmoji(recentStatusChange.to)} {recentStatusChange.to}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Szeretnél automatikusan előkészített státuszértesítő e-mailt küldeni az ügyfélnek ({recentStatusChange.request.email})?
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEmailModalState({
                  request: recentStatusChange.request,
                  initialStatus: recentStatusChange.to,
                  transitionLabel: `${recentStatusChange.from} → ${recentStatusChange.to}`
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>📧 E-mail küldése a státuszról</span>
            </button>
            <button
              type="button"
              onClick={() => setRecentStatusChange(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              title="Bezárás"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter, Search & Sorting Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Keresés azonosító (pl. HL-7K4P-92XM), ügyfél, projekt vagy e-mail alapján..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">Kategória:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Összes kategória</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">
                    {getProjectCategoryEmoji(cat)} {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">Státusz:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Összes státusz</option>
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st} className="bg-slate-900">
                    {getStatusEmoji(st)} {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Promotion Filter */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">Promóció:</span>
              <select
                value={promoFilter}
                onChange={(e) => {
                  setPromoFilter(e.target.value);
                  if (e.target.value === 'all') {
                    searchParams.delete('promo');
                    setSearchParams(searchParams);
                  } else {
                    setSearchParams({ promo: e.target.value });
                  }
                }}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all" className="bg-slate-900">Összes ajánlat</option>
                <option value="promo-only" className="bg-slate-900">Csak promóciós</option>
                <option value="standard-only" className="bg-slate-900">Csak normál</option>
                {promotions.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900">
                    🎁 {p.shortTitle || p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
              >
                <option value="date-desc" className="bg-slate-900">Legújabb elöl</option>
                <option value="date-asc" className="bg-slate-900">Legrégebbi elöl</option>
                <option value="name" className="bg-slate-900">Név szerint (A-Z)</option>
                <option value="project" className="bg-slate-900">Projekt szerint (A-Z)</option>
                <option value="status" className="bg-slate-900">Státusz szerint</option>
              </select>
            </div>

            {(search || statusFilter !== 'all' || categoryFilter !== 'all' || promoFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setPromoFilter('all');
                  searchParams.delete('promo');
                  setSearchParams(searchParams);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                Szűrők törlése
              </button>
            )}
          </div>
        </div>

        {promoFilter !== 'all' && (
          <div className="flex items-center gap-2 pt-1 text-xs text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>
              Aktív promóciós szűrő:{' '}
              <strong>
                {promoFilter === 'promo-only'
                  ? 'Csak promóciós ajánlatkérések'
                  : promoFilter === 'standard-only'
                  ? 'Csak normál ajánlatkérések'
                  : promotions.find((p) => p.id === promoFilter)?.title || promoFilter}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/50 border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Azonosító</th>
                <th className="py-3 px-4">Megrendelő & E-mail</th>
                <th className="py-3 px-4">Projekt & Típus</th>
                <th className="py-3 px-4">Promóció</th>
                <th className="py-3 px-4">Beküldve / Frissítve</th>
                <th className="py-3 px-4">Belső Státusz</th>
                <th className="py-3 px-4">Ügyfél által látható státusz</th>
                <th className="py-3 px-4 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Nincs találat a szűrési feltételekre.
                  </td>
                </tr>
              ) : (
                sorted.map((req) => {
                  const internalSt = req.internalStatus || req.status || 'Új';
                  const publicSt = req.publicStatus || req.status || 'Új';

                  return (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-indigo-300 text-xs bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded">
                            {req.requestId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyRequestId(req.requestId)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Azonosító másolása"
                          >
                            {copiedId === req.requestId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <Link
                            to={`/ajanlat-statusz?id=${encodeURIComponent(req.requestId)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors"
                            title="Megnyitás a publikus státuszkövető oldalon"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{req.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEmailModalState({
                              request: req,
                              initialStatus: publicSt
                            })
                          }
                          className="text-slate-400 hover:text-indigo-400 font-mono text-[11px] flex items-center gap-1 mt-0.5 cursor-pointer"
                          title="E-mail küldése megnyitása"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{req.email}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-white block truncate max-w-[210px]" title={req.projectName}>
                          {req.projectName}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-200 bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 rounded">
                            <span>{getProjectCategoryEmoji(req.projectCategory || req.projectType)}</span>
                            <span>{req.projectCategory || req.projectType}</span>
                          </span>
                          {req.gameType && (
                            <span className="text-[10px] text-purple-300 bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded">
                              {req.gameType}
                            </span>
                          )}
                          {req.platform && (
                            <span className="text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                              {req.platform}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {req.promotionTitle ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 text-indigo-300 font-medium text-[11px]">
                            <span>🎁</span>
                            <span className="truncate max-w-[130px]" title={req.promotionTitle}>
                              {req.promotionTitle.replace('🎁', '').trim()}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Normál</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                        <span className="text-slate-300 block">
                          {new Date(req.createdAt).toLocaleDateString('hu-HU')}
                        </span>
                        <span className="text-slate-500 text-[10px] block" title="Utolsó módosítás">
                          Frissítve: {formatTrackingDateTime(req.updatedAt)}
                        </span>
                      </td>

                      {/* Belső Státusz */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={internalSt}
                          onChange={(e) => handleInternalStatusChange(req, e.target.value as RequestStatus)}
                          className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-white text-[11px] focus:outline-none focus:border-indigo-500 cursor-pointer"
                          title="Belső admin státusz"
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-slate-900">
                              {getStatusEmoji(st)} {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Ügyfél által látható státusz */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={publicSt}
                          onChange={(e) => handlePublicStatusChange(req, e.target.value as RequestStatus)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-[11px] focus:outline-none focus:border-indigo-400 cursor-pointer"
                          title="Ügyfél által látható státusz (/ajanlat-statusz)"
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-slate-900">
                              {getStatusEmoji(st)} {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEmailModalState({
                                request: req,
                                initialStatus: publicSt
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="E-mail küldése / Státuszértesítő előnézet"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>E-mail küldése</span>
                          </button>

                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Részletek és státuszüzenet szerkesztése"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Részletek</span>
                          </button>

                          <button
                            onClick={() => setDeletingRequest({ id: req.id, title: req.projectName })}
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
            reload();
          }}
          onDelete={(id) => {
            requestService.delete(id);
            setSelectedRequest(null);
            reload();
          }}
        />
      )}

      {/* Direct AI Email Reply & Status Notification Modal */}
      {emailModalState && (
        <EmailReplyModal
          request={emailModalState.request}
          initialStatus={emailModalState.initialStatus}
          statusTransitionLabel={emailModalState.transitionLabel}
          isOpen={!!emailModalState}
          onClose={() => setEmailModalState(null)}
          onAnalysisUpdated={() => reload()}
          onHistoryAdded={() => reload()}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingRequest}
        title="Ajánlatkérés törlése"
        message="Biztosan véglegesen törölni szeretnéd ezt a beérkezett ajánlatkérést?"
        itemName={deletingRequest?.title}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRequest(null)}
      />
    </div>
  );
};
