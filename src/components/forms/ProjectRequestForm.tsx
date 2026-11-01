import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Send,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
  Tag,
  Clock,
  Shield,
  Lock,
  Copy,
  Check,
  Search,
  Upload,
  FileText,
  Gamepad2,
  Globe,
  Info,
  Calendar,
  Bell,
  Plane,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import {
  ProjectType,
  ProjectCategory,
  WebsiteSubtype,
  GameTypeOption,
  GamePlatformOption,
  GameEngineOption,
  ProjectFileAttachment,
  Promotion
} from '../../types';
import {
  requestService,
  promotionService,
  isPromotionActive,
  formatHungarianDate,
  PROJECT_CATEGORIES,
  inferProjectCategory,
  formatCategoryWithIcon
} from '../../services/storage';
import {
  capacityService,
  EffectiveCapacityState,
  LimitCheckResult,
  formatCapacityDateDot,
  formatCapacityDateTimeDot
} from '../../services/capacityService';

const WEBSITE_SUBTYPES: WebsiteSubtype[] = [
  'bemutatkozó oldal',
  'céges oldal',
  'webshop',
  'portfólió',
  'egyéb'
];

const WEBSITE_FEATURE_OPTIONS: string[] = [
  'kapcsolatfelvétel',
  'admin panel',
  'bejelentkezés',
  'adatbázis',
  'AI funkciók',
  'egyéb'
];

const GAME_TYPES: GameTypeOption[] = [
  'Szimulátor',
  'Kalandjáték',
  'Stratégia',
  'Puzzle',
  'Verseny',
  'Egyéb'
];

const GAME_PLATFORMS: GamePlatformOption[] = ['Windows', 'Android', 'iOS', 'Web'];

const GAME_ENGINES: GameEngineOption[] = ['Unity', 'Unreal Engine', 'Godot', 'Nem tudom'];

const GAME_FEATURE_SUGGESTIONS: string[] = [
  'Egyedi játékmechanika & fizika',
  'Karrier / küldetésrendszer',
  'Saját pálya- vagy menetrend-tervező',
  'Fejlődési rendszer & statisztikák',
  'Mentési rendszer & beállítások menü',
  'Hangulatos 3D / 2D látványvilág'
];

const CATEGORY_FEATURE_SUGGESTIONS: Record<ProjectCategory, string[]> = {
  Weboldal: [
    'kapcsolatfelvétel',
    'modern reszponzív dizájn',
    'SEO keresőoptimalizálás',
    'többnyelvűség',
    'tartalomkezelő felület',
    'egyéb'
  ],
  Webalkalmazás: [
    'admin panel',
    'bejelentkezés és felhasználói fiókok',
    'adatbázis kapcsolat',
    'AI funkciók',
    'fizetési rendszer / számlázás',
    'egyéb'
  ],
  'Weboldal / Webalkalmazás': WEBSITE_FEATURE_OPTIONS,
  'Egyedi szoftver': [
    'Asztali alkalmazás felület',
    'Adatbázis kapcsolat',
    'Automatizált folyamatok / konvertálás',
    'PDF / Excel exportálás',
    'Jogosultságkezelés',
    'Egyéb'
  ],
  'AI projekt': [
    'Intelligens AI asszisztens / chat',
    'Dokumentum- és szövegelemzés',
    'Strukturált JSON adatkinyerés',
    'Automatizált munkafolyamat',
    'Meglévő rendszerbe integrálás',
    'Egyéb'
  ],
  Játékprojekt: GAME_FEATURE_SUGGESTIONS,
  Mobilalkalmazás: [
    'Android & iOS támogatás',
    'Bejelentkezés és profil',
    'Push értesítések',
    'Offline működés',
    'REST API / Felhő szinkronizáció',
    'Egyéb'
  ],
  'Egyéb projekt': [
    'Egyedi prototípus fejlesztés',
    'Technológiai tanácsadás',
    'Rendszerintegráció',
    'Modern UI/UX tervezés'
  ]
};

const BUDGET_PRESETS = [
  '300.000 - 600.000 Ft',
  '600.000 - 1.200.000 Ft',
  '1.200.000 - 2.500.000 Ft',
  '2.500.000 Ft felett',
  'Még nem határoztam meg / tanácsot kérek'
];

