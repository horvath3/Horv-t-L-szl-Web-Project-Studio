import {
  CapacityBlockedAttempt,
  CapacityExceptionUser,
  CapacityMode,
  CapacityWaitlistItem,
  CategoryCapacityRule,
  PauseReasonType,
  ProjectCapacityConfig,
  ProjectCategory,
  ProjectRequest
} from '../types';
import { requestService, notificationService, settingsService } from './storage';
import { pushKeyToServer } from './syncService';

const KEYS = {
  CAPACITY_CONFIG: 'hl_studio_capacity_config_v1',
  CAPACITY_EXCEPTIONS: 'hl_studio_capacity_exceptions_v1',
  CAPACITY_WAITLIST: 'hl_studio_capacity_waitlist_v1',
  CAPACITY_BLOCKED_LOG: 'hl_studio_capacity_blocked_log_v1',
  VISITOR_ID: 'hl_studio_visitor_id_v1',
  VISITOR_REQUESTS: 'hl_studio_visitor_requests_v1'
};

export const PAUSE_REASON_OPTIONS: {
  id: PauseReasonType;
  emoji: string;
  label: string;
  defaultSubtitle: string;
  defaultDescription: string;
}[] = [
  {
    id: 'travel',
    emoji: '📅',
    label: 'Utazás / szabadság',
    defaultSubtitle: 'Jelenleg utazás / szabadság miatt a projektfogadás átmenetileg szünetel.',
    defaultDescription: 'A visszatérés után újra teljes kapacitással fogadjuk az új projektötleteket és ajánlatkéréseket.'
  },
  {
    id: 'busy',
    emoji: '🚀',
    label: 'Sok folyamatban lévő projekt',
    defaultSubtitle: 'Jelenleg új projektek feldolgozásán dolgozunk.',
    defaultDescription: 'A futó megbízások magas minőségű megvalósítása érdekében átmenetileg szüneteltetjük az új igények befogadását. Hamarosan újra elérhető lesz.'
  },
  {
    id: 'development',
    emoji: '🛠',
    label: 'Fejlesztési időszak',
    defaultSubtitle: 'Belső rendszer- és szoftverfejlesztési időszak zajlik.',
    defaultDescription: 'Jelenleg saját stúdióprojektek és új technológiai modulok fejlesztésén dolgozunk. Hamarosan újra elérhető lesz.'
  },
  {
    id: 'other',
    emoji: '📌',
    label: 'Egyéb',
    defaultSubtitle: 'Jelenleg új projektek feldolgozásán dolgozunk.',
    defaultDescription: 'Hamarosan újra elérhető lesz.'
  }
];

export const DEFAULT_CATEGORY_RULES: Record<ProjectCategory, CategoryCapacityRule> = {
  Weboldal: {
    category: 'Weboldal',
    limitDays: 7,
    paused: false,
    pauseReason: 'Kapacitáshiány miatt átmenetileg nem fogadunk új weboldal megbízásokat.',
    customNote: 'Weboldal projektek: 7 napos ciklus',
    slotLimitEnabled: true,
    availableSlots: 3,
    totalSlots: 5
  },
  Webalkalmazás: {
    category: 'Webalkalmazás',
    limitDays: 7,
    paused: false,
    pauseReason: 'Fejlesztési időszak miatt a webalkalmazás projektek fogadása szünetel.',
    customNote: 'Webalkalmazás projektek: 7 napos ciklus',
    slotLimitEnabled: true,
    availableSlots: 2,
    totalSlots: 3
  },
  'Weboldal / Webalkalmazás': {
    category: 'Weboldal / Webalkalmazás',
    limitDays: 7,
    paused: false,
    pauseReason: 'Átmenetileg nem fogadunk új webes megbízásokat.',
    customNote: 'Weboldal és webalkalmazás projektek: 7 napos ciklus',
    slotLimitEnabled: false,
    availableSlots: 3,
    totalSlots: 5
  },
  Játékprojekt: {
    category: 'Játékprojekt',
    limitDays: 30,
    paused: false,
    pauseReason: 'A meglévő játékfejlesztések kapacitása betelt.',
    customNote: 'Komplex 2D/3D játékprojektek: 30 napos ciklus',
    slotLimitEnabled: true,
    availableSlots: 1,
    totalSlots: 2
  },
  Mobilalkalmazás: {
    category: 'Mobilalkalmazás',
    limitDays: 14,
    paused: false,
    pauseReason: 'Mobilfejlesztési kapacitásunk átmenetileg le van kötve.',
    customNote: 'iOS és Android mobilalkalmazások: 14 napos ciklus',
    slotLimitEnabled: true,
    availableSlots: 2,
    totalSlots: 3
  },
  'Egyedi szoftver': {
    category: 'Egyedi szoftver',
    limitDays: 14,
    paused: false,
    pauseReason: 'Egyedi szoftverfejlesztési időszak miatt új megkeresések szünetelnek.',
    customNote: 'Egyedi asztali és üzleti szoftverek: 14 napos ciklus',
    slotLimitEnabled: true,
    availableSlots: 2,
    totalSlots: 3
  },
  'AI projekt': {
    category: 'AI projekt',
    limitDays: 14,
    paused: false,
    pauseReason: 'AI modellfejlesztési időszak zajlik, új igények átmenetileg szünetelnek.',
    customNote: 'AI integráció és intelligens rendszerek: 14 napos ciklus',
    slotLimitEnabled: true,
    availableSlots: 2,
    totalSlots: 4
  },
  'Egyéb projekt': {
    category: 'Egyéb projekt',
    limitDays: 7,
    paused: false,
    pauseReason: 'Egyéb egyedi projektek fogadása átmenetileg szünetel.',
    customNote: 'Egyéb egyedi digitális projektek: 7 napos ciklus',
    slotLimitEnabled: true,
    availableSlots: 3,
    totalSlots: 5
  }
};

function getTodayIsoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DEFAULT_CAPACITY_CONFIG: ProjectCapacityConfig = {
  mode: 'normal',
  bannerEnabled: true,
  bannerIcon: '⚠️',
  bannerTitle: 'Megnövekedett projektterhelés',
  bannerText:
    'Jelenleg több projekt megvalósításán dolgozunk.\nÚj projektötleteket továbbra is fogadunk, azonban a feldolgozási idő hosszabb lehet.',
  bannerPlacement: 'both',
  bannerTheme: 'amber',
  estimatedResponseTimeText: '48–96 órán belül (megnövekedett terhelés)',
  userLimitEnabled: true,
  applyLimitInNormalMode: false,
  blockIfActiveRequestInProgress: true,
  limitPreset: 7,
  customLimitDays: 10,
  maxRequestsPerPeriod: 1,
  limitBlockedTitle: '⏳ Már van aktív projektkérésed',
  limitBlockedSubtitle: 'Jelenleg egy projekted feldolgozás alatt van.',
  limitBlockedDescription:
    'A projektek alapos, személyes kidolgozása érdekében korlátozott módban egy felhasználótól meghatározott időközönként fogadunk új ajánlatkérést.',
  useCategorySpecificLimits: true,
  categoryRules: DEFAULT_CATEGORY_RULES,
  pauseReason: 'busy',
  pauseCustomReasonText: '',
  pausedIcon: '🚧',
  pausedTitle: 'Projektbeküldés átmenetileg szünetel',
  pausedSubtitle: 'Jelenleg új projektek feldolgozásán dolgozunk.',
  pausedDescription: 'Hamarosan újra elérhető lesz.',
  allowWaitlistSignup: true,
  autoNotifyWaitlistOnReopen: true,
  allowPromoOverrideInLimited: false,
  scheduleEnabled: false,
  scheduleTargetMode: 'paused',
  scheduleStartDate: getTodayIsoDate(0),
  scheduleStartTime: '08:00',
  scheduleEndDate: getTodayIsoDate(7),
  scheduleEndTime: '20:00',
  autoRevertToNormal: true,
  travelModeActive: false,
  travelStartDate: getTodayIsoDate(0),
  travelReturnDate: getTodayIsoDate(7),
  travelBehavior: 'pause',
  travelCustomNote:
    'Jelenleg utazás / szabadság miatt a projektfogadás átmenetileg szünetel. A megadott dátum után újra várjuk a megkereséseket!',
  autoLimitedThresholdEnabled: false,
  autoLimitedActiveRequestsThreshold: 5,
  updatedAt: new Date().toISOString()
};

const INITIAL_EXCEPTIONS: CapacityExceptionUser[] = [
  {
    id: 'exc-vip-1',
    email: 'vip.partner@example.hu',
    name: 'Kiemelt Stúdió Partner',
    bypassLimit: true,
    bypassPause: true,
    note: 'Állandó visszatérő partner – projektlimit kikapcsolva',
    createdAt: '2026-09-20T10:00:00Z'
  }
];

/**
 * Formats a date string or Date object as YYYY.MM.DD. (e.g. 2026.09.27.)
 */
