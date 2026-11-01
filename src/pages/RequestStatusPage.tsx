import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  ArrowDown,
  MessageSquare,
  Layers,
  Tag,
  Lock
} from 'lucide-react';
import { PublicRequestStatusDTO, RequestStatus } from '../types';
import {
  requestService,
  getStatusEmoji,
  getProjectCategoryEmoji,
  formatTrackingDate,
  formatTrackingDateTime
} from '../services/storage';
import { StatusBadge } from '../components/ui/StatusBadge';

interface WorkflowStep {
  key: string;
  label: string;
  description: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    key: 'bekuldve',
    label: 'Beküldve',
    description: 'Az ajánlatkérés sikeresen rögzítésre került a rendszerben.'
  },
  {
    key: 'atnezes',
    label: 'Átnézés',
    description: 'Az elképzelés, a funkciók és a műszaki igények szakmai áttekintése.'
  },
  {
    key: 'egyeztetes',
    label: 'Egyeztetés',
    description: 'Kapcsolatfelvétel, specifikáció pontosítása és ajánlat véglegesítése.'
  },
  {
    key: 'fejlesztes',
    label: 'Fejlesztés',
    description: 'A projekt megvalósítása, implementációja és minőségbiztosítási tesztelése.'
  },
  {
    key: 'elkeszult',
    label: 'Elkészült',
    description: 'A projekt elkészült, átadásra került és sikeresen lezárult.'
  }
];

function getStepState(
  publicStatus: RequestStatus,
  stepIndex: number
): 'completed' | 'current' | 'upcoming' | 'rejected' {
  if (publicStatus === 'Elutasítva') {
    if (stepIndex === 0) return 'completed';
    if (stepIndex === 1) return 'rejected';
    return 'upcoming';
  }

  let activeStepIndex = 0;
  switch (publicStatus) {
    case 'Új':
      activeStepIndex = 0;
      break;
    case 'Átnézés alatt':
      activeStepIndex = 1;
      break;
    case 'Kapcsolatfelvétel':
    case 'Ajánlat egyeztetése':
    case 'Elfogadva':
      activeStepIndex = 2;
      break;
    case 'Folyamatban':
    case 'Tesztelés':
      activeStepIndex = 3;
      break;
    case 'Elkészült':
    case 'Lezárva':
      activeStepIndex = 4;
      break;
    default:
      activeStepIndex = 0;
  }

  // When project is finished ('Elkészült' or 'Lezárva'), the final step is completed & highlighted
  if ((publicStatus === 'Elkészült' || publicStatus === 'Lezárva') && stepIndex === 4) {
    return 'completed';
  }

  if (stepIndex < activeStepIndex) return 'completed';
  if (stepIndex === activeStepIndex) return 'current';
  return 'upcoming';
}