export const ProjectRequestForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTypeParam = searchParams.get('type');
  const initialCategoryParam = searchParams.get('category');
  const promoParam = searchParams.get('promo'); // slug or id

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resolvedInitialCategory = inferProjectCategory(
    initialTypeParam || undefined,
    initialCategoryParam || initialTypeParam || undefined
  );

  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>(resolvedInitialCategory);

  const [capacityState, setCapacityState] = useState<EffectiveCapacityState>(() =>
    capacityService.getEffectiveState()
  );

  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [isPromoLockedFromUrl, setIsPromoLockedFromUrl] = useState(false);
  const [expiredPromoWarning, setExpiredPromoWarning] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectName: '',
    projectType: (PROJECT_CATEGORIES.find((c) => c.id === resolvedInitialCategory)?.defaultProjectType ||
      'Weboldal') as ProjectType,
    websiteType: 'bemutatkozó oldal' as WebsiteSubtype,
    gameName: '',
    gameType: 'Szimulátor' as GameTypeOption,
    engine: 'Unity' as GameEngineOption,
    inspiration: '',
    referenceLink: '',
    shortDescription: '',
    detailedDescription: '',
    referenceUrl: '',
    deadline: '',
    budget: '',
    notes: '',
    attachmentName: '',
    selectedPromoId: ''
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<GamePlatformOption[]>(['Windows']);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['kapcsolatfelvétel']);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [projectFiles, setProjectFiles] = useState<ProjectFileAttachment[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState('');
  const [submittedCategory, setSubmittedCategory] = useState<ProjectCategory>('Weboldal / Webalkalmazás');
  const [copiedRequestId, setCopiedRequestId] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Capacity Limit & Waitlist States
  const [blockedLimitResult, setBlockedLimitResult] = useState<LimitCheckResult | null>(null);
  const [bypassVisitorCheck, setBypassVisitorCheck] = useState(false);
  const [vipUnlockEmail, setVipUnlockEmail] = useState('');
  const [vipUnlocked, setVipUnlocked] = useState(false);
  const [vipUnlockError, setVipUnlockError] = useState('');

  // Waitlist signup state (Paused or Limited Blocked)
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistCategory, setWaitlistCategory] = useState<ProjectCategory>(resolvedInitialCategory);
  const [waitlistIdea, setWaitlistIdea] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // Clicked paused category error notification
  const [categoryPauseAlert, setCategoryPauseAlert] = useState<{
    catId: ProjectCategory;
    label: string;
    reason: string;
  } | null>(null);

  // If the currently selected category becomes paused in capacity rules, automatically switch to first available
  useEffect(() => {
    const curRule = capacityState.config.categoryRules?.[selectedCategory];
    if (curRule?.paused) {
      const firstAvailable = PROJECT_CATEGORIES.find(
        (c) => !capacityState.config.categoryRules?.[c.id]?.paused
      );
      if (firstAvailable && firstAvailable.id !== selectedCategory) {
        setSelectedCategory(firstAvailable.id);
      }
    }
  }, [capacityState.config.categoryRules]);

  // Sync capacity state
  useEffect(() => {
    const syncCapacity = () => {
      setCapacityState(capacityService.getEffectiveState());
    };
    window.addEventListener('store_hl_studio_capacity', syncCapacity);
    window.addEventListener('store_hl_studio_requests', syncCapacity);
    const timer = setInterval(syncCapacity, 20000);
    return () => {
      window.removeEventListener('store_hl_studio_capacity', syncCapacity);
      window.removeEventListener('store_hl_studio_requests', syncCapacity);
      clearInterval(timer);
    };
  }, []);

  // Check if visitor already has an active limited submission in this browser session
  useEffect(() => {
    if (isSuccess || bypassVisitorCheck) return;
    const state = capacityService.getEffectiveState();
    if (state.effectiveMode === 'limited' || state.config.applyLimitInNormalMode) {
      const visitorCheck = capacityService.checkSubmissionEligibility({
        email: formData.email || undefined,
        category: selectedCategory,
        promoId: formData.selectedPromoId || null,
        useVisitorFallback: true
      });
      if (!visitorCheck.allowed && (visitorCheck.reason === 'user-limit' || visitorCheck.reason === 'category-limit')) {
        setBlockedLimitResult(visitorCheck);
      }
    } else {
      setBlockedLimitResult(null);
    }
  }, [capacityState.effectiveMode, capacityState.config.updatedAt]);

  // Load promotions and handle ?promo= param
  useEffect(() => {
    const active = promotionService.getActive();
    setActivePromotions(active);

    if (promoParam) {
      const found = promotionService.getBySlug(promoParam) || promotionService.getById(promoParam);
      if (found) {
        if (isPromotionActive(found)) {
          setSelectedPromo(found);
          setIsPromoLockedFromUrl(true);
          setFormData((prev) => ({ ...prev, selectedPromoId: found.id }));
          setExpiredPromoWarning(null);

          if (found.projectCategory) {
            handleCategorySelect(found.projectCategory);
          } else if (found.slug.includes('jatek')) {
            handleCategorySelect('Játékprojekt');
          }
        } else {
          setExpiredPromoWarning(
            `A megadott promóciós ajánlat („${found.title}”) időszaka már lezárult. Kérjük, válassz egy másik aktív promóciót, vagy nyújts be normál ajánlatkérést!`
          );
          setSelectedPromo(null);
          setIsPromoLockedFromUrl(false);
        }
      } else {
        setExpiredPromoWarning('A megadott promóciós azonosító nem található.');
      }
    }
  }, [promoParam]);

  useEffect(() => {
    if (initialCategoryParam || initialTypeParam) {
      const cat = inferProjectCategory(
        initialTypeParam || undefined,
        initialCategoryParam || initialTypeParam || undefined
      );
      handleCategorySelect(cat);
    }
  }, [initialCategoryParam, initialTypeParam]);

  const handleCategorySelect = (category: ProjectCategory) => {
    setSelectedCategory(category);
    setWaitlistCategory(category);
    const catDef = PROJECT_CATEGORIES.find((c) => c.id === category);
    const defaultType: ProjectType = catDef ? catDef.defaultProjectType : 'Weboldal';

    setFormData((prev) => ({
      ...prev,
      projectType: defaultType
    }));

    const defaultFeatures = CATEGORY_FEATURE_SUGGESTIONS[category] || [];
    if (defaultFeatures.length > 0) {
      setSelectedFeatures([defaultFeatures[0]]);
    }
  };

  const toggleFeatureOption = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((item) => item !== feat) : [...prev, feat]
    );
  };

  const addCustomFeature = () => {
    const trimmed = newFeatureText.trim();
    if (!trimmed) return;
    if (!selectedFeatures.includes(trimmed)) {
      setSelectedFeatures([...selectedFeatures, trimmed]);
    }
    setNewFeatureText('');
  };

  const removeFeature = (featToRemove: string) => {
    setSelectedFeatures(selectedFeatures.filter((f) => f !== featToRemove));
  };

  const togglePlatform = (plat: GamePlatformOption) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(plat)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== plat);
      }
      return [...prev, plat];
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const added: ProjectFileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      added.push({
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream'
      });
    }

    setProjectFiles((prev) => [...prev, ...added]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (idx: number) => {
    setProjectFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePromoSelect = (promoId: string) => {
    if (!promoId) {
      setSelectedPromo(null);
      setFormData((prev) => ({ ...prev, selectedPromoId: '' }));
      return;
    }
    const p = activePromotions.find((item) => item.id === promoId);
    if (p) {
      setSelectedPromo(p);
      setFormData((prev) => ({ ...prev, selectedPromoId: p.id }));
      if (p.projectCategory) {
        handleCategorySelect(p.projectCategory);
      } else if (p.slug.includes('jatek')) {
        handleCategorySelect('Játékprojekt');
      }
    }
  };

  // Live eligibility preview while user types email
  const liveEmailCheck: LimitCheckResult | null =
    formData.email.trim().includes('@')
      ? capacityService.checkSubmissionEligibility({
          email: formData.email.trim(),
          category: selectedCategory,
          promoId: formData.selectedPromoId || null,
          useVisitorFallback: false
        })
      : null;

  const handleVipUnlockAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setVipUnlockError('');
    const clean = vipUnlockEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setVipUnlockError('Kérjük, adj meg egy érvényes e-mail címet.');
      return;
    }
    const exc = capacityService.getExceptionByEmail(clean);
    if (exc && exc.bypassLimit) {
      setVipUnlocked(true);
      setFormData((prev) => ({
        ...prev,
        email: clean,
        name: prev.name || exc.name || ''
      }));
      setBlockedLimitResult(null);
    } else {
      setVipUnlockError(
        'Ehhez az e-mail címhez jelenleg nincs beállítva egyedi projektlimit-kivétel.'
      );
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistName.trim() || !waitlistEmail.trim() || !waitlistEmail.includes('@')) {
      return;
    }
    capacityService.addToWaitlist({
      name: waitlistName.trim(),
      email: waitlistEmail.trim(),
      projectCategory: waitlistCategory,
      projectIdea: waitlistIdea.trim() || undefined
    });
    setWaitlistSubmitted(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const isGame = selectedCategory === 'Játékprojekt';
    const isWeb = selectedCategory === 'Weboldal / Webalkalmazás';

    if (!formData.name.trim()) {
      setErrorMessage('Kérjük, add meg a nevedet.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Kérjük, érvényes e-mail címet adj meg.');
      return;
    }

    // ==================================================
    // 6. LIMIT ELLENŐRZÉS PROJEKTKÜLDÉS ELŐTT
    // ==================================================
    const eligibility = capacityService.checkSubmissionEligibility({
      email: formData.email.trim(),
      category: selectedCategory,
      promoId: formData.selectedPromoId || null,
      useVisitorFallback: !bypassVisitorCheck
    });

    if (!eligibility.allowed) {
      capacityService.logBlockedAttempt({
        email: formData.email.trim(),
        visitorId: capacityService.getVisitorId(),
        projectCategory: selectedCategory,
        reason: eligibility.reason || 'user-limit',
        lastRequestId: eligibility.lastRequest?.requestId,
        lastRequestDate: eligibility.submittedDateFormatted,
        nextAllowedDate: eligibility.nextAllowedDateFormatted
      });

      if (eligibility.reason === 'paused-mode') {
        setCapacityState(capacityService.getEffectiveState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (eligibility.reason === 'category-paused') {
        setErrorMessage(
          `A(z) „${selectedCategory}” kategória fogadása jelenleg átmenetileg szünetel. Kérjük, válassz másik kategóriát, vagy érdeklődj később!`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // User / Category Limit active -> show the modern blocked screen!
      setBlockedLimitResult(eligibility);
      setWaitlistName(formData.name.trim());
      setWaitlistEmail(formData.email.trim());
      setWaitlistCategory(selectedCategory);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const effectiveProjectName = isGame
      ? formData.gameName.trim() || formData.projectName.trim()
      : formData.projectName.trim();

    if (!effectiveProjectName) {
      setErrorMessage(
        isGame
          ? 'Kérjük, add meg a tervezett játék nevét vagy munkacímét.'
          : 'Kérjük, add meg a tervezett projekt nevét vagy munkacímét.'
      );
      return;
    }

    if (!formData.shortDescription.trim()) {
      setErrorMessage('Kérjük, írj egy rövid leírást a projektről.');
      return;
    }
    if (!formData.detailedDescription.trim()) {
      setErrorMessage('Kérjük, fejtsd ki részletesebben is az elképzelésedet.');
      return;
    }

    // Double check promo expiration at submit time
    let promoToAttach: Promotion | null = selectedPromo;
    if (formData.selectedPromoId) {
      const p = promotionService.getById(formData.selectedPromoId);
      if (p) {
        if (!isPromotionActive(p)) {
          setErrorMessage(
            'A kiválasztott promóció időközben lejárt. Kérjük, válassz másikat vagy küldj be normál ajánlatkérést!'
          );
          return;
        }
        promoToAttach = p;
      }
    }

    setIsSubmitting(true);

    try {
      const effectiveRefLink =
        formData.referenceLink.trim() || formData.referenceUrl.trim() || undefined;
      const combinedAttachmentName =
        projectFiles.length > 0
          ? projectFiles.map((f) => f.name).join(', ')
          : formData.attachmentName.trim() || undefined;

      const resolvedProjectType: ProjectType = isGame
        ? 'Játékprojekt'
        : isWeb
        ? formData.websiteType === 'webshop' || selectedFeatures.includes('admin panel')
          ? 'Webalkalmazás'
          : 'Weboldal'
        : formData.projectType;

      const created = requestService.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        projectName: effectiveProjectName,
        projectType: resolvedProjectType,
        projectCategory: selectedCategory,
        websiteType: isWeb ? formData.websiteType : undefined,
        gameName: isGame ? formData.gameName.trim() || effectiveProjectName : undefined,
        gameType: isGame ? formData.gameType : undefined,
        platform: isGame ? selectedPlatforms.join(', ') : undefined,
        engine: isGame ? formData.engine : undefined,
        inspiration: isGame ? formData.inspiration.trim() || undefined : undefined,
        referenceLink: effectiveRefLink,
        referenceUrl: effectiveRefLink,
        shortDescription: formData.shortDescription.trim(),
        detailedDescription: formData.detailedDescription.trim(),
        requestedFeatures: selectedFeatures,
        requiredFeatures: selectedFeatures,
        projectFiles: projectFiles.length > 0 ? projectFiles : undefined,
        deadline: formData.deadline.trim() || undefined,
        budget: formData.budget.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        attachmentName: combinedAttachmentName,
        promotionId: promoToAttach ? promoToAttach.id : null,
        promotionTitle: promoToAttach
          ? `${promoToAttach.icon || '🎁'} ${promoToAttach.title}`
          : undefined
      });

      // Record submission for visitor & email limit tracking
      capacityService.recordVisitorSubmission(created.requestId, formData.email.trim());

      // Automatically decrement slot quota for the chosen project category
      capacityService.decrementCategorySlot(selectedCategory);

      setSubmittedRequestId(created.requestId);
      setSubmittedCategory(selectedCategory);
      setIsSubmitting(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage('Hiba történt az űrlap elküldésekor. Kérjük, próbáld újra!');
    }
  };

  const handleCopyRequestId = () => {
    if (!submittedRequestId) return;
    try {
      navigator.clipboard.writeText(submittedRequestId);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = submittedRequestId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedRequestId(true);
    setTimeout(() => setCopiedRequestId(false), 2500);
  };

  // ==================================================
  // 9. SZÜNETELTETETT MÓD NÉZET (🔴 Projektbeküldés szüneteltetve)
  // ==================================================
  if (capacityState.effectiveMode === 'paused' && !vipUnlocked && !isSuccess) {
    const { config, effectiveReasonBadge, reopenDateFormatted, isTravelModeEffective, isScheduleActive } =
      capacityState;

    return (
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-rose-500/30 max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="ambient-glow-purple -top-10 -right-10 opacity-40" />

        <div className="relative z-10 text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-4xl flex items-center justify-center mx-auto shadow-xl">
            {isTravelModeEffective ? '✈️' : config.pausedIcon || '🚧'}
          </div>

          {/* Reason & Status Kicker */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold uppercase tracking-wider">
              <span>🔴 Projektbeküldés szüneteltetve</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-200 font-medium">
              <span>Ok: {effectiveReasonBadge}</span>
            </span>
            {isTravelModeEffective && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold">
                <Plane className="w-3.5 h-3.5" />
                <span>Utazási mód</span>
              </span>
            )}
          </div>

          {/* Main Headlines matching Section 9 */}
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
              {config.pausedIcon || '🚧'} {config.pausedTitle || 'Projektbeküldés átmenetileg szünetel'}
            </h2>

            <p className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed">
              {isTravelModeEffective && config.travelCustomNote
                ? config.travelCustomNote
                : config.pausedSubtitle || 'Jelenleg új projektek feldolgozásán dolgozunk.'}
            </p>

            <p className="text-sm text-slate-400 leading-relaxed">
              {config.pausedDescription || 'Hamarosan újra elérhető lesz.'}
            </p>
          </div>

          {/* Scheduled Reopen / Travel Return Box */}
          {(reopenDateFormatted || isScheduleActive || isTravelModeEffective) && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-purple-950/60 border border-indigo-500/35 max-w-xl mx-auto text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                      {isTravelModeEffective
                        ? 'Várható visszatérés és újranyitás:'
                        : 'Időzített szünet vége / Újranyitás:'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold font-mono text-white">
                      {reopenDateFormatted || 'Hamarosan'}
                    </span>
                  </div>
                </div>

                {config.autoRevertToNormal && (
                  <div className="text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Automatikus 🟢 Normál mód</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Waitlist / Notification Signup Form */}
          {config.allowWaitlistSignup && (
            <div className="p-6 rounded-2xl bg-black/40 border border-white/10 max-w-xl mx-auto text-left space-y-4">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider">
                  Értesítést kérek, ha újra indul a projektfogadás
                </h3>
              </div>

              {waitlistSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-200 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-white">
                      Feliratkozásod rögzítettük!
                    </span>
                    <span>
                      Amint újra megnyílik a projektfogadás (🟢 Normál mód), e-mailben értesítünk a megadott címen.
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Add meg az elérhetőségedet, és azonnal küldünk egy értesítést, amint újra fogadunk új projekteket.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Neved *"
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="email"
                      required
                      placeholder="E-mail címed *"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={waitlistCategory}
                      onChange={(e) => setWaitlistCategory(e.target.value as ProjectCategory)}
                      className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {PROJECT_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                          {c.icon} {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Rövid projektötlet / megjegyzés (opcionális)"
                      value={waitlistIdea}
                      onChange={(e) => setWaitlistIdea(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Értesítést kérek az újranyitásról</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* VIP / Exception User Check */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 max-w-xl mx-auto text-left">
            <form onSubmit={handleVipUnlockAttempt} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Kivételes / partner hozzáférés:</span>
              </div>
              <input
                type="email"
                placeholder="Partner e-mail címed..."
                value={vipUnlockEmail}
                onChange={(e) => setVipUnlockEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                Ellenőrzés
              </button>
            </form>
            {vipUnlockError && (
              <p className="text-[11px] text-rose-400 mt-2">{vipUnlockError}</p>
            )}
          </div>

          {/* Navigation Links */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/ajanlat-statusz"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Meglévő ajánlatkérés státusza</span>
            </Link>
            <Link
              to="/projektek"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <span>Referencia projektek megtekintése</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // 6. AKTÍV PROJEKTLIMIT BLOKKOLÓ OLDAL (⏳ Már van aktív projektkérésed)
  // ==================================================
  if (blockedLimitResult && !blockedLimitResult.allowed && !isSuccess) {
    const lastReq = blockedLimitResult.lastRequest;
    const submittedDateStr =
      blockedLimitResult.submittedDateFormatted ||
      (lastReq ? formatCapacityDateDot(lastReq.createdAt) : formatCapacityDateDot(new Date()));
    const nextDateStr = blockedLimitResult.nextAllowedDateFormatted || '—';

    return (
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-amber-500/35 max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="ambient-glow-indigo -top-10 -left-10 opacity-35" />

        <div className="relative z-10 text-center space-y-6">
          {/* Hourglass Icon */}
          <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-4xl flex items-center justify-center mx-auto shadow-xl">
            ⏳
          </div>

          {/* Kicker */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold uppercase tracking-wider">
              <span>🟡 Felhasználói Projektlimit Aktív</span>
            </span>
            {blockedLimitResult.categoryChecked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium">
                <span>
                  {formatCategoryWithIcon(blockedLimitResult.categoryChecked)} (1 projekt /{' '}
                  {blockedLimitResult.applicableLimitDays} nap)
                </span>
              </span>
            )}
          </div>

          {/* Title & Subtitle matching Section 6 */}
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
              {blockedLimitResult.messageTitle || '⏳ Már van aktív projektkérésed'}
            </h2>
            <p className="text-base sm:text-lg text-amber-200 font-medium">
              {blockedLimitResult.messageSubtitle ||
                'Jelenleg egy projekted feldolgozás alatt van.'}
            </p>
            {blockedLimitResult.messageDescription && (
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
                {blockedLimitResult.messageDescription}
              </p>
            )}
          </div>

          {/* Structured Limit Details Box matching Section 5 & 6 */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/95 via-black/80 to-amber-950/30 border border-amber-500/35 max-w-xl mx-auto text-left space-y-4 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Felhasználó:
                </span>
                <span className="text-sm font-bold text-white font-mono break-all">
                  {blockedLimitResult.emailChecked || lastReq?.email || 'Azonosított látogató'}
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Beküldött projekt:
                </span>
                <span className="text-base font-extrabold font-mono text-slate-100">
                  {submittedDateStr}
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold block mb-1">
                  Új projekt beküldése:
                </span>
                <span className="text-lg font-extrabold font-mono text-amber-300">
                  {nextDateStr}
                </span>
              </div>
            </div>

            {lastReq && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-indigo-300">
                      #{lastReq.requestId}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-semibold text-white">{lastReq.projectName}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">
                      Státusz: <strong className="text-emerald-300">{lastReq.publicStatus}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Kategória: {formatCategoryWithIcon(lastReq.projectCategory)} · Hátralévő várakozási idő:{' '}
                    <strong className="text-amber-300">
                      {blockedLimitResult.daysRemaining || 1} nap
                    </strong>
                  </p>
                </div>

                <Link
                  to={`/ajanlat-statusz?id=${encodeURIComponent(lastReq.requestId)}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shrink-0 shadow-md shadow-indigo-600/20"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Státusz megtekintése</span>
                </Link>
              </div>
            )}
          </div>

          {/* Actions: Try different email / VIP check / Back to form */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setBlockedLimitResult(null);
                setBypassVisitorCheck(true);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Másik e-mail cím / Kategória választása</span>
            </button>

            <Link
              to="/kapcsolat"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <span>Kérdésem van a projektemről</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-emerald-500/30 text-center max-w-2xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <span>{formatCategoryWithIcon(submittedCategory)}</span>
          </span>

          {selectedPromo && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
              <span>{selectedPromo.icon || '🎁'}</span>
              <span>Rögzített promóció: {selectedPromo.title}</span>
            </div>
          )}
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold font-display text-white mb-3">
          Az ajánlatkérésed sikeresen megérkezett! 🎉
        </h3>

        <p className="text-sm sm:text-base text-slate-200 mb-6 leading-relaxed bg-black/30 p-4 rounded-2xl border border-white/5">
          {submittedCategory === 'Játékprojekt'
            ? '„A játékprojekt ötleted ajánlatkérését megkaptuk. Hamarosan átnézem az egyedi koncepciódat, és e-mailben felveszem veled a kapcsolatot.”'
            : submittedCategory === 'Weboldal / Webalkalmazás'
            ? '„A weboldal projekted ajánlatkérését megkaptuk. Hamarosan átnézem az elképzelésedet, és e-mailben felveszem veled a kapcsolatot.”'
            : '„Az ajánlatkérésed sikeresen megérkezett. Hamarosan átnézem az elképzelésedet, és e-mailben felveszem veled a kapcsolatot.”'}
        </p>

        {/* Unique Request ID Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/50 border border-indigo-500/40 mb-6 shadow-xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300 block mb-2">
            Az ajánlatkérésed azonosítója:
          </span>

          <div className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-black/60 border border-indigo-500/30 font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-white select-all shadow-inner mb-3">
            {submittedRequestId}
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-5">
            Ezt az azonosítót őrizd meg, mert ezzel később ellenőrizheted az ajánlatkérésed aktuális státuszát.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleCopyRequestId}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              {copiedRequestId ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Azonosító másolva!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-300" />
                  <span>📋 Azonosító másolása</span>
                </>
              )}
            </button>

            <Link
              to={`/ajanlat-statusz?id=${encodeURIComponent(submittedRequestId)}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>🔎 Státusz megtekintése</span>
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
          Fontos tudnivaló: Az ajánlatkérés egyeztetés kezdete, automatikus árat vagy határidőt a rendszer nem generál, a pontos részleteket személyesen dolgozzuk ki.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              setIsSuccess(false);
              setSubmittedRequestId('');
              setFormData({
                name: '',
                email: '',
                projectName: '',
                projectType: 'Weboldal',
                websiteType: 'bemutatkozó oldal',
                gameName: '',
                gameType: 'Szimulátor',
                engine: 'Unity',
                inspiration: '',
                referenceLink: '',
                shortDescription: '',
                detailedDescription: '',
                referenceUrl: '',
                deadline: '',
                budget: '',
                notes: '',
                attachmentName: '',
                selectedPromoId: ''
              });
              setSelectedPromo(null);
              setIsPromoLockedFromUrl(false);
              setProjectFiles([]);
              setSelectedPlatforms(['Windows']);
              setSelectedFeatures(['kapcsolatfelvétel']);
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Új ajánlatkérés leadása
          </button>
          <Link
            to="/projektek"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Elkészült projektek böngészése
          </Link>
        </div>
      </div>
    );
  }

  const isGameCategory = selectedCategory === 'Játékprojekt';
  const isWebCategory = selectedCategory === 'Weboldal / Webalkalmazás';
  const currentFeatureOptions = CATEGORY_FEATURE_SUGGESTIONS[selectedCategory] || [];
  const { config: capConfig, effectiveMode } = capacityState;

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl space-y-8">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {vipUnlocked && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>
            <strong>Kivételes partner hozzáférés aktív:</strong> A projektlimit és a beküldési korlátozás feloldva ehhez az e-mail címhez.
          </span>
        </div>
      )}

      {expiredPromoWarning && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>{expiredPromoWarning}</span>
        </div>
      )}

      {/* PROMOTION SELECTOR / HIGHLIGHT BANNER */}
      {selectedPromo ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/50 to-indigo-950/60 border border-indigo-500/40 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                {selectedPromo.icon || '🎁'}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase font-bold text-indigo-300 tracking-wider">
                    Kiválasztott promóció
                  </span>
                  {selectedPromo.projectCategory && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/25 text-purple-200 border border-purple-500/30 font-semibold">
                      {formatCategoryWithIcon(selectedPromo.projectCategory)}
                    </span>
                  )}
                  {isPromoLockedFromUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Közvetlen linkről aktiválva</span>
                    </span>
                  )}
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white">
                  {selectedPromo.title}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedPromo.shortDescription}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 mt-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>Érvényes: {formatHungarianDate(selectedPromo.endDate, selectedPromo.endTime)}-ig</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              <Link
                to={`/ajanlat/${selectedPromo.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-300 hover:text-white underline underline-offset-4"
              >
                Promóció részletei
              </Link>
              {!isPromoLockedFromUrl && (
                <button
                  type="button"
                  onClick={() => handlePromoSelect('')}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  title="Promóció leválasztása"
                >
                  Leválasztás
                </button>
              )}
            </div>
          </div>
        </div>
      ) : activePromotions.length > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Aktuális promóciók (opcionális)</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {activePromotions.length} aktív ajánlat elérhető
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activePromotions.map((p) => (
              <div
                key={p.id}
                onClick={() => handlePromoSelect(p.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-3 ${
                  formData.selectedPromoId === p.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-black/40 border-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                <span className="text-xl shrink-0">{p.icon || '🎁'}</span>
                <div className="min-w-0">
                  <span className="font-semibold text-white block truncate">{p.title}</span>
                  <span className="text-[11px] text-slate-400 block truncate">{p.shortDescription}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500">
            Ha nem választasz promóciót, az ajánlatkérésed normál projektigényként kerül feldolgozásra.
          </p>
        </div>
      ) : null}

      {/* ==================================================
          1. PROJEKT KATEGÓRIA VÁLASZTÓ (Kategória alapú limittel és szüneteltetéssel)
         ================================================== */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
            01. Első lépés – Kategória kiválasztása
          </span>
          <h3 className="text-lg sm:text-xl font-bold font-display text-white">
            Milyen projektet szeretnél megvalósítani?
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Válaszd ki a projekted fő kategóriáját – az űrlap mezői automatikusan a választásodhoz igazodnak.
          </p>
        </div>

        {/* Clicked Paused Category Error Banner */}
        {categoryPauseAlert && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-red-950/60 to-rose-950/80 border border-rose-500/70 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-xl shadow-rose-950/40 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white text-sm block">
                  A(z) „{categoryPauseAlert.label}” projekt kérés jelenleg szünetel
                </span>
                <p className="text-rose-200 leading-relaxed">
                  <strong className="text-white">Hiba / Indoklás:</strong> {categoryPauseAlert.reason}
                </p>
                <p className="text-slate-400 text-[11px]">
                  Erre a projekttípusra átmenetileg nem lehet új ajánlatot kérni. Kérjük, válassz az elérhető kategóriák közül!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCategoryPauseAlert(null)}
              className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
              title="Bezárás"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {PROJECT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const catRule = capConfig.categoryRules?.[cat.id];
            const isSlotTracking = Boolean(catRule?.slotLimitEnabled);
            const availableSlots =
              typeof catRule?.availableSlots === 'number' ? catRule.availableSlots : 3;
            const totalSlots =
              typeof catRule?.totalSlots === 'number' ? catRule.totalSlots : 5;
            const isZeroSlots = isSlotTracking && availableSlots <= 0;
            const isCatPaused = Boolean(catRule?.paused || isZeroSlots);
            const pauseReasonText = isZeroSlots
              ? catRule?.pauseReason ||
                `A szabad helyek száma elfogyott (0 / ${totalSlots} maradt). A projektfogadás automatikusan szünetel.`
              : catRule?.pauseReason?.trim() ||
                catRule?.customNote?.trim() ||
                'Kapacitáshiány miatt átmenetileg nem fogadunk új megkereséseket ebben a kategóriában.';
            const catLimitDays = capacityService.getApplicableLimitDays(cat.id, capConfig);
            const showLimitInfo =
              !isSlotTracking &&
              ((effectiveMode === 'limited' && capConfig.userLimitEnabled) ||
                capConfig.applyLimitInNormalMode);

            return (
              <div
                key={cat.id}
                className="relative group"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    if (isCatPaused) {
                      e.preventDefault();
                      e.stopPropagation();
                      setCategoryPauseAlert({
                        catId: cat.id,
                        label: cat.label,
                        reason: pauseReasonText
                      });
                      return;
                    }
                    setCategoryPauseAlert(null);
                    handleCategorySelect(cat.id);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 h-full transition-all ${
                    isCatPaused
                      ? 'bg-gradient-to-br from-rose-950/45 via-red-950/30 to-black/60 border-rose-500/70 text-rose-300 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/30 opacity-55 hover:opacity-85 cursor-not-allowed select-none'
                      : isSelected
                      ? 'bg-gradient-to-br from-indigo-600/25 via-indigo-900/40 to-purple-900/30 border-indigo-500 text-white shadow-lg shadow-indigo-600/15 ring-1 ring-indigo-400/40 cursor-pointer'
                      : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/[0.03] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-2xl ${isCatPaused ? 'grayscale-50' : ''}`}>{cat.icon}</span>
                    <div className="flex items-center gap-1.5">
                      {isCatPaused ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-[10px] font-extrabold text-rose-300 uppercase tracking-wider flex items-center gap-1">
                          <span>🚫</span>
                          <span>{isZeroSlots ? 'Betelt (0 hely)' : 'Szünetel'}</span>
                        </span>
                      ) : isSlotTracking ? (
                        availableSlots === 1 ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-[10px] font-bold text-amber-300 flex items-center gap-1 animate-pulse">
                            <span>🔥</span>
                            <span>Már csak 1 hely!</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                            <span>🟢</span>
                            <span>Még {availableSlots} szabad hely</span>
                          </span>
                        )
                      ) : showLimitInfo ? (
                        <span className="text-[10px] font-mono text-amber-300/90">
                          1 projekt / {catLimitDays} nap
                        </span>
                      ) : null}
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isCatPaused
                            ? 'border-rose-500/50 bg-rose-950/60 text-rose-400'
                            : isSelected
                            ? 'border-indigo-400 bg-indigo-500 text-white'
                            : 'border-white/20'
                        }`}
                      >
                        {isCatPaused ? (
                          <span className="text-[9px] font-bold">✕</span>
                        ) : isSelected ? (
                          <Check className="w-2.5 h-2.5" />
                        ) : null}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-sm font-bold font-display block ${
                        isCatPaused
                          ? 'text-rose-200 line-through decoration-rose-500 decoration-2'
                          : 'text-white'
                      }`}
                    >
                      {cat.label}
                    </span>
                    <span
                      className={`text-[11px] leading-snug block mt-1 ${
                        isCatPaused ? 'text-rose-300/70' : 'text-slate-400'
                      }`}
                    >
                      {cat.description}
                    </span>
                  </div>

                  {/* Slot progress bar if quota tracking is enabled and not paused */}
                  {isSlotTracking && !isCatPaused && (
                    <div className="space-y-1 pt-1 border-t border-white/5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Szabad kapacitás:</span>
                        <span className="font-mono font-bold text-white">
                          {availableSlots} / {totalSlots} hely
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            availableSlots === 1
                              ? 'bg-amber-400'
                              : 'bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(8, (availableSlots / Math.max(1, totalSlots)) * 100)
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {isCatPaused && (
                    <div className="pt-2 border-t border-rose-500/20 flex items-center gap-1.5 text-[10px] text-rose-300/90 font-medium">
                      <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">
                        {isZeroSlots ? 'A kvóta betelt (0 hely)' : 'Rámutatáskor: hibaüzenet & ok'}
                      </span>
                    </div>
                  )}
                </button>

                {/* Hover Tooltip / Error Popover when Paused */}
                {isCatPaused && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] w-72 max-w-[85vw] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#1c080d] to-[#120508] border border-rose-500 text-left shadow-2xl shadow-black/80 backdrop-blur-md space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>🚫 Szüneteltetve · Nem választható</span>
                      </div>
                      <p className="text-[11px] text-rose-100 leading-relaxed">
                        <span className="font-semibold text-rose-300">Hiba / Ok:</span>{' '}
                        {pauseReasonText}
                      </p>
                      <span className="block text-[10px] text-rose-400/80 pt-1 border-t border-rose-500/20">
                        Kattintás letiltva. Kérjük, válassz másik elérhető projektet!
                      </span>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="w-3 h-3 bg-[#120508] border-r border-b border-rose-500 transform rotate-45 mx-auto -mt-1.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          2. ÁLTALÁNOS KAPCSOLATTARTÁSI ADATOK (+ Élő Limit Ellenőrzés)
         ================================================== */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <span>02. Kapcsolattartási és alapadatok</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Név <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Pl. Kovács Péter"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              E-mail cím <span className="text-indigo-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="peter@example.hu"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setBypassVisitorCheck(true);
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Live Email Eligibility Feedback */}
        {liveEmailCheck && liveEmailCheck.isVipException && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Kivételes felhasználó ({formData.email.trim()}):</strong> ☑ Projektlimit kikapcsolva – korlátozás nélkül küldhetsz be új projektet.
            </span>
          </div>
        )}

        {liveEmailCheck &&
          !liveEmailCheck.allowed &&
          (liveEmailCheck.reason === 'user-limit' || liveEmailCheck.reason === 'category-limit') && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">⏳</span>
                <div className="space-y-1">
                  <span className="font-bold text-white block">
                    Már van aktív projektkérésed ezzel az e-mail címmel!
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300 font-mono">
                    <span>Beküldött projekt: {liveEmailCheck.submittedDateFormatted}</span>
                    <span>·</span>
                    <span className="text-amber-300 font-bold">
                      Következő beküldési lehetőség: {liveEmailCheck.nextAllowedDateFormatted}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBlockedLimitResult(liveEmailCheck)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold uppercase tracking-wider shrink-0 cursor-pointer"
              >
                Részletek megtekintése
              </button>
            </div>
          )}

        {/* Projekt neve */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={isGameCategory ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Projekt neve / munkacíme <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              required={!isGameCategory || !formData.gameName}
              placeholder={
                isGameCategory
                  ? 'Pl. CityLine Transit – Egyedi Buszszimulátor Projekt'
                  : 'Pl. WebStudio Portál, Egyedi Webshop, AI Asszisztens'
              }
              value={formData.projectName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  projectName: val,
                  gameName: isGameCategory && !prev.gameName ? val : prev.gameName
                }));
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {!isGameCategory && !isWebCategory && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Kiválasztott kategória
              </label>
              <div className="px-4 py-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-sm font-semibold">
                {formatCategoryWithIcon(selectedCategory)}
              </div>
            </div>
          )}

          {/* Section 3: WEBOLDAL / WEBALKALMAZÁS EXTRA MEZŐ – Weboldal típusa */}
          {isWebCategory && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Weboldal típusa <span className="text-indigo-400">*</span></span>
              </label>
              <select
                value={formData.websiteType}
                onChange={(e) =>
                  setFormData({ ...formData, websiteType: e.target.value as WebsiteSubtype })
                }
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors capitalize cursor-pointer"
              >
                {WEBSITE_SUBTYPES.map((wType) => (
                  <option key={wType} value={wType} className="bg-slate-900 text-white capitalize">
                    {wType}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          4. JÁTÉKPROJEKT KATEGÓRIA EXTRA MEZŐK
         ================================================== */}
      {isGameCategory && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/30 border border-indigo-500/30 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                🎮 Játékprojekt Specifikus Adatok
              </h4>
            </div>
            <span className="text-[11px] text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/30">
              Saját ötlet & egyedi játékfejlesztés
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Játék neve */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Játék neve / munkacíme <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Pl. CityLine Transit, CyberPuzzle..."
                value={formData.gameName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    gameName: val,
                    projectName: prev.projectName || val
                  }));
                }}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Játék típusa */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Játék típusa <span className="text-indigo-400">*</span>
              </label>
              <select
                value={formData.gameType}
                onChange={(e) =>
                  setFormData({ ...formData, gameType: e.target.value as GameTypeOption })
                }
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {GAME_TYPES.map((gt) => (
                  <option key={gt} value={gt} className="bg-slate-900 text-white">
                    {gt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Platform & Motor / technológia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Platform (több is választható) <span className="text-indigo-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GAME_PLATFORMS.map((plat) => {
                  const active = selectedPlatforms.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => togglePlatform(plat)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{plat}</span>
                      {active && <Check className="w-3.5 h-3.5 text-indigo-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Motor / technológia, ha ismert
              </label>
              <select
                value={formData.engine}
                onChange={(e) =>
                  setFormData({ ...formData, engine: e.target.value as GameEngineOption })
                }
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {GAME_ENGINES.map((eng) => (
                  <option key={eng} value={eng} className="bg-slate-900 text-white">
                    {eng}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inspiráció & Steam / referencia link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Inspiráció vagy referencia játék (opcionális)
              </label>
              <input
                type="text"
                placeholder="Példa: „Bus Simulator 27”"
                value={formData.inspiration}
                onChange={(e) => setFormData({ ...formData, inspiration: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Steam link / referencia link (opcionális)
              </label>
              <input
                type="url"
                placeholder="https://store.steampowered.com/..."
                value={formData.referenceLink}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    referenceLink: e.target.value,
                    referenceUrl: e.target.value
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Section 11: Fontos biztonsági és jogi megjegyzés */}
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">Fontos szakmai tájékoztató:</strong> A stúdióban készülő játékprojektek mindig{' '}
              <span className="text-indigo-300 font-semibold">saját ötletek, egyedi fejlesztések</span> és{' '}
              <span className="text-indigo-300 font-semibold">inspiráció alapján készülő projektek</span>. Meglévő játékok teljes másolása nem történik; a megadott referencia játék kizárólag hangulati vagy játékmenetbeli inspirációként szolgál.
            </p>
          </div>
        </div>
      )}

      {/* ==================================================
          3. LEÍRÁSOK ÉS PROJEKT ELKÉPZELÉS
         ================================================== */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <span>03. {isGameCategory ? 'Projekt és játékmenet elképzelés' : 'Az elképzelés kifejtése'}</span>
        </h4>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {isGameCategory
              ? 'Rövid leírás – Milyen játékot szeretnél? (1-2 tömör mondat)'
              : 'Projekt rövid leírása (1-2 tömör mondat)'}{' '}
            <span className="text-indigo-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={
              isGameCategory
                ? 'Pl. Egy saját ötleten alapuló városi tömegközlekedési szimulátor egyedi útvonaltervezéssel.'
                : 'Pl. Egy letisztult bemutató weboldal szolgáltatásaink prezentálására és kapcsolatfelvételre.'
            }
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {isGameCategory
              ? 'Részletes elképzelés – Milyen játékmenetet és világot képzeltél el?'
              : 'Részletes elképzelés & célok'}{' '}
            <span className="text-indigo-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            placeholder={
              isGameCategory
                ? 'Milyen játékot szeretnél? Milyen játékmenetet (gameplay loop), kameranézetet, feladatokat vagy saját mechanikákat képzeltél el?'
                : 'Kik a célközönség? Milyen fő problémát old meg az alkalmazás? Milyen stílust vagy struktúrát képzeltél el?'
            }
            value={formData.detailedDescription}
            onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y"
          />
        </div>
      </div>

      {/* ==================================================
          4. SZÜKSÉGES FUNKCIÓK (KATEGÓRIA-SPECIFIKUS + EGYÉNI)
         ================================================== */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
            <span>
              04. {isGameCategory ? 'Milyen funkciók legyenek a játékban?' : 'Szükséges funkciók'}
            </span>
          </h4>
          <span className="text-xs text-slate-500">
            Jelöld be a kívánt elemeket vagy adj hozzá sajátot
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {currentFeatureOptions.map((option) => {
            const isChecked = selectedFeatures.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleFeatureOption(option)}
                className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                    : 'bg-black/30 border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <span className="capitalize">{option}</span>
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                    isChecked
                      ? 'bg-indigo-500 border-indigo-400 text-white'
                      : 'border-white/20 bg-black/40'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 pt-2">
          {selectedFeatures.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {selectedFeatures.map((feat) => (
                <div
                  key={feat}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-xs text-indigo-200"
                >
                  <span>{feat}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(feat)}
                    className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eltávolítás"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={
                isGameCategory
                  ? 'További egyedi játékfunkció hozzáadása (pl. Co-op mód, Időjárás-szimuláció, Mod támogatás)...'
                  : 'További funkció hozzáadása (pl. Időpontfoglaló, Többnyelvűség, Fizetési kapu)...'
              }
              value={newFeatureText}
              onChange={(e) => setNewFeatureText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomFeature();
                }
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={addCustomFeature}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hozzáadás</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          5. REFERENCIA, HATÁRIDŐ, FÁJLFELTÖLTÉS & MEGJEGYZÉS
         ================================================== */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          <span>05. Referencia, Fájlfeltöltés & Ütemezés</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isGameCategory && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Referencia / példa link (opcionális)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.referenceUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    referenceUrl: e.target.value,
                    referenceLink: e.target.value
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Kívánt határidő (opcionális)
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tervezett költségkeret (opcionális)
            </label>
            <select
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                Válassz költségkeretet...
              </option>
              {BUDGET_PRESETS.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isGameCategory
                ? 'Képek, koncepciórajzok vagy dokumentum feltöltése (opcionális)'
                : 'Fájl feltöltés (specifikáció, kép, PDF, dokumentum)'}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-xl bg-black/40 border border-dashed border-white/20 hover:border-indigo-500/60 text-slate-300 text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-white">
                Kattints a fájlok kiválasztásához
              </span>
              <span className="text-[11px] text-slate-500">
                Képek (PNG, JPG, WebP) vagy dokumentumok (PDF, DOCX, TXT)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.zip"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {projectFiles.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {projectFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-200"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{file.name}</span>
                      {file.size && (
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUploadedFile(idx)}
                      className="text-slate-400 hover:text-rose-400 ml-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Drótváz / Figma / Google Drive link (opcionális)
            </label>
            <input
              type="text"
              placeholder="Pl. Figma link, Google Drive mappa..."
              value={formData.attachmentName}
              onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Megjegyzés vagy egyéb kérés (opcionális)
          </label>
          <textarea
            rows={2}
            placeholder="Bármilyen egyéb információ, preferencia, kapcsolattartási idősáv, amit szeretnél megosztani..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Az ajánlatkérés nem jár kötelezettséggel. Minden adatot bizalmasan kezelek.</span>
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Ajánlatkérés feldolgozása...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Ajánlatkérés elküldése</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