export function formatCapacityDateDot(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    // Handle YYYY-MM-DD directly if needed
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return `${dateInput.replace(/-/g, '.')}.`;
    }
    return String(dateInput);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}.`;
}

export function formatCapacityDateTimeDot(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return '—';
  const cleanDate = dateStr.includes('-') ? `${dateStr.replace(/-/g, '.')}.` : dateStr;
  return timeStr ? `${cleanDate} ${timeStr}` : cleanDate;
}

export function getModeBadgeInfo(mode: CapacityMode): {
  emoji: string;
  label: string;
  shortLabel: string;
  colorClass: string;
  dotClass: string;
} {
  if (mode === 'normal') {
    return {
      emoji: '🟢',
      label: 'Normál mód',
      shortLabel: 'Normál',
      colorClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dotClass: 'bg-emerald-400'
    };
  }
  if (mode === 'limited') {
    return {
      emoji: '🟡',
      label: 'Korlátozott mód',
      shortLabel: 'Korlátozott',
      colorClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-400'
    };
  }
  return {
    emoji: '🔴',
    label: 'Szüneteltetett mód',
    shortLabel: 'Szüneteltetve',
    colorClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotClass: 'bg-rose-400'
  };
}

export function getPauseReasonMeta(reason: PauseReasonType, customText?: string) {
  const found = PAUSE_REASON_OPTIONS.find((r) => r.id === reason) || PAUSE_REASON_OPTIONS[1];
  return {
    ...found,
    displayLabel:
      reason === 'other' && customText?.trim()
        ? `${found.emoji} ${customText.trim()}`
        : `${found.emoji} ${found.label}`
  };
}

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(`store_${key}`));
    window.dispatchEvent(new Event('store_hl_studio_capacity'));
    pushKeyToServer(key, value);
  } catch (e) {
    console.error('Storage error in capacityService:', e);
  }
}

export interface EffectiveCapacityState {
  effectiveMode: CapacityMode;
  configuredMode: CapacityMode;
  isScheduleActive: boolean;
  isScheduleUpcoming: boolean;
  isTravelModeEffective: boolean;
  isAutoThresholdTriggered: boolean;
  activeRequestsCount: number;
  effectivePauseReason: PauseReasonType;
  effectiveReasonBadge: string;
  reopenDateFormatted: string | null;
  config: ProjectCapacityConfig;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: 'user-limit' | 'category-limit' | 'paused-mode' | 'category-paused';
  isVipException?: boolean;
  effectiveMode: CapacityMode;
  emailChecked?: string;
  categoryChecked?: ProjectCategory;
  applicableLimitDays: number;
  lastRequest?: ProjectRequest;
  submittedDateFormatted?: string;
  nextAllowedDateFormatted?: string;
  daysRemaining?: number;
  messageTitle?: string;
  messageSubtitle?: string;
  messageDescription?: string;
}

export interface UserCapacitySummaryRow {
  email: string;
  name: string;
  lastRequest: ProjectRequest;
  totalRequestsCount: number;
  activeRequestsCount: number;
  lastSubmittedDateFormatted: string;
  nextAllowedDateFormatted: string;
  applicableLimitDays: number;
  isCurrentlyLimited: boolean;
  daysRemaining: number;
  isVipException: boolean;
  exceptionItem?: CapacityExceptionUser;
}

export const capacityService = {
  getConfig(): ProjectCapacityConfig {
    const saved = getLocal<Partial<ProjectCapacityConfig>>(KEYS.CAPACITY_CONFIG, {});
    const mergedCategoryRules: Record<ProjectCategory, CategoryCapacityRule> = {
      ...DEFAULT_CATEGORY_RULES,
      ...(saved.categoryRules || {})
    };
    for (const key of Object.keys(DEFAULT_CATEGORY_RULES) as ProjectCategory[]) {
      if (!mergedCategoryRules[key]) {
        mergedCategoryRules[key] = { ...DEFAULT_CATEGORY_RULES[key] };
      } else {
        if (!mergedCategoryRules[key].pauseReason) {
          mergedCategoryRules[key].pauseReason = DEFAULT_CATEGORY_RULES[key]?.pauseReason || 'Átmenetileg nem fogadunk új megkereséseket.';
        }
        if (mergedCategoryRules[key].slotLimitEnabled === undefined) {
          mergedCategoryRules[key].slotLimitEnabled = DEFAULT_CATEGORY_RULES[key]?.slotLimitEnabled ?? true;
        }
        if (mergedCategoryRules[key].availableSlots === undefined) {
          mergedCategoryRules[key].availableSlots = DEFAULT_CATEGORY_RULES[key]?.availableSlots ?? 3;
        }
        if (mergedCategoryRules[key].totalSlots === undefined) {
          mergedCategoryRules[key].totalSlots = DEFAULT_CATEGORY_RULES[key]?.totalSlots ?? 5;
        }
      }
    }
    return {
      ...DEFAULT_CAPACITY_CONFIG,
      ...saved,
      categoryRules: mergedCategoryRules
    };
  },

  decrementCategorySlot(category: ProjectCategory): { remaining: number; paused: boolean } {
    const config = this.getConfig();
    const rule = config.categoryRules[category];
    if (!rule || !rule.slotLimitEnabled) {
      return { remaining: -1, paused: Boolean(rule?.paused) };
    }
    const currentAvailable = typeof rule.availableSlots === 'number' ? rule.availableSlots : (rule.totalSlots || 3);
    const newAvailable = Math.max(0, currentAvailable - 1);
    const shouldPause = newAvailable === 0;

    const nextConfig: ProjectCapacityConfig = {
      ...config,
      categoryRules: {
        ...config.categoryRules,
        [category]: {
          ...rule,
          category,
          availableSlots: newAvailable,
          paused: shouldPause ? true : rule.paused,
          pauseReason: shouldPause
            ? (rule.pauseReason || 'A havi szabad helyek beteltek. Jelenleg átmenetileg nem fogadunk új megbízást.')
            : rule.pauseReason
        }
      }
    };
    this.saveConfig(nextConfig);
    return { remaining: newAvailable, paused: shouldPause || rule.paused };
  },

  saveConfig(partialOrFull: Partial<ProjectCapacityConfig>): ProjectCapacityConfig {
    const current = this.getConfig();
    const updated: ProjectCapacityConfig = {
      ...current,
      ...partialOrFull,
      categoryRules: {
        ...current.categoryRules,
        ...(partialOrFull.categoryRules || {})
      },
      updatedAt: new Date().toISOString()
    };
    setLocal(KEYS.CAPACITY_CONFIG, updated);
    return updated;
  },

  setMode(mode: CapacityMode): ProjectCapacityConfig {
    const current = this.getConfig();
    const patch: Partial<ProjectCapacityConfig> = { mode };
    // If admin manually switches to normal mode, turn off travel mode override so it doesn't stay stuck
    if (mode === 'normal' && current.travelModeActive) {
      patch.travelModeActive = false;
    }
    const updated = this.saveConfig(patch);
    if ((mode === 'normal' || mode === 'limited') && updated.autoNotifyWaitlistOnReopen !== false) {
      void this.autoNotifyPendingWaitlistOnReopen();
    }
    return updated;
  },

  toggleTravelMode(active: boolean, returnDate?: string, behavior?: 'pause' | 'limited'): ProjectCapacityConfig {
    const current = this.getConfig();
    const resolvedBehavior = behavior || current.travelBehavior || 'pause';
    const resolvedReturnDate = returnDate || current.travelReturnDate || getTodayIsoDate(7);
    if (active) {
      return this.saveConfig({
        travelModeActive: true,
        travelStartDate: getTodayIsoDate(0),
        travelReturnDate: resolvedReturnDate,
        travelBehavior: resolvedBehavior,
        mode: resolvedBehavior === 'pause' ? 'paused' : 'limited',
        pauseReason: 'travel'
      });
    } else {
      const updated = this.saveConfig({
        travelModeActive: false,
        mode: 'normal'
      });
      if (updated.autoNotifyWaitlistOnReopen !== false) {
        void this.autoNotifyPendingWaitlistOnReopen();
      }
      return updated;
    }
  },

  getActiveRequestsCount(): number {
    const all = requestService.getAll();
    const closedStatuses = ['Elkészült', 'Lezárva', 'Elutasítva'];
    return all.filter((r) => !closedStatuses.includes(r.internalStatus || r.status)).length;
  },

  /**
   * Computes the real-time effective capacity state, automatically reverting expired schedules or travel mode to Normal Mode.
   */
  getEffectiveState(): EffectiveCapacityState {
    let config = this.getConfig();
    const now = new Date();

    // 1. Check Travel Mode expiration
    if (config.travelModeActive && config.travelReturnDate) {
      const returnEnd = new Date(`${config.travelReturnDate}T23:59:59`);
      if (!isNaN(returnEnd.getTime()) && now > returnEnd) {
        config = this.saveConfig({
          travelModeActive: false,
          mode: 'normal'
        });
        if (config.autoNotifyWaitlistOnReopen !== false) {
          void this.autoNotifyPendingWaitlistOnReopen();
        }
      }
    }

    // 2. Check Scheduled Pause / Limit
    let isScheduleActive = false;
    let isScheduleUpcoming = false;

    if (config.scheduleEnabled && config.scheduleStartDate && config.scheduleEndDate) {
      const startDt = new Date(`${config.scheduleStartDate}T${config.scheduleStartTime || '00:00'}:00`);
      const endDt = new Date(`${config.scheduleEndDate}T${config.scheduleEndTime || '23:59'}:59`);

      if (!isNaN(startDt.getTime()) && !isNaN(endDt.getTime())) {
        if (now >= startDt && now <= endDt) {
          isScheduleActive = true;
        } else if (now < startDt) {
          isScheduleUpcoming = true;
        } else if (now > endDt && config.autoRevertToNormal) {
          // Schedule expired -> automatically revert to Normal Mode
          config = this.saveConfig({
            scheduleEnabled: false,
            mode: 'normal',
            travelModeActive: false
          });
          if (config.autoNotifyWaitlistOnReopen !== false) {
            void this.autoNotifyPendingWaitlistOnReopen();
          }
        }
      }
    }

    const activeRequestsCount = this.getActiveRequestsCount();
    let effectiveMode: CapacityMode = config.mode;
    let isAutoThresholdTriggered = false;

    if (config.travelModeActive) {
      effectiveMode = config.travelBehavior === 'pause' ? 'paused' : 'limited';
    } else if (isScheduleActive) {
      effectiveMode = config.scheduleTargetMode;
    } else if (
      effectiveMode === 'normal' &&
      config.autoLimitedThresholdEnabled &&
      activeRequestsCount >= config.autoLimitedActiveRequestsThreshold
    ) {
      effectiveMode = 'limited';
      isAutoThresholdTriggered = true;
    }

    const effectivePauseReason: PauseReasonType = config.travelModeActive
      ? 'travel'
      : config.pauseReason;

    const reasonMeta = getPauseReasonMeta(effectivePauseReason, config.pauseCustomReasonText);

    let reopenDateFormatted: string | null = null;
    if (config.travelModeActive && config.travelReturnDate) {
      reopenDateFormatted = formatCapacityDateDot(config.travelReturnDate);
    } else if (isScheduleActive && config.scheduleEndDate) {
      reopenDateFormatted = formatCapacityDateTimeDot(config.scheduleEndDate, config.scheduleEndTime);
    } else if (config.scheduleEnabled && effectiveMode === 'paused' && config.scheduleEndDate) {
      reopenDateFormatted = formatCapacityDateTimeDot(config.scheduleEndDate, config.scheduleEndTime);
    }

    return {
      effectiveMode,
      configuredMode: config.mode,
      isScheduleActive,
      isScheduleUpcoming,
      isTravelModeEffective: config.travelModeActive,
      isAutoThresholdTriggered,
      activeRequestsCount,
      effectivePauseReason,
      effectiveReasonBadge: reasonMeta.displayLabel,
      reopenDateFormatted,
      config
    };
  },

  // ==================================================
  // VISITOR & CLIENT TRACKING
  // ==================================================
  getVisitorId(): string {
    try {
      let vid = localStorage.getItem(KEYS.VISITOR_ID);
      if (!vid) {
        vid = `vis-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
        localStorage.setItem(KEYS.VISITOR_ID, vid);
      }
      return vid;
    } catch {
      return 'vis-anonymous';
    }
  },

  getVisitorSubmittedRequests(): { requestId: string; email: string; timestamp: string }[] {
    return getLocal<{ requestId: string; email: string; timestamp: string }[]>(KEYS.VISITOR_REQUESTS, []);
  },

  recordVisitorSubmission(requestId: string, email: string): void {
    const current = this.getVisitorSubmittedRequests();
    const updated = [
      { requestId, email: email.trim().toLowerCase(), timestamp: new Date().toISOString() },
      ...current.filter((item) => item.requestId !== requestId)
    ];
    setLocal(KEYS.VISITOR_REQUESTS, updated);
  },

  clearVisitorSessionLock(): void {
    setLocal(KEYS.VISITOR_REQUESTS, []);
  },

  // ==================================================
  // EXCEPTION USERS (7. KIVÉTELES FELHASZNÁLÓK)
  // ==================================================
  getExceptions(): CapacityExceptionUser[] {
    const raw = localStorage.getItem(KEYS.CAPACITY_EXCEPTIONS);
    if (!raw) {
      setLocal(KEYS.CAPACITY_EXCEPTIONS, INITIAL_EXCEPTIONS);
      return INITIAL_EXCEPTIONS;
    }
    return getLocal<CapacityExceptionUser[]>(KEYS.CAPACITY_EXCEPTIONS, INITIAL_EXCEPTIONS);
  },

  getExceptionByEmail(email?: string): CapacityExceptionUser | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    return this.getExceptions().find((item) => item.email.trim().toLowerCase() === clean);
  },

  isExceptionUser(email?: string): boolean {
    const found = this.getExceptionByEmail(email);
    return !!(found && found.bypassLimit);
  },

  upsertException(data: {
    email: string;
    name?: string;
    bypassLimit: boolean;
    bypassPause?: boolean;
    note?: string;
  }): CapacityExceptionUser {
    const cleanEmail = data.email.trim().toLowerCase();
    const list = this.getExceptions();
    const existingIdx = list.findIndex((item) => item.email.trim().toLowerCase() === cleanEmail);

    if (existingIdx !== -1) {
      const updatedItem: CapacityExceptionUser = {
        ...list[existingIdx],
        email: cleanEmail,
        name: data.name ?? list[existingIdx].name,
        bypassLimit: data.bypassLimit,
        bypassPause: data.bypassPause ?? list[existingIdx].bypassPause,
        note: data.note ?? list[existingIdx].note
      };
      list[existingIdx] = updatedItem;
      setLocal(KEYS.CAPACITY_EXCEPTIONS, list);
      return updatedItem;
    }

    const newItem: CapacityExceptionUser = {
      id: `exc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      name: data.name?.trim() || undefined,
      bypassLimit: data.bypassLimit,
      bypassPause: data.bypassPause ?? false,
      note: data.note?.trim() || 'Projektlimit kikapcsolva',
      createdAt: new Date().toISOString()
    };
    const updated = [newItem, ...list];
    setLocal(KEYS.CAPACITY_EXCEPTIONS, updated);
    return newItem;
  },

  toggleExceptionForEmail(email: string, name?: string): boolean {
    const existing = this.getExceptionByEmail(email);
    if (existing) {
      const nextState = !existing.bypassLimit;
      this.upsertException({
        email,
        name: name || existing.name,
        bypassLimit: nextState,
        bypassPause: existing.bypassPause,
        note: nextState ? 'Projektlimit kikapcsolva (Admin)' : 'Kivétel felfüggesztve'
      });
      return nextState;
    } else {
      this.upsertException({
        email,
        name,
        bypassLimit: true,
        bypassPause: false,
        note: 'Projektlimit kikapcsolva (Admin)'
      });
      return true;
    }
  },

  deleteException(id: string): void {
    const list = this.getExceptions().filter((item) => item.id !== id);
    setLocal(KEYS.CAPACITY_EXCEPTIONS, list);
  },

  // ==================================================
  // LIMIT CALCULATION & CHECK (5., 6., 8. FEJEZETEK)
  // ==================================================
  getApplicableLimitDays(category?: ProjectCategory, configOverride?: ProjectCapacityConfig): number {
    const config = configOverride || this.getConfig();
    if (config.useCategorySpecificLimits && category && config.categoryRules[category]) {
      return Math.max(1, Number(config.categoryRules[category].limitDays) || 7);
    }
    if (config.limitPreset === 'custom') {
      return Math.max(1, Number(config.customLimitDays) || 7);
    }
    return Number(config.limitPreset) || 7;
  },

  checkSubmissionEligibility(params: {
    email?: string;
    category?: ProjectCategory;
    promoId?: string | null;
    useVisitorFallback?: boolean;
  }): LimitCheckResult {
    const state = this.getEffectiveState();
    const { config, effectiveMode } = state;
    const cleanEmail = params.email?.trim().toLowerCase() || '';
    const category = params.category;
    const applicableLimitDays = this.getApplicableLimitDays(category, config);

    // Check VIP Exception first
    const exception = cleanEmail ? this.getExceptionByEmail(cleanEmail) : undefined;
    if (exception && exception.bypassLimit) {
      if (effectiveMode === 'paused' && !exception.bypassPause) {
        return {
          allowed: false,
          reason: 'paused-mode',
          isVipException: true,
          effectiveMode,
          emailChecked: cleanEmail,
          categoryChecked: category,
          applicableLimitDays,
          messageTitle: config.pausedTitle,
          messageSubtitle: config.pausedSubtitle,
          messageDescription: config.pausedDescription
        };
      }
      return {
        allowed: true,
        isVipException: true,
        effectiveMode,
        emailChecked: cleanEmail,
        categoryChecked: category,
        applicableLimitDays
      };
    }

    // 1. Check Paused Mode
    if (effectiveMode === 'paused') {
      return {
        allowed: false,
        reason: 'paused-mode',
        effectiveMode,
        emailChecked: cleanEmail,
        categoryChecked: category,
        applicableLimitDays,
        messageTitle: config.pausedTitle,
        messageSubtitle: config.pausedSubtitle,
        messageDescription: config.pausedDescription
      };
    }

    // 2. Check Category Paused or Zero Slots Remaining
    const catRule = category ? config.categoryRules[category] : undefined;
    const isSlotsExhausted = Boolean(
      catRule?.slotLimitEnabled &&
      typeof catRule?.availableSlots === 'number' &&
      catRule.availableSlots <= 0
    );

    if (category && (catRule?.paused || isSlotsExhausted)) {
      return {
        allowed: false,
        reason: 'category-paused',
        effectiveMode,
        emailChecked: cleanEmail,
        categoryChecked: category,
        applicableLimitDays,
        messageTitle: `🚧 A(z) „${category}” kategória fogadása átmenetileg szünetel`,
        messageSubtitle:
          isSlotsExhausted
            ? (catRule?.pauseReason || 'A havi szabad helyek beteltek. Jelenleg átmenetileg nem fogadunk új megbízást ebben a kategóriában.')
            : (catRule?.pauseReason || catRule?.customNote || 'Jelenleg ebben a kategóriában több projekt megvalósításán dolgozunk.'),
        messageDescription: 'Válassz másik projektkategóriát, vagy kérj értesítést az újranyitásról!'
      };
    }

    // 3. Check if Promo Override is enabled in Limited mode
    if (effectiveMode === 'limited' && params.promoId && config.allowPromoOverrideInLimited) {
      return {
        allowed: true,
        effectiveMode,
        emailChecked: cleanEmail,
        categoryChecked: category,
        applicableLimitDays
      };
    }

    // 4. Determine if User Limit should be enforced
    const shouldEnforceLimit =
      (effectiveMode === 'limited' && config.userLimitEnabled) ||
      (effectiveMode === 'normal' && config.applyLimitInNormalMode);

    if (!shouldEnforceLimit) {
      return {
        allowed: true,
        effectiveMode,
        emailChecked: cleanEmail,
        categoryChecked: category,
        applicableLimitDays
      };
    }

    // 5. Find matching previous requests by email OR visitorId
    const allRequests = requestService.getAll();
    const visitorHistory = params.useVisitorFallback ? this.getVisitorSubmittedRequests() : [];
    const visitorRequestIds = new Set(visitorHistory.map((v) => v.requestId));

    const matchingRequests = allRequests
      .filter((r) => {
        const reqEmail = r.email.trim().toLowerCase();
        if (cleanEmail && reqEmail === cleanEmail) {
          // Check if user is exempted
          if (this.isExceptionUser(reqEmail)) return false;
          return true;
        }
        if (!cleanEmail && params.useVisitorFallback && visitorRequestIds.has(r.requestId)) {
          if (this.isExceptionUser(reqEmail)) return false;
          return true;
        }
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (matchingRequests.length === 0) {
      return {
        allowed: true,
        effectiveMode,
        emailChecked: cleanEmail,
        categoryChecked: category,
        applicableLimitDays
      };
    }

    // Evaluate against the most recent request (and category rule if applicable)
    const lastRequest = matchingRequests[0];
    const effectiveLimitDaysForLast = config.useCategorySpecificLimits
      ? this.getApplicableLimitDays(category || lastRequest.projectCategory, config)
      : applicableLimitDays;

    const createdDate = new Date(lastRequest.createdAt);
    const nextAllowedDate = new Date(createdDate.getTime() + effectiveLimitDaysForLast * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Check how many requests were submitted inside the current window
    const windowStart = new Date(now.getTime() - effectiveLimitDaysForLast * 24 * 60 * 60 * 1000);
    const requestsInWindow = matchingRequests.filter(
      (r) => new Date(r.createdAt).getTime() >= windowStart.getTime()
    );

    const maxAllowed = Math.max(1, config.maxRequestsPerPeriod || 1);
    const isWithinCooldown = now < nextAllowedDate && requestsInWindow.length >= maxAllowed;

    if (isWithinCooldown) {
      const diffMs = nextAllowedDate.getTime() - now.getTime();
      const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return {
        allowed: false,
        reason: config.useCategorySpecificLimits ? 'category-limit' : 'user-limit',
        effectiveMode,
        emailChecked: cleanEmail || lastRequest.email,
        categoryChecked: category || lastRequest.projectCategory,
        applicableLimitDays: effectiveLimitDaysForLast,
        lastRequest,
        submittedDateFormatted: formatCapacityDateDot(createdDate),
        nextAllowedDateFormatted: formatCapacityDateDot(nextAllowedDate),
        daysRemaining,
        messageTitle: config.limitBlockedTitle || '⏳ Már van aktív projektkérésed',
        messageSubtitle: config.limitBlockedSubtitle || 'Jelenleg egy projekted feldolgozás alatt van.',
        messageDescription: config.limitBlockedDescription
      };
    }

    return {
      allowed: true,
      effectiveMode,
      emailChecked: cleanEmail,
      categoryChecked: category,
      applicableLimitDays,
      lastRequest,
      submittedDateFormatted: formatCapacityDateDot(createdDate),
      nextAllowedDateFormatted: formatCapacityDateDot(nextAllowedDate)
    };
  },

  /**
   * Builds a comprehensive list of all users who have submitted requests, showing their
   * last submission date (e.g. 2026.09.27.), next allowed date (e.g. 2026.10.04.), and exception status.
   */
  getAllUserCapacitySummaries(): UserCapacitySummaryRow[] {
    const allRequests = requestService.getAll();
    const config = this.getConfig();
    const exceptions = this.getExceptions();
    const byEmail = new Map<string, ProjectRequest[]>();

    for (const req of allRequests) {
      const emailKey = req.email.trim().toLowerCase();
      if (!byEmail.has(emailKey)) {
        byEmail.set(emailKey, []);
      }
      byEmail.get(emailKey)!.push(req);
    }

    const closedStatuses = ['Elkészült', 'Lezárva', 'Elutasítva'];
    const now = new Date();
    const rows: UserCapacitySummaryRow[] = [];

    for (const [email, list] of byEmail.entries()) {
      const sorted = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastRequest = sorted[0];
      const activeCount = sorted.filter(
        (r) => !closedStatuses.includes(r.internalStatus || r.status)
      ).length;

      const limitDays = this.getApplicableLimitDays(lastRequest.projectCategory, config);
      const submittedDt = new Date(lastRequest.createdAt);
      const nextAllowedDt = new Date(submittedDt.getTime() + limitDays * 24 * 60 * 60 * 1000);
      const exceptionItem = exceptions.find((e) => e.email.trim().toLowerCase() === email);
      const isVip = !!(exceptionItem && exceptionItem.bypassLimit);
      const isCurrentlyLimited = !isVip && now < nextAllowedDt;
      const daysRemaining = isCurrentlyLimited
        ? Math.max(1, Math.ceil((nextAllowedDt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      rows.push({
        email,
        name: lastRequest.name,
        lastRequest,
        totalRequestsCount: sorted.length,
        activeRequestsCount: activeCount,
        lastSubmittedDateFormatted: formatCapacityDateDot(submittedDt),
        nextAllowedDateFormatted: formatCapacityDateDot(nextAllowedDt),
        applicableLimitDays: limitDays,
        isCurrentlyLimited,
        daysRemaining,
        isVipException: isVip,
        exceptionItem
      });
    }

    return rows;
  },

  // ==================================================
  // BLOCKED ATTEMPTS LOG & WAITLIST
  // ==================================================
  getBlockedAttempts(): CapacityBlockedAttempt[] {
    return getLocal<CapacityBlockedAttempt[]>(KEYS.CAPACITY_BLOCKED_LOG, []);
  },

  logBlockedAttempt(data: Omit<CapacityBlockedAttempt, 'id' | 'timestamp'>): CapacityBlockedAttempt {
    const list = this.getBlockedAttempts();
    const item: CapacityBlockedAttempt = {
      ...data,
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    setLocal(KEYS.CAPACITY_BLOCKED_LOG, [item, ...list].slice(0, 100));
    return item;
  },

  clearBlockedAttempts(): void {
    setLocal(KEYS.CAPACITY_BLOCKED_LOG, []);
  },

  getWaitlist(): CapacityWaitlistItem[] {
    return getLocal<CapacityWaitlistItem[]>(KEYS.CAPACITY_WAITLIST, []);
  },

  addToWaitlist(data: {
    name: string;
    email: string;
    projectCategory: ProjectCategory;
    projectIdea?: string;
  }): CapacityWaitlistItem {
    const list = this.getWaitlist();
    const state = this.getEffectiveState();
    const cleanEmail = data.email.trim().toLowerCase();

    const existingIdx = list.findIndex(
      (w) => w.email.trim().toLowerCase() === cleanEmail && !w.notified
    );

    const item: CapacityWaitlistItem = {
      id: existingIdx !== -1 ? list[existingIdx].id : `wait-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      projectCategory: data.projectCategory,
      projectIdea: data.projectIdea?.trim() || undefined,
      modeAtSignup: state.effectiveMode,
      notified: false,
      createdAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      list[existingIdx] = item;
      setLocal(KEYS.CAPACITY_WAITLIST, list);
    } else {
      setLocal(KEYS.CAPACITY_WAITLIST, [item, ...list]);
    }

    notificationService.add({
      title: 'Új kapacitás-értesítés feliratkozó',
      message: `${item.name} (${item.email}) értesítést kér, ha újra megnyílik a(z) ${item.projectCategory} fogadás.`,
      type: 'info',
      link: '/admin/projektkapacitas'
    });

    return item;
  },

  markWaitlistNotified(id: string): void {
    const list = this.getWaitlist().map((w) =>
      w.id === id ? { ...w, notified: true, notifiedAt: new Date().toISOString() } : w
    );
    setLocal(KEYS.CAPACITY_WAITLIST, list);
  },

  deleteWaitlistItem(id: string): void {
    const list = this.getWaitlist().filter((w) => w.id !== id);
    setLocal(KEYS.CAPACITY_WAITLIST, list);
  },

  /**
   * Automatically sends Gmail notifications to all pending waitlist subscribers when capacity reopens.
   */
  async autoNotifyPendingWaitlistOnReopen(filterCategory?: ProjectCategory): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    error?: string;
  }> {
    const allWaitlist = this.getWaitlist();
    const pending = allWaitlist.filter(
      (w) => !w.notified && (!filterCategory || w.projectCategory === filterCategory)
    );

    if (pending.length === 0) {
      return { success: true, sentCount: 0, failedCount: 0 };
    }

    try {
      const settings = settingsService.get();
      const websiteUrl =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

      const res = await fetch('/api/gmail/send-waitlist-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Auth': 'superadmin'
        },
        body: JSON.stringify({
          subscribers: pending,
          studioName: settings.studioName,
          ownerName: settings.ownerName,
          websiteUrl
        })
      });

      const data = await res.json().catch(() => ({}));
      const notifiedIds = new Set<string>(Array.isArray(data.notifiedIds) ? data.notifiedIds : []);

      if (notifiedIds.size > 0) {
        const nowIso = new Date().toISOString();
        const updatedList = this.getWaitlist().map((w) =>
          notifiedIds.has(w.id) ? { ...w, notified: true, notifiedAt: nowIso } : w
        );
        setLocal(KEYS.CAPACITY_WAITLIST, updatedList);

        notificationService.add({
          title: '✓ Automatikus várólista e-mailek elküldve',
          message: `A projektfogadás újranyitásakor ${notifiedIds.size} várólistás érdeklődőnek automatikusan kiküldtük az értesítő e-mailt Gmailen keresztül.`,
          type: 'success',
          link: '/admin/projektkapacitas'
        });
      }

      const detail = {
        success: !!data.success && notifiedIds.size > 0,
        sentCount: notifiedIds.size,
        failedCount: Number(data.failedCount) || 0,
        error: data.error
      };

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('waitlist_auto_notified', { detail }));
      }

      return detail;
    } catch {
      const detail = {
        success: false,
        sentCount: 0,
        failedCount: pending.length,
        error: 'Hálózati hiba történt az automatikus várólista e-mailek küldése közben.'
      };
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('waitlist_auto_notified', { detail }));
      }
      return detail;
    }
  }
};