export const RequestStatusPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQueryId = searchParams.get('id') || '';

  const [inputId, setInputId] = useState(initialQueryId.toUpperCase());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<PublicRequestStatusDTO | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Ensure this unlisted page is never indexed by search engines
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Ajánlatkérés státuszának lekérése | Horvát László Studio';

    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const prevRobots = robotsMeta?.content || '';
    let createdMeta = false;

    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
      createdMeta = true;
    }
    robotsMeta.content = 'noindex, nofollow';

    return () => {
      document.title = prevTitle;
      if (robotsMeta) {
        if (createdMeta) {
          robotsMeta.remove();
        } else {
          robotsMeta.content = prevRobots;
        }
      }
    };
  }, []);

  const performLookup = useCallback(
    async (targetId: string, updateUrl = true) => {
      const cleaned = targetId.trim().toUpperCase();
      if (!cleaned) {
        setErrorMsg('Nem találtunk ilyen ajánlatkérést. Ellenőrizd az azonosítót, majd próbáld újra.');
        setStatusData(null);
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);

      const result = await requestService.lookupPublicStatus(cleaned);
      setIsLoading(false);

      if (result.error || !result.data) {
        setStatusData(null);
        setErrorMsg(
          result.error ||
            'Nem találtunk ilyen ajánlatkérést. Ellenőrizd az azonosítót, majd próbáld újra.'
        );
      } else {
        setStatusData(result.data);
        setErrorMsg(null);
        if (updateUrl) {
          setSearchParams({ id: result.data.requestId }, { replace: true });
        }
      }
    },
    [setSearchParams]
  );

  // Auto-lookup if opened with ?id=HL-...
  useEffect(() => {
    if (initialQueryId.trim()) {
      const formatted = initialQueryId.trim().toUpperCase();
      setInputId(formatted);
      performLookup(formatted, false);
    }
  }, [initialQueryId, performLookup]);

  // Live refresh if admin updates status in another tab
  useEffect(() => {
    if (!statusData?.requestId) return;
    const handleStorageUpdate = () => {
      performLookup(statusData.requestId, false);
    };
    window.addEventListener('store_hl_studio_requests', handleStorageUpdate);
    return () => {
      window.removeEventListener('store_hl_studio_requests', handleStorageUpdate);
    };
  }, [statusData?.requestId, performLookup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(inputId, true);
  };

  const handleCopyId = () => {
    if (!statusData?.requestId) return;
    try {
      navigator.clipboard.writeText(statusData.requestId);
    } catch {
      // fallback
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="pt-14 sm:pt-20 lg:pt-24 pb-24 min-h-screen relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px] absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Page Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Biztonságos Ajánlatkérés-Státuszkövető</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight mb-3">
            Ajánlatkérés státuszának lekérése
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Add meg az ajánlatkérésed azonosítóját, hogy megtekintsd az aktuális státuszát.
          </p>
        </div>

        {/* Lookup Input Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="request-id-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
              >
                Ajánlatkérés azonosítója
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    id="request-id-input"
                    type="text"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value.toUpperCase())}
                    placeholder="Például: HL-7K4P-92XM"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full px-4 py-3.5 rounded-xl bg-black/50 border border-white/15 text-white font-mono text-base tracking-wider placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Lekérés...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Státusz lekérése</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                Az adatvédelem érdekében a lekérdezés kizárólag a pontos, egyedi azonosítóval működik, és nem jelenít meg személyes adatokat.
              </span>
            </div>
          </form>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">{errorMsg}</p>
                <p className="text-xs text-rose-300/80 mt-1">
                  Az azonosító formátuma például: <span className="font-mono font-semibold">HL-XXXX-XXXX</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Result View */}
        {statusData && (
          <div className="space-y-6 animate-fadeIn">
            {/* Main Status Summary Card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Ajánlatkérés
                  </span>
                  <span className="font-mono text-sm font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-lg">
                    {statusData.requestId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Azonosító másolása"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => performLookup(statusData.requestId, false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  title="Státusz frissítése"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Frissítés</span>
                </button>
              </div>

              {/* Core Project & Status Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Projekt:
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                    {statusData.projectName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {statusData.projectCategory && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-200 bg-indigo-500/15 px-2.5 py-1 rounded-md border border-indigo-500/30">
                        <span>{getProjectCategoryEmoji(statusData.projectCategory)}</span>
                        <span>{statusData.projectCategory}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{statusData.projectType}</span>
                    </span>
                    {statusData.promotionTitle && (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-300 bg-purple-500/15 px-2.5 py-1 rounded-md border border-purple-500/30">
                        <Tag className="w-3 h-3" />
                        <span>{statusData.promotionTitle}</span>
                      </span>
                    )}
                  </div>

                  {/* Game Project extra public status info */}
                  {(statusData.projectCategory === 'Játékprojekt' ||
                    statusData.gameName ||
                    statusData.gameType ||
                    statusData.platform) && (
                    <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {statusData.gameName && (
                        <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                            Játék neve:
                          </span>
                          <span className="font-semibold text-white">{statusData.gameName}</span>
                        </div>
                      )}
                      {statusData.gameType && (
                        <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                            Játék típusa:
                          </span>
                          <span className="font-semibold text-indigo-200">{statusData.gameType}</span>
                        </div>
                      )}
                      {statusData.platform && (
                        <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                            Platform:
                          </span>
                          <span className="font-semibold text-cyan-200">{statusData.platform}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-purple-950/40 border border-indigo-500/30 flex flex-col justify-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 block mb-2">
                    Státusz:
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl" aria-hidden="true">
                      {getStatusEmoji(statusData.publicStatus)}
                    </span>
                    <div>
                      <div className="text-lg sm:text-xl font-extrabold text-white">
                        {statusData.publicStatus}
                      </div>
                      <div className="mt-1">
                        <StatusBadge status={statusData.publicStatus} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Admin Status Explanation Message for Client */}
              {statusData.publicStatusMessage && (
                <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 mb-6">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                        Aktuális tájékoztatás a projektről
                      </span>
                      <p className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-line">
                        „{statusData.publicStatusMessage}”
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Beküldve:</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {formatTrackingDate(statusData.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Utolsó frissítés:</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {formatTrackingDate(statusData.updatedAt)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 block">
                      ({formatTrackingDateTime(statusData.updatedAt)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Progress Tracker (Section 7: FOLYAMATJELZŐ) */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold font-display text-white">
                  Feldolgozási folyamatjelző
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Az ajánlatkérésed életciklusa a beküldéstől a megvalósításig.
                </p>
              </div>

              <div className="max-w-lg mx-auto">
                {WORKFLOW_STEPS.map((step, index) => {
                  const state = getStepState(statusData.publicStatus, index);
                  const isLast = index === WORKFLOW_STEPS.length - 1;

                  let indicatorEmoji = '⚪';
                  let cardClasses = 'bg-black/25 border-white/5 text-slate-500';
                  let titleClasses = 'text-slate-400 font-semibold';
                  let badgeText = 'Várakozik';
                  let badgeClasses = 'bg-white/5 text-slate-500 border-white/10';

                  if (state === 'completed') {
                    indicatorEmoji = '🟢';
                    cardClasses = 'bg-emerald-950/20 border-emerald-500/30 text-slate-200';
                    titleClasses = 'text-emerald-300 font-bold';
                    badgeText = 'Kész';
                    badgeClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                  } else if (state === 'current') {
                    indicatorEmoji = '🟡';
                    cardClasses =
                      'bg-gradient-to-r from-amber-500/15 via-indigo-950/40 to-black/50 border-amber-400/50 text-white shadow-lg shadow-amber-500/5 ring-1 ring-amber-400/30';
                    titleClasses = 'text-amber-300 font-extrabold';
                    badgeText = `Aktuális: ${statusData.publicStatus}`;
                    badgeClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  } else if (state === 'rejected') {
                    indicatorEmoji = '❌';
                    cardClasses = 'bg-rose-950/30 border-rose-500/40 text-rose-200';
                    titleClasses = 'text-rose-300 font-bold';
                    badgeText = 'Elutasítva';
                    badgeClasses = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                  }

                  return (
                    <div key={step.key} className="flex flex-col items-stretch">
                      <div
                        className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${cardClasses}`}
                      >
                        <div className="flex items-start gap-3.5">
                          <span className="text-xl leading-none mt-0.5 select-none" aria-hidden="true">
                            {indicatorEmoji}
                          </span>
                          <div>
                            <div className={`text-sm sm:text-base ${titleClasses}`}>
                              {step.label}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${badgeClasses}`}
                        >
                          {badgeText}
                        </span>
                      </div>

                      {!isLast && (
                        <div className="flex justify-center py-1.5">
                          <ArrowDown
                            className={`w-4 h-4 ${
                              state === 'completed'
                                ? 'text-emerald-400'
                                : state === 'current'
                                ? 'text-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
