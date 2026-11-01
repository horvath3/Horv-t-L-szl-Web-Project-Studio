import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, Sparkles, Clock } from 'lucide-react';
import { Promotion } from '../../types';
import { promotionService, formatHungarianDate } from '../../services/storage';

export const TopPromotionBanner: React.FC = () => {
  const [bannerPromo, setBannerPromo] = useState<Promotion | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkBanner = () => {
    const promo = promotionService.getBannerPromotion();
    setBannerPromo(promo);
    if (promo) {
      const dismissed = sessionStorage.getItem(`dismissed_promo_${promo.id}`);
      setIsDismissed(!!dismissed);
    } else {
      setIsDismissed(false);
    }
  };

  useEffect(() => {
    checkBanner();
    window.addEventListener('store_hl_studio_promotions', checkBanner);
    return () => window.removeEventListener('store_hl_studio_promotions', checkBanner);
  }, []);

  if (!bannerPromo || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(`dismissed_promo_${bannerPromo.id}`, 'true');
  };

  return (
    <aside
      aria-label="Kiemelt promóciós ajánlat"
      className="relative z-50 bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950 text-white border-b border-indigo-500/30 shadow-lg shadow-indigo-950/40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Icon, Title, and Short description */}
          <div className="flex items-center gap-3 min-w-0 flex-1 text-center sm:text-left">
            <span className="text-xl shrink-0 p-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              {bannerPromo.icon || '🎁'}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs sm:text-sm font-bold font-display uppercase tracking-wider text-indigo-200">
                  {bannerPromo.title}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{formatHungarianDate(bannerPromo.endDate, bannerPromo.endTime)}-ig</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-xl">
                {bannerPromo.shortDescription}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/ajanlat/${bannerPromo.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-indigo-500/25 active:scale-95"
            >
              <span>További információk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Értesítés bezárása"
              className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Értesítés elrejtése"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
