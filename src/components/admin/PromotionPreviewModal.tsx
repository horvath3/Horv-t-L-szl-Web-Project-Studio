import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Promotion } from '../../types';
import {
  formatHungarianDate,
  getPromotionStatus,
  isPromotionActive
} from '../../services/storage';

interface PromotionPreviewModalProps {
  promotion: Promotion | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PromotionPreviewModal: React.FC<PromotionPreviewModalProps> = ({
  promotion,
  isOpen,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen || !promotion) return null;

  const timingStatus = getPromotionStatus(promotion);
  const isActive = isPromotionActive(promotion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel rounded-2xl border border-white/10 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Modal Toolbar */}
        <div className="p-4 border-b border-white/10 bg-[#080a0f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Előnézet:</span>
              <span className="text-indigo-400 font-mono">/ajanlat/{promotion.slug}</span>
            </span>

            {/* Device switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                  viewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Asztali</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                  viewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobil</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/ajanlat/${promotion.slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Megnyitás új lapon</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser Mockup Chrome */}
        <div className="px-4 py-2 bg-black/60 border-b border-white/5 flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 max-w-md mx-auto px-3 py-1 rounded-md bg-black/80 border border-white/10 text-[11px] text-slate-300 text-center font-mono truncate">
            https://horvatstudio.hu/ajanlat/{promotion.slug}
          </div>
        </div>

        {/* Preview Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#090b10] flex justify-center">
          <div className={`w-full transition-all duration-300 ${
            viewMode === 'mobile' ? 'max-w-sm border border-white/15 rounded-3xl p-4 bg-[#090b10] shadow-2xl' : 'max-w-3xl'
          }`}>
            {/* Promotion Hero Card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <span>{promotion.icon || '🎁'}</span>
                  <span>Kiemelt Ajánlat</span>
                </div>

                {timingStatus === 'Aktív' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Az ajánlat jelenleg elérhető</span>
                  </span>
                )}
                {timingStatus === 'Lejárt' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                    <span>Ez az ajánlat már nem érhető el</span>
                  </span>
                )}
                {timingStatus === 'Tervezett' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold">
                    <span>Ez az ajánlat hamarosan elérhető</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white mb-3">
                {promotion.title}
              </h2>

              <p className="text-sm sm:text-base text-indigo-200 font-medium leading-relaxed mb-4">
                „{promotion.shortDescription}”
              </p>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 whitespace-pre-line">
                {promotion.fullDescription}
              </p>

              {/* Expiration validity banner */}
              <div className={`p-4 rounded-2xl border ${
                isActive ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-500/40 text-white' : 'bg-black/40 border-white/10 text-slate-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                        Az ajánlat eddig érvényes:
                      </span>
                      <span className="text-sm font-bold text-white">
                        {formatHungarianDate(promotion.endDate, promotion.endTime)}-ig
                      </span>
                    </div>
                  </div>

                  <span className={isActive ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                    {isActive ? 'Az ajánlat jelenleg elérhető.' : timingStatus === 'Tervezett' ? 'Ez az ajánlat hamarosan elérhető.' : 'Ez az ajánlat már nem érhető el.'}
                  </span>
                </div>
              </div>
            </div>

            {/* "Mit tartalmaz?" list */}
            {promotion.features && promotion.features.length > 0 && (
              <div className="glass-panel rounded-3xl p-6 border border-white/8 mb-8 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-base font-bold font-display text-white">Mit tartalmaz az ajánlat?</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promotion.features.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center gap-2.5 text-xs text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="capitalize">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional info */}
            {promotion.additionalInfo && (
              <div className="glass-panel rounded-3xl p-6 border border-white/8 mb-8 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Feltételek és részletek</h4>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-black/20 p-3 rounded-xl">
                  {promotion.additionalInfo}
                </p>
              </div>
            )}

            {/* CTA Preview */}
            <div className="glass-panel rounded-3xl p-6 border border-indigo-500/30 text-center space-y-4">
              <span className="text-lg font-bold text-white block">
                {isActive ? 'Jelentkezz a promócióra!' : 'Az ajánlat lezárult'}
              </span>
              <button
                type="button"
                disabled={!isActive}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mx-auto disabled:opacity-40"
              >
                <span>{promotion.ctaText || 'Ajánlatot kérek'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
