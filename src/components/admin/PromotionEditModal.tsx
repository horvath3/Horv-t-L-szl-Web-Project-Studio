import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Calendar,
  Clock,
  Tag,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { Promotion, ProjectCategory } from '../../types';
import { slugify, promotionService, getProjectCategoryEmoji } from '../../services/storage';

interface PromotionEditModalProps {
  promotion: Promotion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (saved: Promotion) => void;
}

const ICON_PRESETS = ['🎁', '🎮', '🚀', '⚡', '💎', '🏷️', '🔥', '⭐', '✨'];

const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Weboldal / Webalkalmazás',
  'Egyedi szoftver',
  'AI projekt',
  'Játékprojekt',
  'Mobilalkalmazás',
  'Egyéb projekt'
];

export const PromotionEditModal: React.FC<PromotionEditModalProps> = ({
  promotion,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const isEditing = !!promotion;

  const [formData, setFormData] = useState<Partial<Promotion>>({
    title: '',
    shortTitle: '',
    slug: '',
    shortDescription: '',
    fullDescription: '',
    icon: '🎁',
    image: '',
    ctaText: 'Ajánlatot kérek',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '00:00',
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    endTime: '23:59',
    active: true,
    showBanner: true,
    allowRequests: true,
    features: ['modern weboldal', 'reszponzív kialakítás', 'alapvető UI/UX', 'alapfunkciók', 'egyeztetés'],
    additionalInfo: ''
  });

  const [newFeature, setNewFeature] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (promotion) {
      setFormData({ ...promotion });
      setIsSlugManuallyEdited(true);
    } else {
      setFormData({
        title: '',
        shortTitle: '',
        slug: '',
        shortDescription: '',
        fullDescription: '',
        icon: '🎁',
        image: '',
        ctaText: 'Ajánlatot kérek',
        startDate: new Date().toISOString().split('T')[0],
        startTime: '00:00',
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        endTime: '23:59',
        active: true,
        showBanner: true,
        allowRequests: true,
        features: ['modern weboldal', 'reszponzív kialakítás', 'alapvető UI/UX', 'alapfunkciók', 'egyeztetés'],
        additionalInfo: ''
      });
      setIsSlugManuallyEdited(false);
    }
    setErrorMessage('');
  }, [promotion]);

  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const next = { ...prev, title: val };
      if (!isSlugManuallyEdited) {
        next.slug = slugify(val);
      }
      if (!prev.shortTitle || prev.shortTitle === prev.title) {
        next.shortTitle = val;
      }
      return next;
    });
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug: slugify(val) }));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...(prev.features || []), newFeature.trim()]
    }));
    setNewFeature('');
  };

  const removeFeature = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title?.trim()) {
      setErrorMessage('Kérjük, add meg a promóció címét.');
      return;
    }

    if (!formData.slug?.trim()) {
      setErrorMessage('A promóciónak rendelkeznie kell érvényes sluggal.');
      return;
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(`${formData.startDate}T${formData.startTime || '00:00'}:00`);
      const end = new Date(`${formData.endDate}T${formData.endTime || '23:59'}:00`);
      if (end < start) {
        setErrorMessage('A lejárati dátum és idő nem lehet korábbi a kezdési időpontnál!');
        return;
      }
    }

    const res = promotionService.save({
      ...formData,
      id: promotion?.id,
      title: formData.title.trim()
    });

    if (res.error) {
      setErrorMessage(res.error);
      return;
    }

    if (res.promotion) {
      onSave(res.promotion);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel rounded-2xl border border-white/10 w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
              {formData.icon || '🎁'}
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">
                {isEditing ? 'Promóció Szerkesztése' : 'Új Promóció Létrehozása'}
              </h3>
              <p className="text-xs text-slate-400">
                Időszakos akció és automatikus publikus promóciós oldal beállításai.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Alapadatok & Cím */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>01. Címek & URL Slug</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Promóció teljes címe <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pl. Ingyenes weboldal készítés"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Rövid cím (mobilnézet & badge)
                </label>
                <input
                  type="text"
                  placeholder="Pl. Ingyenes Weboldal"
                  value={formData.shortTitle}
                  onChange={(e) => setFormData({ ...formData, shortTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Slug & Icon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Egyedi URL Slug <span className="text-indigo-400">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-black/60 border border-r-0 border-white/10 rounded-l-xl text-slate-500 font-mono text-[11px]">
                    /ajanlat/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="ingyenes-weboldal-2026"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-r-xl bg-black/40 border border-white/10 text-indigo-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ikon választás
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ICON_PRESETS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: ic })}
                      className={`w-8 h-8 rounded-lg border text-base flex items-center justify-center transition-all ${
                        formData.icon === ic
                          ? 'bg-indigo-600/30 border-indigo-500 scale-110 shadow-md shadow-indigo-600/30'
                          : 'bg-black/30 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Project Category */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Célzott Projekt Kategória (Automatikus kategória-előválasztás az űrlapon)
              </label>
              <select
                value={formData.projectCategory || 'Weboldal / Webalkalmazás'}
                onChange={(e) =>
                  setFormData({ ...formData, projectCategory: e.target.value as ProjectCategory })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {PROJECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getProjectCategoryEmoji(cat)} {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Időzítés & Érvényesség */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>02. Érvényességi Időszak & Automatikus Lejárat</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">Kezdés Időpontja</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Dátum</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Idő (Óra:Perc)</label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* End */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">Lejárat Időpontja</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Dátum</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Idő (Óra:Perc)</label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <label className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/15 transition-colors">
                <div>
                  <span className="text-xs font-semibold text-white block">Kézi Aktív Állapot</span>
                  <span className="text-[11px] text-slate-500">Azonnali be/kikapcsolás</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </label>

              <label className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/15 transition-colors">
                <div>
                  <span className="text-xs font-semibold text-white block">Felső Értesítési Sáv</span>
                  <span className="text-[11px] text-slate-500">Banner megjelenítése</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showBanner}
                  onChange={(e) => setFormData({ ...formData, showBanner: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </label>

              <label className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/15 transition-colors">
                <div>
                  <span className="text-xs font-semibold text-white block">Jelentkezési lehetőség</span>
                  <span className="text-[11px] text-slate-500">Ajánlatkérés nyitva</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowRequests}
                  onChange={(e) => setFormData({ ...formData, allowRequests: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* 3. Szövegek & Leírás */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>03. Szöveges Tartalom & CTA</span>
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Rövid leírás (bannerhez és kártyákhoz) <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Pl. Most egy meghatározott időszakban ingyen elkészítek egy weboldalt a jelentkezők számára."
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Teljes promóciós leírás <span className="text-indigo-400">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Részletes bemutatás a promócióról, a megvalósítás menetéről és az értékről..."
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  CTA Gomb Szövege
                </label>
                <input
                  type="text"
                  placeholder="Ajánlatot kérek"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Borítókép URL (opcionális)
                </label>
                <input
                  type="text"
                  placeholder="/src/assets/images/... vagy https://..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 4. "Mit tartalmaz?" elemek */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>04. „Mit tartalmaz?” elemek</span>
              </h4>
              <span className="text-[11px] text-slate-500">Publikus oldalon kiemelt pontok</span>
            </div>

            <div className="space-y-2">
              {(formData.features || []).map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/30 border border-white/5 text-xs text-slate-200">
                  <span>{feat}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Új pont hozzáadása (pl. Modern weboldal, Reszponzív kialakítás)..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Hozzáadás</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. További információk & feltételek */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <span>05. Feltételek és további információk</span>
            </h4>
            <textarea
              rows={3}
              placeholder="Az ajánlat feltételei, kiknek szól, kiválasztási folyamat részletei..."
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Mégse
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Módosítások mentése' : 'Promóció Létrehozása'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
