import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  Share2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  Youtube
} from 'lucide-react';
import { Promotion } from '../types';
import {
  promotionService,
  getPromotionStatus,
  isPromotionActive,
  getProjectCategoryEmoji,
  formatHungarianDate
} from '../services/storage';

export const PromotionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [promotion, setPromotion] = useState<Promotion | undefined>(undefined);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    if (slug) {
      const p = promotionService.getBySlug(slug);
      setPromotion(p);
      if (p) {
        document.title = `${p.title} | Horvát László – Web & Project Studio`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', p.shortDescription || p.title);
        }
      }
    }
  }, [slug]);

  if (!promotion) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mb-3">
          A keresett promóció nem található
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-8">
          Lehetséges, hogy a link elavult vagy a promóció azonosítója megváltozott.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/projekt-igeny"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Normál ajánlatkérés
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    );
  }

  const timingStatus = getPromotionStatus(promotion);
  const isActive = isPromotionActive(promotion);
  const currentUrl = window.location.href;
  const isGamePromo = promotion.projectCategory === 'Játékprojekt';
  const youtubeSnippet = isGamePromo
    ? `Szeretnél saját egyedi játékprojektet? Nézd meg az aktuális ajánlatot:\n${currentUrl}`
    : `Szeretnél saját weboldalt vagy digitális projektet? Nézd meg az aktuális ajánlatot:\n${currentUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const input = document.createElement('input');
        input.value = currentUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopySnippet = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(youtubeSnippet);
      }
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="relative min-h-screen pt-14 sm:pt-20 lg:pt-24 pb-24">
      {/* Ambient glowing orbs */}
      <div className="ambient-glow-indigo top-20 left-1/3" />
      <div className="ambient-glow-purple bottom-20 right-1/4" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vissza</span>
          </button>
        </div>

        {/* Promotion Hero Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden mb-10">
          {/* Subtle decorative gradient flare */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Timing status pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                <span>{promotion.icon || '🎁'}</span>
                <span>Kiemelt Promóciós Ajánlat</span>
              </div>
              {promotion.projectCategory && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-bold text-purple-200">
                  <span>{getProjectCategoryEmoji(promotion.projectCategory)}</span>
                  <span>{promotion.projectCategory}</span>
                </div>
              )}
            </div>

            {/* Status indicator */}
            {timingStatus === 'Aktív' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Az ajánlat jelenleg elérhető</span>
              </span>
            )}

            {timingStatus === 'Tervezett' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Ez az ajánlat hamarosan elérhető</span>
              </span>
            )}

            {timingStatus === 'Lejárt' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Ez az ajánlat már nem érhető el</span>
              </span>
            )}

            {timingStatus === 'Archivált' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-400 text-xs font-semibold">
                <span>Lezárt / Archivált</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight leading-tight mb-4">
            {promotion.title}
          </h1>

          {/* Short description */}
          <p className="text-lg sm:text-xl text-indigo-200 font-medium leading-relaxed mb-6">
            „{promotion.shortDescription}”
          </p>

          {/* Full description */}
          <div className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line space-y-4 mb-8">
            <p>{promotion.fullDescription}</p>
          </div>

          {/* Expiration validity banner */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isActive
              ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-500/40 text-white'
              : 'bg-black/40 border-white/10 text-slate-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-400'
                }`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold">
                    Az ajánlat eddig érvényes:
                  </span>
                  <span className="text-base sm:text-lg font-bold font-display text-white">
                    {formatHungarianDate(promotion.endDate, promotion.endTime)}-ig
                  </span>
                </div>
              </div>

              <div className="text-xs sm:text-right font-medium">
                {isActive ? (
                  <span className="text-emerald-400 flex items-center sm:justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Az ajánlat jelenleg elérhető.</span>
                  </span>
                ) : timingStatus === 'Tervezett' ? (
                  <span className="text-sky-400">Ez az ajánlat hamarosan elérhető.</span>
                ) : (
                  <span className="text-amber-400">Ez az ajánlat már nem érhető el.</span>
                )}
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Kezdés: {formatHungarianDate(promotion.startDate, promotion.startTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature List: "Mit tartalmaz?" */}
        {promotion.features && promotion.features.length > 0 && (
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/8 shadow-xl mb-10 space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-bold font-display text-white">Mit tartalmaz az ajánlat?</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {promotion.features.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-start gap-3.5 hover:border-indigo-500/20 transition-colors"
                >
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block capitalize">
                      {item}
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      Professzionális kivitelezés a stúdió magas minőségi elvárásai szerint.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional info / terms */}
        {promotion.additionalInfo && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/8 shadow-xl mb-10 space-y-3">
            <h4 className="text-sm font-bold font-display text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Feltételek és további információk</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-black/20 p-4 rounded-2xl border border-white/5">
              {promotion.additionalInfo}
            </p>
          </div>
        )}

        {/* Call to Action Box */}
        <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-black/60 to-black text-center shadow-2xl space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              {isActive ? 'Készen állsz a megvalósításra?' : 'Az ajánlat időszaka lezárult'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isActive
                ? 'Küldd el a projektelképzelésedet az űrlapon keresztül. A promóció automatikusan hozzá lesz rendelve a megkeresésedhez.'
                : 'Erre a konkrét időszakos akcióra már nem lehet jelentkezni, de normál ajánlatkérést bármikor leadhatsz az alábbi gombon keresztül.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {isActive ? (
              <Link
                to={`/projekt-igeny?promo=${promotion.slug}${
                  promotion.projectCategory
                    ? `&category=${encodeURIComponent(promotion.projectCategory)}`
                    : ''
                }`}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <span>{promotion.ctaText || 'Ajánlatot kérek'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/projekt-igeny"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
              >
                <span>Normál ajánlatkérés beküldése</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold uppercase tracking-wider border border-white/10 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Link kimásolva!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Ajánlat megosztása</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* External Promotion & YouTube Share Snippet Section */}
        <div className="mt-10 glass-panel rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-500" />
              <span>Megosztás YouTube / Közösségi média leírásban</span>
            </span>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Szöveg másolva!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Szöveg másolása</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs font-mono bg-black/40 p-3 rounded-xl border border-white/5 text-slate-300 whitespace-pre-wrap select-all">
            {youtubeSnippet}
          </p>
        </div>
      </div>
    </div>
  );
};
