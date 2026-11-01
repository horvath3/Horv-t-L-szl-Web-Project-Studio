import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gauge,
  Save,
  Check,
  Clock,
  Calendar,
  Plane,
  ShieldAlert,
  UserCheck,
  Plus,
  Trash2,
  Bell,
  Send,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Sliders,
  Layers,
  Users,
  Sparkles,
  Mail
} from 'lucide-react';
import {
  CapacityBannerPlacement,
  CapacityBannerTheme,
  CapacityBlockedAttempt,
  CapacityExceptionUser,
  CapacityMode,
  CapacityWaitlistItem,
  PauseReasonType,
  ProjectCapacityConfig,
  ProjectCategory,
  UserLimitPreset
} from '../../types';
import {
  capacityService,
  EffectiveCapacityState,
  PAUSE_REASON_OPTIONS,
  UserCapacitySummaryRow,
  formatCapacityDateDot,
  formatCapacityDateTimeDot,
  getModeBadgeInfo
} from '../../services/capacityService';
import {
  PROJECT_CATEGORIES,
  formatCategoryWithIcon,
  settingsService
} from '../../services/storage';
import { gmailService } from '../../services/gmailService';

type AdminCapacityTab =
  | 'all'
  | 'modes-schedule'
  | 'limits-categories'
  | 'users-exceptions'
  | 'messages-banners'
  | 'waitlist-logs';

const BANNER_THEMES: { id: CapacityBannerTheme; label: string; previewClass: string }[] = [
  { id: 'amber', label: 'Borostyán / Figyelmeztető (Sárga)', previewClass: 'bg-amber-500' },
  { id: 'indigo', label: 'Stúdió Indigó (Kék-Lila)', previewClass: 'bg-indigo-500' },
  { id: 'rose', label: 'Sürgős Korall / Piros', previewClass: 'bg-rose-500' },
  { id: 'purple', label: 'Kreatív Lila', previewClass: 'bg-purple-500' },
  { id: 'emerald', label: 'Smaragd Zöld', previewClass: 'bg-emerald-500' },
  { id: 'cyan', label: 'Technológiai Cián', previewClass: 'bg-cyan-500' }
];

const BANNER_ICONS = ['⚠️', '⏳', '🔥', '🚀', '📌', '✈️', '🛠', '🔔'];
const PAUSED_ICONS = ['🚧', '⏸️', '📅', '✈️', '🚀', '🛠', '🔒'];

export const AdminCapacityPage: React.FC = () => {
  const [effectiveState, setEffectiveState] = useState<EffectiveCapacityState>(() =>
    capacityService.getEffectiveState()
  );
  const [config, setConfig] = useState<ProjectCapacityConfig>(() => capacityService.getConfig());
  const [userRows, setUserRows] = useState<UserCapacitySummaryRow[]>(() =>
    capacityService.getAllUserCapacitySummaries()
  );
  const [exceptions, setExceptions] = useState<CapacityExceptionUser[]>(() =>
    capacityService.getExceptions()
  );
  const [waitlist, setWaitlist] = useState<CapacityWaitlistItem[]>(() =>
    capacityService.getWaitlist()
  );
  const [blockedLogs, setBlockedLogs] = useState<CapacityBlockedAttempt[]>(() =>
    capacityService.getBlockedAttempts()
  );

  const [activeTab, setActiveTab] = useState<AdminCapacityTab>('all');
  const [savedToast, setSavedToast] = useState(false);

  // Exception form state
  const [newExcEmail, setNewExcEmail] = useState('');
  const [newExcName, setNewExcName] = useState('');
  const [newExcNote, setNewExcNote] = useState('');
  const [newExcBypassPause, setNewExcBypassPause] = useState(false);

  // Limit tester / simulator state
  const [testEmail, setTestEmail] = useState('');
  const [testCategory, setTestCategory] = useState<ProjectCategory>('Weboldal / Webalkalmazás');

  // Waitlist Gmail notification state
  const [sendingWaitlistId, setSendingWaitlistId] = useState<string | null>(null);
  const [waitlistFeedback, setWaitlistFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const refreshAll = () => {
    setEffectiveState(capacityService.getEffectiveState());
    setConfig(capacityService.getConfig());
    setUserRows(capacityService.getAllUserCapacitySummaries());
    setExceptions(capacityService.getExceptions());
    setWaitlist(capacityService.getWaitlist());
    setBlockedLogs(capacityService.getBlockedAttempts());
  };

  useEffect(() => {
    const handleAutoNotified = (e: Event) => {
      const customEvt = e as CustomEvent<{
        success: boolean;
        sentCount: number;
        failedCount: number;
        error?: string;
      }>;
      const detail = customEvt.detail;
      refreshAll();
      if (!detail) return;
      if (detail.sentCount > 0) {
        setWaitlistFeedback({
          type: 'success',
          text: `✓ Automatikus várólista-értesítés: ${detail.sentCount} feliratkozónak sikeresen elküldve a csatlakoztatott Gmail-fiókon keresztül!`
        });
      } else if (detail.failedCount > 0 && detail.error) {
        setWaitlistFeedback({
          type: 'error',
          text: `✕ Automatikus várólista-értesítés sikertelen: ${detail.error}`
        });
      }
    };

    window.addEventListener('store_hl_studio_capacity', refreshAll);
    window.addEventListener('store_hl_studio_requests', refreshAll);
    window.addEventListener('waitlist_auto_notified', handleAutoNotified);
    return () => {
      window.removeEventListener('store_hl_studio_capacity', refreshAll);
      window.removeEventListener('store_hl_studio_requests', refreshAll);
      window.removeEventListener('waitlist_auto_notified', handleAutoNotified);
    };
  }, []);

  const triggerSavedFeedback = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2800);
  };

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    capacityService.saveConfig(config);
    refreshAll();
    triggerSavedFeedback();
  };

  const handleQuickModeSelect = (mode: CapacityMode) => {
    const updated = capacityService.setMode(mode);
    setConfig(updated);
    refreshAll();
    triggerSavedFeedback();
  };

  const handleTravelModeToggle = (nextActive: boolean) => {
    const updated = capacityService.toggleTravelMode(
      nextActive,
      config.travelReturnDate,
      config.travelBehavior
    );
    setConfig(updated);
    refreshAll();
    triggerSavedFeedback();
  };

  const handleCategoryLimitChange = (category: ProjectCategory, days: number) => {
    const safeDays = Math.max(1, days || 1);
    const nextConfig: ProjectCapacityConfig = {
      ...config,
      categoryRules: {
        ...config.categoryRules,
        [category]: {
          ...config.categoryRules[category],
          category,
          limitDays: safeDays
        }
      }
    };
    setConfig(nextConfig);
    capacityService.saveConfig(nextConfig);
    refreshAll();
  };

  const handleCategoryPauseToggle = (category: ProjectCategory) => {
    const currentPaused = config.categoryRules[category]?.paused || false;
    const nextPaused = !currentPaused;
    const nextConfig: ProjectCapacityConfig = {
      ...config,
      categoryRules: {
        ...config.categoryRules,
        [category]: {
          ...config.categoryRules[category],
          category,
          paused: nextPaused,
          pauseReason:
            config.categoryRules[category]?.pauseReason ||
            'Kapacitáshiány miatt átmenetileg nem fogadunk új megkereséseket.'
        }
      }
    };
    setConfig(nextConfig);
    capacityService.saveConfig(nextConfig);
    if (!nextPaused && nextConfig.autoNotifyWaitlistOnReopen !== false) {
      void capacityService.autoNotifyPendingWaitlistOnReopen(category);
    }
    refreshAll();
    triggerSavedFeedback();
  };

  const handleCategoryPauseReasonChange = (category: ProjectCategory, reason: string) => {
    const nextConfig: ProjectCapacityConfig = {
      ...config,
      categoryRules: {
        ...config.categoryRules,
        [category]: {
          ...config.categoryRules[category],
          category,
          pauseReason: reason
        }
      }
    };
    setConfig(nextConfig);
    capacityService.saveConfig(nextConfig);
    refreshAll();
  };

  const handleCategorySlotsChange = (
    category: ProjectCategory,
    patch: { slotLimitEnabled?: boolean; availableSlots?: number; totalSlots?: number }
  ) => {
    const curRule = config.categoryRules[category];
    const newSlotEnabled =
      patch.slotLimitEnabled !== undefined
        ? patch.slotLimitEnabled
        : (curRule?.slotLimitEnabled ?? true);
    const newTotal =
      patch.totalSlots !== undefined
        ? Math.max(1, patch.totalSlots)
        : (curRule?.totalSlots || 5);
    const newAvailable =
      patch.availableSlots !== undefined
        ? Math.max(0, patch.availableSlots)
        : (curRule?.availableSlots !== undefined ? curRule.availableSlots : 3);

    // If availableSlots reaches 0 and slotLimitEnabled is true, auto pause
    const autoPaused =
      newSlotEnabled && newAvailable === 0
        ? true
        : newAvailable > 0 && curRule?.paused
        ? false
        : curRule?.paused;

    const nextConfig: ProjectCapacityConfig = {
      ...config,
      categoryRules: {
        ...config.categoryRules,
        [category]: {
          ...curRule,
          category,
          slotLimitEnabled: newSlotEnabled,
          availableSlots: newAvailable,
          totalSlots: newTotal,
          paused: autoPaused
        }
      }
    };
    setConfig(nextConfig);
    capacityService.saveConfig(nextConfig);
    refreshAll();
  };

  const handleBatchPauseCategories = (pauseAll: boolean) => {
    const updatedRules = { ...config.categoryRules };
    for (const cat of PROJECT_CATEGORIES) {
      updatedRules[cat.id] = {
        ...updatedRules[cat.id],
        category: cat.id,
        paused: pauseAll,
        pauseReason:
          updatedRules[cat.id]?.pauseReason ||
          'Kapacitáshiány miatt átmenetileg nem fogadunk új megkereséseket.'
      };
    }
    const nextConfig: ProjectCapacityConfig = {
      ...config,
      categoryRules: updatedRules
    };
    setConfig(nextConfig);
    capacityService.saveConfig(nextConfig);
    if (!pauseAll && nextConfig.autoNotifyWaitlistOnReopen !== false) {
      void capacityService.autoNotifyPendingWaitlistOnReopen();
    }
    refreshAll();
    triggerSavedFeedback();
  };

  const handleAddException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExcEmail.trim() || !newExcEmail.includes('@')) return;
    capacityService.upsertException({
      email: newExcEmail.trim(),
      name: newExcName.trim() || undefined,
      bypassLimit: true,
      bypassPause: newExcBypassPause,
      note: newExcNote.trim() || 'Projektlimit kikapcsolva'
    });
    setNewExcEmail('');
    setNewExcName('');
    setNewExcNote('');
    setNewExcBypassPause(false);
    refreshAll();
    triggerSavedFeedback();
  };

  const handleToggleUserException = (email: string, name?: string) => {
    capacityService.toggleExceptionForEmail(email, name);
    refreshAll();
    triggerSavedFeedback();
  };

  const handleNotifyWaitlistViaGmail = async (item: CapacityWaitlistItem) => {
    setSendingWaitlistId(item.id);
    setWaitlistFeedback(null);
    try {
      const statusInfo = await gmailService.fetchStatus();
      if (statusInfo.state !== 'connected') {
        setWaitlistFeedback({
          type: 'error',
          text: 'Gmail nincs csatlakoztatva! Kérjük, csatlakoztasd a Gmail fiókot a Beállítások oldalon, vagy jelöld meg manuálisan értesítettként.'
        });
        setSendingWaitlistId(null);
        return;
      }

      const settings = settingsService.get();
      const websiteUrl = window.location.origin;
      const subject = `🟢 Újra fogadunk projekteket! – ${item.projectCategory} (${settings.studioName})`;
      const htmlBody = `
        <div style="font-family:Inter,Arial,sans-serif;background:#0b0f19;color:#f8fafc;padding:32px;border-radius:16px;max-width:600px;margin:0 auto;border:1px solid #1e293b;">
          <h2 style="color:#ffffff;margin-top:0;">Kedves ${item.name}!</h2>
          <p style="color:#cbd5e1;line-height:1.6;">
            Örömmel értesítelek, hogy a <strong>${settings.studioName}</strong> projektkapacitása újra megnyílt (🟢 Normál mód), így ismét fogadunk új ajánlatkéréseket a(z) <strong>${item.projectCategory}</strong> kategóriában!
          </p>
          ${
            item.projectIdea
              ? `<p style="color:#94a3b8;background:#111827;padding:12px 16px;border-radius:10px;border-left:3px solid #6366f1;">Korábban megjelölt ötleted: <em>„${item.projectIdea}”</em></p>`
              : ''
          }
          <p style="margin:24px 0;">
            <a href="${websiteUrl}/projekt-igeny?category=${encodeURIComponent(
        item.projectCategory
      )}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;display:inline-block;">
              Projektigény beküldése most &rarr;
            </a>
          </p>
          <p style="color:#64748b;font-size:12px;margin-top:24px;border-top:1px solid #1e293b;padding-top:12px;">
            Üdvözlettel,<br/><strong>${settings.ownerName}</strong> – ${settings.studioName}
          </p>
        </div>
      `;

      const res = await fetch('/api/gmail/send-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Auth': 'superadmin'
        },
        body: JSON.stringify({
          recipientEmail: item.email,
          recipientName: item.name,
          subject,
          htmlBody,
          plainTextBody: `Kedves ${item.name}!\n\nÖrömmel értesítelek, hogy a ${settings.studioName} projektfogadása újra megnyílt (${item.projectCategory}).\nAjánlatkérés beküldése: ${websiteUrl}/projekt-igeny\n\nÜdvözlettel,\n${settings.ownerName}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        capacityService.markWaitlistNotified(item.id);
        refreshAll();
        setWaitlistFeedback({
          type: 'success',
          text: `✓ Értesítő e-mail sikeresen elküldve (${item.email})!`
        });
      } else {
        setWaitlistFeedback({
          type: 'error',
          text: data.error || 'A Gmail API küldés sikertelen volt.'
        });
      }
    } catch {
      setWaitlistFeedback({
        type: 'error',
        text: 'Hálózati hiba történt a Gmail értesítés küldése közben.'
      });
    } finally {
      setSendingWaitlistId(null);
    }
  };

  const modeBadge = getModeBadgeInfo(effectiveState.effectiveMode);
  const limitedUsersCount = userRows.filter((u) => u.isCurrentlyLimited).length;
  const activeExceptionsCount = exceptions.filter((e) => e.bypassLimit).length;
  const pendingWaitlistCount = waitlist.filter((w) => !w.notified).length;

  const simulatedCheckResult = testEmail.trim()
    ? capacityService.checkSubmissionEligibility({
        email: testEmail.trim(),
        category: testCategory,
        useVisitorFallback: false
      })
    : null;

  const showSection = (sec: AdminCapacityTab) => activeTab === 'all' || activeTab === sec;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold font-display text-white">
              Projektkapacitás-kezelő Rendszer
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${modeBadge.colorClass}`}
            >
              <span>{modeBadge.emoji}</span>
              <span>Aktív: {modeBadge.label}</span>
            </span>
            {effectiveState.isTravelModeEffective && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                <Plane className="w-3.5 h-3.5" />
                <span>Utazási mód</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Ügyfélkapacitás, projektfogadási módok (Normál / Korlátozott / Szüneteltetett), felhasználói és kategória limitek, kivételek és időzítések kezelése.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {savedToast && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Kapacitás beállítások mentve!</span>
            </div>
          )}

          <Link
            to="/projekt-igeny"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ajánlatkérő űrlap előnézete</span>
          </Link>

          <button
            type="button"
            onClick={() => handleSaveConfig()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Beállítások Mentése</span>
          </button>
        </div>
      </div>

      {/* ==================================================
          STATISZTIKÁK (5 Kártyás Stúdió Kapacitás Áttekintés)
         ================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Aktuális fogadási mód</span>
            <span className="text-lg font-extrabold font-display text-white flex items-center gap-1.5">
              <span>{modeBadge.emoji}</span>
              <span>{modeBadge.label}</span>
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              {effectiveState.isScheduleActive
                ? 'Időzített szabály aktív'
                : effectiveState.isTravelModeEffective
                ? 'Utazási gyorskapcsoló aktív'
                : 'Kézi beállítás'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Aktív projektmegkeresések</span>
            <span className="text-2xl font-extrabold font-display text-amber-400 tabular-nums">
              {effectiveState.activeRequestsCount} db
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Feldolgozás / fejlesztés alatt
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Limit alatt álló ügyfelek</span>
            <span className="text-2xl font-extrabold font-display text-white tabular-nums">
              {limitedUsersCount} fő
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Összes ügyfél: {userRows.length} fő
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Kivételes (VIP) ügyfelek</span>
            <span className="text-2xl font-extrabold font-display text-emerald-400 tabular-nums">
              {activeExceptionsCount} fő
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Projektlimit kikapcsolva
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Várólista & Blokkolások</span>
            <span className="text-2xl font-extrabold font-display text-sky-400 tabular-nums">
              {pendingWaitlistCount} / {blockedLogs.length}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              {pendingWaitlistCount} értesítésre vár · {blockedLogs.length} blokkolt
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ==================================================
          12. UTAZÁSI MÓD GYORSKAPCSOLÓ SÁV
         ================================================== */}
      <div
        className={`rounded-3xl p-6 border transition-all ${
          config.travelModeActive
            ? 'bg-gradient-to-r from-sky-950/60 via-indigo-950/60 to-purple-950/50 border-sky-500/40 shadow-xl shadow-sky-950/30'
            : 'glass-panel border-white/10'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                config.travelModeActive
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              ✈️
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  Utazási / Szabadság Mód Gyorskapcsoló
                </h2>
                <span
                  className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                    config.travelModeActive
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  {config.travelModeActive ? 'AKTÍV' : 'KIKAPCSOLVA'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Egyetlen kattintással aktiválhatod az utazási / szabadság módot. Beállíthatod a várható visszatérés dátumát, amelynek elérésekor a rendszer automatikusan visszaáll 🟢 Normál módba.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
              <span className="text-xs text-slate-400">Működés:</span>
              <select
                value={config.travelBehavior}
                onChange={(e) => {
                  const nextBehavior = e.target.value as 'pause' | 'limited';
                  const nextCfg = { ...config, travelBehavior: nextBehavior };
                  setConfig(nextCfg);
                  if (config.travelModeActive) {
                    capacityService.toggleTravelMode(true, config.travelReturnDate, nextBehavior);
                    refreshAll();
                  } else {
                    capacityService.saveConfig(nextCfg);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="pause" className="bg-slate-900 text-white">
                  🔴 Teljes szüneteltetés
                </option>
                <option value="limited" className="bg-slate-900 text-white">
                  🟡 Korlátozott fogadás
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
              <span className="text-xs text-slate-400">Visszatérés:</span>
              <input
                type="date"
                value={config.travelReturnDate}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  const nextCfg = { ...config, travelReturnDate: nextDate };
                  setConfig(nextCfg);
                  capacityService.saveConfig(nextCfg);
                  refreshAll();
                }}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleTravelModeToggle(!config.travelModeActive)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                config.travelModeActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>
                {config.travelModeActive
                  ? 'Utazási mód kikapcsolása'
                  : 'Utazási mód bekapcsolása'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10">
        {[
          { id: 'all', label: 'Összes szekció (Teljes nézet)' },
          { id: 'modes-schedule', label: '1. Fogadási módok & Időzítés' },
          { id: 'limits-categories', label: '2. Projekt kérések szüneteltetése & Limitek' },
          { id: 'users-exceptions', label: `3. Ügyfelek & Kivételek (${activeExceptionsCount})` },
          { id: 'messages-banners', label: '4. Banner & Üzenetek dizájn' },
          { id: 'waitlist-logs', label: `5. Várólista (${pendingWaitlistCount}) & Napló` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as AdminCapacityTab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================================================
          2. PROJEKTFOGADÁSI MÓDOK & 10-11. SZÜNET OKA / IDŐZÍTÉS
         ================================================== */}
      {showSection('modes-schedule') && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                Projektfogadási mód kiválasztása
              </span>
              <h2 className="text-xl font-bold font-display text-white">
                Válaszd ki a stúdió aktuális projektfogadási módját
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Alapértelmezett: 🟢 Normál mód. A kiválasztott mód azonnal érvénybe lép a nyilvános weboldalon és az ajánlatkérő űrlapon.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 🟢 NORMÁL MÓD */}
              <div
                onClick={() => handleQuickModeSelect('normal')}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  effectiveState.effectiveMode === 'normal'
                    ? 'bg-gradient-to-br from-emerald-950/50 via-slate-900/90 to-emerald-950/30 border-emerald-500 ring-1 ring-emerald-400/40 shadow-xl shadow-emerald-950/20'
                    : 'bg-black/40 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🟢</span>
                    {effectiveState.effectiveMode === 'normal' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase">
                        Aktív mód
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Alapértelmezett</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">Normál mód</h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Minden látogató küldhet projektet</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Nincs extra korlátozás vagy figyelmeztető sáv</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Minden ajánlatkérő és promóciós funkció működik</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    effectiveState.effectiveMode === 'normal'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {effectiveState.effectiveMode === 'normal'
                    ? '✓ Normál mód bekapcsolva'
                    : 'Átváltás Normál módra'}
                </button>
              </div>

              {/* 🟡 KORLÁTOZOTT MÓD */}
              <div
                onClick={() => handleQuickModeSelect('limited')}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  effectiveState.effectiveMode === 'limited'
                    ? 'bg-gradient-to-br from-amber-950/50 via-slate-900/90 to-amber-950/30 border-amber-500 ring-1 ring-amber-400/40 shadow-xl shadow-amber-950/20'
                    : 'bg-black/40 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🟡</span>
                    {effectiveState.effectiveMode === 'limited' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold uppercase">
                        Aktív mód
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">Korlátozott mód</h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Modern figyelmeztető banner a megnövekedett terhelésről</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Felhasználói és kategória-alapú projektlimit aktív</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Kivételes (VIP) ügyfelek korlátozás nélkül küldhetnek</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    effectiveState.effectiveMode === 'limited'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {effectiveState.effectiveMode === 'limited'
                    ? '✓ Korlátozott mód bekapcsolva'
                    : 'Átváltás Korlátozott módra'}
                </button>
              </div>

              {/* 🔴 SZÜNETELTETETT MÓD */}
              <div
                onClick={() => handleQuickModeSelect('paused')}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  effectiveState.effectiveMode === 'paused'
                    ? 'bg-gradient-to-br from-rose-950/50 via-slate-900/90 to-rose-950/30 border-rose-500 ring-1 ring-rose-400/40 shadow-xl shadow-rose-950/20'
                    : 'bg-black/40 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🔴</span>
                    {effectiveState.effectiveMode === 'paused' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold uppercase">
                        Aktív mód
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">Szüneteltetett mód</h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Az űrlap helyett modern „Projektbeküldés szünetel” oldal</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Választható ok (Utazás, Sok projekt, Fejlesztés, Egyéb)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Időzített automatikus visszaállás 🟢 Normál módra</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    effectiveState.effectiveMode === 'paused'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {effectiveState.effectiveMode === 'paused'
                    ? '✓ Szüneteltetett mód bekapcsolva'
                    : 'Átváltás Szüneteltetett módra'}
                </button>
              </div>
            </div>
          </div>

          {/* 10. SZÜNET OKA & 11. IDŐZÍTETT SZÜNET */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 10. Szünet oka */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  Szüneteltetett mód beállítása
                </span>
                <h3 className="text-lg font-bold font-display text-white">
                  Szünet oka és megjelenés
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Válaszd ki, milyen indoklás jelenjen meg a látogatóknak szüneteltetett módban.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAUSE_REASON_OPTIONS.map((opt) => {
                  const selected = config.pauseReason === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        const nextCfg: ProjectCapacityConfig = {
                          ...config,
                          pauseReason: opt.id as PauseReasonType,
                          pausedSubtitle: opt.defaultSubtitle,
                          pausedDescription: opt.defaultDescription
                        };
                        setConfig(nextCfg);
                        capacityService.saveConfig(nextCfg);
                        refreshAll();
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        selected
                          ? 'bg-rose-500/15 border-rose-500 text-white shadow-md'
                          : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <span className="text-xs font-bold block text-white">{opt.label}</span>
                        <span className="text-[11px] text-slate-400 line-clamp-1">
                          {opt.defaultSubtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {config.pauseReason === 'other' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Egyéb ok megnevezése
                  </label>
                  <input
                    type="text"
                    placeholder="Pl. Hardverkarbantartás / Stúdió átalakítás"
                    value={config.pauseCustomReasonText}
                    onChange={(e) =>
                      setConfig({ ...config, pauseCustomReasonText: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Értesítési várólista engedélyezése szünet alatt
                    </span>
                    <span className="text-[11px] text-slate-400">
                      A látogatók feliratkozhatnak, hogy e-mailt kapjanak az újranyitáskor
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.allowWaitlistSignup}
                    onChange={(e) => {
                      const next = { ...config, allowWaitlistSignup: e.target.checked };
                      setConfig(next);
                      capacityService.saveConfig(next);
                    }}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <div>
                    <span className="text-xs font-bold text-emerald-200 block">
                      Automatikus e-mail küldés újranyitáskor (Gmail API)
                    </span>
                    <span className="text-[11px] text-emerald-300/80">
                      Amint 🟢 Normál módra váltasz (vagy lejár az időzítés), automatikusan kiküldi az értesítőt minden feliratkozónak
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoNotifyWaitlistOnReopen !== false}
                    onChange={(e) => {
                      const next = { ...config, autoNotifyWaitlistOnReopen: e.target.checked };
                      setConfig(next);
                      capacityService.saveConfig(next);
                    }}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 11. Időzített szünet */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                    Automatikus időzítés
                  </span>
                  <h3 className="text-lg font-bold font-display text-white">
                    Időzített szünet / korlátozás
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Állítsd be a kezdés és befejezés pontos dátumát és idejét. Lejárat után a rendszer automatikusan visszaáll 🟢 Normál módra.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.scheduleEnabled}
                    onChange={(e) => {
                      const next = { ...config, scheduleEnabled: e.target.checked };
                      setConfig(next);
                      capacityService.saveConfig(next);
                      refreshAll();
                    }}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  <span className="text-xs font-bold text-white">Időzítés BE</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
                    Kezdés (dátum + idő)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={config.scheduleStartDate}
                      onChange={(e) =>
                        setConfig({ ...config, scheduleStartDate: e.target.value })
                      }
                      className="px-2.5 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                    />
                    <input
                      type="time"
                      value={config.scheduleStartTime}
                      onChange={(e) =>
                        setConfig({ ...config, scheduleStartTime: e.target.value })
                      }
                      className="px-2.5 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Befejezés (dátum + idő)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={config.scheduleEndDate}
                      onChange={(e) =>
                        setConfig({ ...config, scheduleEndDate: e.target.value })
                      }
                      className="px-2.5 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                    />
                    <input
                      type="time"
                      value={config.scheduleEndTime}
                      onChange={(e) =>
                        setConfig({ ...config, scheduleEndTime: e.target.value })
                      }
                      className="px-2.5 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Időzített időszak alatti mód
                  </label>
                  <select
                    value={config.scheduleTargetMode}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        scheduleTargetMode: e.target.value as 'paused' | 'limited'
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs cursor-pointer"
                  >
                    <option value="paused" className="bg-slate-900 text-white">
                      🔴 Szüneteltetett mód
                    </option>
                    <option value="limited" className="bg-slate-900 text-white">
                      🟡 Korlátozott mód
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <div>
                    <span className="text-xs font-bold text-emerald-200 block">
                      Lejárat után: 🟢 Normál mód
                    </span>
                    <span className="text-[11px] text-emerald-300/80">
                      Automatikus visszaállás
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoRevertToNormal}
                    onChange={(e) =>
                      setConfig({ ...config, autoRevertToNormal: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <span className="text-slate-400">
                  Időzített ablak:{' '}
                  <strong className="text-white font-mono">
                    {formatCapacityDateTimeDot(config.scheduleStartDate, config.scheduleStartTime)}
                  </strong>{' '}
                  &rarr;{' '}
                  <strong className="text-white font-mono">
                    {formatCapacityDateTimeDot(config.scheduleEndDate, config.scheduleEndTime)}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveConfig()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  Időzítés mentése
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          5. FELHASZNÁLÓI PROJEKTLIMIT & 8. KATEGÓRIA ALAPÚ LIMIT
         ================================================== */}
      {showSection('limits-categories') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 5. Felhasználói projektlimit */}
          <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-white/10 space-y-5">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Felhasználói Projektlimit
              </span>
              <h3 className="text-lg font-bold font-display text-white">
                Időszakos beküldési korlát
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Korlátozott módban egy felhasználó nem tud korlátlan mennyiségű projektet beküldeni.
              </p>
            </div>

            <div className="space-y-2.5">
              {(
                [
                  { preset: 7, label: '1 projekt / 7 nap', desc: 'Heti 1 új projektigény' },
                  { preset: 14, label: '1 projekt / 14 nap', desc: 'Kétheti 1 új projektigény' },
                  { preset: 30, label: '1 projekt / 30 nap', desc: 'Havi 1 új projektigény' },
                  { preset: 'custom', label: 'Egyedi idő', desc: 'Saját napok száma' }
                ] as { preset: UserLimitPreset; label: string; desc: string }[]
              ).map((item) => {
                const selected = config.limitPreset === item.preset;
                return (
                  <button
                    key={String(item.preset)}
                    type="button"
                    onClick={() => {
                      const next = { ...config, limitPreset: item.preset };
                      setConfig(next);
                      capacityService.saveConfig(next);
                      refreshAll();
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      selected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                        : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-white/30'
                        }`}
                      >
                        {selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <div>
                        <span className="text-xs font-bold block text-white">{item.label}</span>
                        <span className="text-[11px] text-slate-400">{item.desc}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-amber-300 font-bold">
                      {item.preset === 'custom' ? `${config.customLimitDays} nap` : `${item.preset} nap`}
                    </span>
                  </button>
                );
              })}
            </div>

            {config.limitPreset === 'custom' && (
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2">
                <label className="block text-xs font-medium text-amber-200">
                  Egyedi várakozási idő (napokban):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={config.customLimitDays}
                    onChange={(e) => {
                      const days = Math.max(1, Number(e.target.value) || 1);
                      const next = { ...config, customLimitDays: days };
                      setConfig(next);
                      capacityService.saveConfig(next);
                      refreshAll();
                    }}
                    className="w-28 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-sm font-mono font-bold"
                  />
                  <span className="text-xs text-slate-400">nap / 1 projekt</span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-3 border-t border-white/5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">
                  Limit érvényesítése Normál módban is (spamszűrés)
                </span>
                <input
                  type="checkbox"
                  checked={config.applyLimitInNormalMode}
                  onChange={(e) => {
                    const next = { ...config, applyLimitInNormalMode: e.target.checked };
                    setConfig(next);
                    capacityService.saveConfig(next);
                    refreshAll();
                  }}
                  className="w-4 h-4 accent-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">
                  Aktív promóció felülírhatja a korlátozást
                </span>
                <input
                  type="checkbox"
                  checked={config.allowPromoOverrideInLimited}
                  onChange={(e) => {
                    const next = { ...config, allowPromoOverrideInLimited: e.target.checked };
                    setConfig(next);
                    capacityService.saveConfig(next);
                  }}
                  className="w-4 h-4 accent-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* 8. Kategória alapú szüneteltetés és hibaüzenetek kezelése */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  Projekt Kérések Szüneteltetése & Hibaüzenetek (7 projekt típus)
                </span>
                <h3 className="text-xl font-bold font-display text-white">
                  Kategóriánkénti szüneteltetés és indoklás beállítása
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Itt tudod egyesével vagy csoportosan szüneteltetni a 7 fő projekt kérést. Amelyik szüneteltetve van, az a látogatóknak <strong className="text-rose-400">piros színű, áthúzott és elhalványított</strong> lesz, nem lehet rákattintani, és az egér ráhúzásakor az itt megadott <strong className="text-rose-300">hibaüzenet / indoklás</strong> jelenik meg egy felugró ablakban.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleBatchPauseCategories(false)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Minden projekt kategória engedélyezése"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mind aktív</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchPauseCategories(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Minden projekt kategória szüneteltetése"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Mind szünetel</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {PROJECT_CATEGORIES.map((cat) => {
                const rule = config.categoryRules[cat.id] || {
                  category: cat.id,
                  limitDays: 7,
                  paused: false,
                  pauseReason: 'Kapacitáshiány miatt átmenetileg nem fogadunk új megkereséseket.'
                };
                const isPaused = Boolean(rule.paused);
                const currentReason =
                  rule.pauseReason ||
                  'Kapacitáshiány miatt átmenetileg nem fogadunk új megkereséseket ebben a kategóriában.';

                return (
                  <div
                    key={cat.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isPaused
                        ? 'bg-gradient-to-br from-rose-950/40 via-red-950/20 to-black/60 border-rose-500/50 shadow-lg shadow-rose-950/20'
                        : 'bg-black/40 border-white/10'
                    }`}
                  >
                    {/* Header Row: Icon, Title, Switch */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                          {cat.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-base font-bold font-display ${
                                isPaused
                                  ? 'text-rose-200 line-through decoration-rose-500 decoration-2'
                                  : 'text-white'
                              }`}
                            >
                              {cat.label}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                isPaused
                                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              }`}
                            >
                              {isPaused ? '🔴 Szünetel' : '🟢 Fogadható'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{cat.description}</p>
                        </div>
                      </div>

                      {/* Pause / Resume Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleCategoryPauseToggle(cat.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
                          isPaused
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                        }`}
                      >
                        {isPaused ? (
                          <>
                            <span>🔴 Szüneteltetve (Kattints a megnyitáshoz)</span>
                          </>
                        ) : (
                          <>
                            <span>🟢 Fogadható (Kattints a szüneteltetéshez)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Pause Reason / Error Message Configuration Input */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <span>Hibaüzenet / Szüneteltetés oka</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            (az egér rámutatásakor ez jelenik meg a látogatóknak):
                          </span>
                        </label>
                        <span className="text-[10px] text-slate-500">
                          Mentés: automatikus gépeléskor
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={rule.pauseReason || ''}
                          placeholder="Pl. Kapacitáshiány miatt átmenetileg nem fogadunk új weboldal megbízásokat."
                          onChange={(e) =>
                            handleCategoryPauseReasonChange(cat.id, e.target.value)
                          }
                          className="flex-1 px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
                        />
                      </div>

                      {/* Quick Reason Preset Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Gyors minták:
                        </span>
                        {[
                          'Kapacitáshiány miatt átmenetileg nem fogadunk új megkereséseket.',
                          'Fejlesztési időszak miatt a projektfogadás szünetel.',
                          'A meglévő projektek kapacitása jelenleg betelt.',
                          'Rendszerkarbantartás miatt átmenetileg nem kérhető.'
                        ].map((presetText) => (
                          <button
                            key={presetText}
                            type="button"
                            onClick={() =>
                              handleCategoryPauseReasonChange(cat.id, presetText)
                            }
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer truncate max-w-[260px]"
                            title={presetText}
                          >
                            {presetText}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quota / Slot Limit Controls */}
                    <div className="pt-3 border-t border-white/5 space-y-3 bg-black/25 p-3.5 rounded-xl border border-white/5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                            <span>🔢 Darabszám-alapú automata szüneteltetés (Kvóta)</span>
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Minden beérkező ajánlatkérés automatikusan levon 1-et. Amikor 0-ra csökken, azonnal szünetelteti ezt a kategóriát.
                          </p>
                        </div>

                        <label className="inline-flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
                          <input
                            type="checkbox"
                            checked={rule.slotLimitEnabled !== false}
                            onChange={(e) =>
                              handleCategorySlotsChange(cat.id, {
                                slotLimitEnabled: e.target.checked
                              })
                            }
                            className="w-4 h-4 accent-indigo-500"
                          />
                          <span className="text-xs font-semibold text-white">
                            {rule.slotLimitEnabled !== false ? 'Kvóta aktív' : 'Kvóta kikapcsolva'}
                          </span>
                        </label>
                      </div>

                      {rule.slotLimitEnabled !== false && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300 font-medium">
                              Hátralévő szabad helyek:
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCategorySlotsChange(cat.id, {
                                    availableSlots: Math.max(0, (rule.availableSlots ?? 3) - 1)
                                  })
                                }
                                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                                title="Levonás (-1)"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={999}
                                value={rule.availableSlots ?? 3}
                                onChange={(e) =>
                                  handleCategorySlotsChange(cat.id, {
                                    availableSlots: Math.max(0, parseInt(e.target.value) || 0)
                                  })
                                }
                                className="w-16 px-2 py-1 rounded-lg bg-black/60 border border-white/15 text-white text-xs font-mono font-bold text-center"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleCategorySlotsChange(cat.id, {
                                    availableSlots: (rule.availableSlots ?? 3) + 1
                                  })
                                }
                                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                                title="Hozzáadás (+1)"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs font-mono text-indigo-300">
                              / {rule.totalSlots || 5} összesen
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleCategorySlotsChange(cat.id, {
                                  availableSlots: rule.totalSlots || 5
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold cursor-pointer"
                              title="Visszaállítás a teljes keretre"
                            >
                              ↺ Újratöltés ({rule.totalSlots || 5})
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleCategorySlotsChange(cat.id, {
                                  availableSlots: 0
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold cursor-pointer"
                              title="Azonnali lezárás (0 hely)"
                            >
                              0-ra zárás
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Live Public Form Preview */}
                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Látogatói előnézet (Vidd rá az egeret a teszteléshez):
                      </span>

                      <div className="relative inline-block group">
                        <div
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all select-none ${
                            isPaused || (rule.slotLimitEnabled !== false && (rule.availableSlots ?? 3) <= 0)
                              ? 'bg-gradient-to-br from-rose-950/45 via-red-950/30 to-black/60 border-rose-500/70 text-rose-300 ring-1 ring-rose-500/40 opacity-60 hover:opacity-85 cursor-not-allowed'
                              : 'bg-black/50 border-white/15 text-white cursor-pointer hover:border-white/30'
                          }`}
                        >
                          <span
                            className={`text-xl ${
                              isPaused || (rule.slotLimitEnabled !== false && (rule.availableSlots ?? 3) <= 0)
                                ? 'grayscale-50'
                                : ''
                            }`}
                          >
                            {cat.icon}
                          </span>
                          <div>
                            <span
                              className={`text-xs font-bold block ${
                                isPaused || (rule.slotLimitEnabled !== false && (rule.availableSlots ?? 3) <= 0)
                                  ? 'text-rose-200 line-through decoration-rose-500 decoration-2'
                                  : 'text-white'
                              }`}
                            >
                              {cat.label}
                            </span>
                            <span
                              className={`text-[10px] block ${
                                isPaused || (rule.slotLimitEnabled !== false && (rule.availableSlots ?? 3) <= 0)
                                  ? 'text-rose-300/70'
                                  : 'text-emerald-300 font-semibold'
                              }`}
                            >
                              {isPaused || (rule.slotLimitEnabled !== false && (rule.availableSlots ?? 3) <= 0)
                                ? '🚫 Szünetel (0 hely maradt)'
                                : `✓ Még ${rule.availableSlots ?? 3} szabad hely`}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Tooltip on hover preview */}
                        {(isPaused || (rule.slotLimitEnabled !== false && (rule.availableSlots ?? 3) <= 0)) && (
                          <div className="absolute left-0 bottom-[calc(100%+6px)] w-64 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                            <div className="p-3 rounded-xl bg-[#1a080d] border border-rose-500 text-left shadow-2xl space-y-1">
                              <span className="text-[11px] font-bold text-rose-300 block">
                                🚫 Szüneteltetve · Nem választható
                              </span>
                              <p className="text-[10px] text-rose-100 leading-snug">
                                <strong className="text-white">Hiba / Ok:</strong>{' '}
                                {(rule.slotLimitEnabled !== false && (rule.availableSlots ?? 3) <= 0)
                                  ? 'A szabad helyek száma elfogyott (0 maradt). A projektfogadás automatikusan szünetel.'
                                  : currentReason}
                              </p>
                            </div>
                            <div className="w-2.5 h-2.5 bg-[#1a080d] border-r border-b border-rose-500 transform rotate-45 ml-6 -mt-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          6. LIMIT ELLENŐRZÉS & 7. KIVÉTELES FELHASZNÁLÓK
         ================================================== */}
      {showSection('users-exceptions') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 7. Kivételes felhasználók (VIP Whitelist) */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-white/10 space-y-5">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Kivételes Felhasználók (VIP)
                </span>
                <h3 className="text-lg font-bold font-display text-white">
                  ☑ Projektlimit kikapcsolása ügyfeleknek
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  A kivételes listán szereplő ügyfelek korlátozás nélkül küldhetnek be új projekteket.
                </p>
              </div>

              <form onSubmit={handleAddException} className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="email"
                    required
                    placeholder="Felhasználó: email@example.com *"
                    value={newExcEmail}
                    onChange={(e) => setNewExcEmail(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Ügyfél neve (opcionális)"
                    value={newExcName}
                    onChange={(e) => setNewExcName(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Megjegyzés (pl. Kiemelt partner, visszatérő megrendelő)"
                  value={newExcNote}
                  onChange={(e) => setNewExcNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExcBypassPause}
                      onChange={(e) => setNewExcBypassPause(e.target.checked)}
                      className="w-3.5 h-3.5 accent-emerald-500"
                    />
                    <span>Szüneteltetett módban is beküldhet</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Kivétel hozzáadása</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {exceptions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Nincs rögzített kivételes felhasználó.
                  </p>
                ) : (
                  exceptions.map((exc) => (
                    <div
                      key={exc.id}
                      className="p-3.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-white truncate">
                            {exc.email}
                          </span>
                          {exc.name && (
                            <span className="text-[11px] text-slate-400">({exc.name})</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {exc.note || 'Projektlimit kikapcsolva'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <label className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exc.bypassLimit}
                            onChange={() => handleToggleUserException(exc.email, exc.name)}
                            className="w-4 h-4 accent-emerald-500"
                          />
                          <span>☑ Limit KI</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            capacityService.deleteException(exc.id);
                            refreshAll();
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="Törlés"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 6. Élő Limit Ellenőrző & Ügyfél Projektlimit Táblázat */}
            <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-white/10 space-y-5">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                  Ügyfél Projektlimit Állapot & Ellenőrzés
                </span>
                <h3 className="text-lg font-bold font-display text-white">
                  Korábbi ajánlatkérések és következő beküldési lehetőségek
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Itt láthatod minden eddigi ügyfél utolsó beküldött projektjét, a következő beküldési dátumot, és egyetlen kattintással kikapcsolhatod számukra a projektlimitet.
                </p>
              </div>

              {/* Quick Simulator / Checker */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                  🔎 Limit szimulátor (E-mail cím + Kategória ellenőrzése)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="email"
                    placeholder="Teszt e-mail cím (pl. anna.nagy@example.hu)..."
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder-slate-500"
                  />
                  <select
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value as ProjectCategory)}
                    className="px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs cursor-pointer"
                  >
                    {PROJECT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {simulatedCheckResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                      simulatedCheckResult.allowed
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                        : 'bg-amber-500/15 border-amber-500/35 text-amber-200'
                    }`}
                  >
                    <div>
                      <strong>
                        {simulatedCheckResult.allowed
                          ? '✓ Beküldés ENGEDÉLYEZETT'
                          : '⏳ Beküldés KORLÁTOZVA (Blokkolva)'}
                      </strong>
                      {simulatedCheckResult.submittedDateFormatted && (
                        <span className="block text-[11px] font-mono mt-0.5">
                          Beküldött projekt: {simulatedCheckResult.submittedDateFormatted} · Következő lehetőség:{' '}
                          {simulatedCheckResult.nextAllowedDateFormatted}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/40">
                      Limit: {simulatedCheckResult.applicableLimitDays} nap
                    </span>
                  </div>
                )}
              </div>

              {/* User Rows Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 pr-3">Felhasználó</th>
                      <th className="py-2.5 px-3">Beküldött projekt</th>
                      <th className="py-2.5 px-3">Következő lehetőség</th>
                      <th className="py-2.5 pl-3 text-right">Projektlimit kikapcsolása</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {userRows.map((row) => (
                      <tr key={row.email} className="hover:bg-white/[0.02]">
                        <td className="py-3 pr-3">
                          <span className="font-bold text-white block font-mono">
                            {row.email}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {row.name} · {formatCategoryWithIcon(row.lastRequest.projectCategory)}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-slate-200 font-semibold block">
                            {row.lastSubmittedDateFormatted}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            #{row.lastRequest.requestId} ({row.applicableLimitDays} napos ciklus)
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {row.isVipException ? (
                            <span className="text-emerald-400 font-bold">
                              Korlátlan (VIP)
                            </span>
                          ) : (
                            <div>
                              <span
                                className={`font-bold block ${
                                  row.isCurrentlyLimited ? 'text-amber-300' : 'text-emerald-300'
                                }`}
                              >
                                {row.nextAllowedDateFormatted}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {row.isCurrentlyLimited
                                  ? `⏳ még ${row.daysRemaining} nap`
                                  : '✓ Küldhet új projektet'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <label className="inline-flex items-center justify-end gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={row.isVipException}
                              onChange={() => handleToggleUserException(row.email, row.name)}
                              className="w-4 h-4 accent-emerald-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold text-slate-300">
                              Limit kikapcsolása
                            </span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          4. KORLÁTOZOTT MÓD BANNER ÉS ÜZENETEK KEZELÉSE
         ================================================== */}
      {showSection('messages-banners') && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Üzenetek és Figyelmeztető Banner Kezelése
              </span>
              <h3 className="text-xl font-bold font-display text-white">
                Korlátozott mód banner, Szüneteltetett és Blokkolt oldal szövegei
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Szabd testre a címet, szöveget, ikont, megjelenési helyet és a színvilágot.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSaveConfig()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer self-start"
            >
              <Save className="w-4 h-4" />
              <span>Szövegek és dizájn mentése</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Banner Config Controls */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 border-b border-white/10 pb-2">
                🟡 Korlátozott Mód Figyelmeztető Banner
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Ikon
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {BANNER_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setConfig({ ...config, bannerIcon: ic })}
                        className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center cursor-pointer ${
                          config.bannerIcon === ic
                            ? 'bg-amber-500/25 border-amber-400'
                            : 'bg-black/40 border-white/10'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Banner címe
                  </label>
                  <input
                    type="text"
                    value={config.bannerTitle}
                    onChange={(e) => setConfig({ ...config, bannerTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Banner szövege
                </label>
                <textarea
                  rows={3}
                  value={config.bannerText}
                  onChange={(e) => setConfig({ ...config, bannerText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Megjelenési hely
                  </label>
                  <select
                    value={config.bannerPlacement}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerPlacement: e.target.value as CapacityBannerPlacement
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs cursor-pointer"
                  >
                    <option value="both" className="bg-slate-900 text-white">
                      Felső sáv + Ajánlatkérő oldal (Mindkettő)
                    </option>
                    <option value="top" className="bg-slate-900 text-white">
                      Csak a felső globális sávban
                    </option>
                    <option value="request-page" className="bg-slate-900 text-white">
                      Csak az Ajánlatkérő oldalon
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Színvilág
                  </label>
                  <select
                    value={config.bannerTheme}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerTheme: e.target.value as CapacityBannerTheme
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs cursor-pointer"
                  >
                    {BANNER_THEMES.map((t) => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right: Paused & Blocked Page Text Customization */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 border-b border-white/10 pb-2">
                🔴 Szüneteltetett Oldal & ⏳ Limit Blokkoló Oldal Szövegei
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Szünet ikon
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PAUSED_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setConfig({ ...config, pausedIcon: ic })}
                        className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center cursor-pointer ${
                          config.pausedIcon === ic
                            ? 'bg-rose-500/25 border-rose-400'
                            : 'bg-black/40 border-white/10'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Szüneteltetett mód főcíme
                  </label>
                  <input
                    type="text"
                    value={config.pausedTitle}
                    onChange={(e) => setConfig({ ...config, pausedTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Szüneteltetett alcím
                  </label>
                  <input
                    type="text"
                    value={config.pausedSubtitle}
                    onChange={(e) => setConfig({ ...config, pausedSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Szüneteltetett kiegészítő szöveg
                  </label>
                  <input
                    type="text"
                    value={config.pausedDescription}
                    onChange={(e) => setConfig({ ...config, pausedDescription: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Limit blokkoló főcím
                  </label>
                  <input
                    type="text"
                    value={config.limitBlockedTitle}
                    onChange={(e) => setConfig({ ...config, limitBlockedTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Limit blokkoló alcím
                  </label>
                  <input
                    type="text"
                    value={config.limitBlockedSubtitle}
                    onChange={(e) =>
                      setConfig({ ...config, limitBlockedSubtitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          5. VÁRÓLISTA (GMAIL ÉRTESÍTÉSSEL) & BLOKKOLT KÍSÉRLETEK NAPLÓ
         ================================================== */}
      {showSection('waitlist-logs') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waitlist */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                  Szünet Alatti Feliratkozók & Automatikus Gmail Értesítés
                </span>
                <h3 className="text-lg font-bold font-display text-white">
                  Újranyitási értesítést kérő érdeklődők ({waitlist.length})
                </h3>
                <span className="text-[11px] text-emerald-300 block mt-0.5">
                  {config.autoNotifyWaitlistOnReopen !== false
                    ? '✓ Automatikus kiküldés BEKAPCSOLVA (🟢 Normál módra váltáskor azonnal kiküldi)'
                    : 'Kézi kiküldés mód'}
                </span>
              </div>

              {pendingWaitlistCount > 0 && (
                <button
                  type="button"
                  onClick={() => void capacityService.autoNotifyPendingWaitlistOnReopen()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 shadow-lg shadow-emerald-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Mind értesítése most ({pendingWaitlistCount} fő)</span>
                </button>
              )}
            </div>

            {waitlistFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  waitlistFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                }`}
              >
                {waitlistFeedback.text}
              </div>
            )}

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {waitlist.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Még nem iratkozott fel érdeklődő a szüneteltetett időszak alatt.
                </p>
              ) : (
                waitlist.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{w.name}</span>
                        <span className="text-xs font-mono text-indigo-300">{w.email}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {formatCategoryWithIcon(w.projectCategory)} · Feliratkozva:{' '}
                        {formatCapacityDateDot(w.createdAt)}
                      </span>
                      {w.projectIdea && (
                        <p className="text-[11px] text-slate-300 italic">„{w.projectIdea}”</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {w.notified ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                          ✓ Értesítve
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={sendingWaitlistId === w.id}
                          onClick={() => handleNotifyWaitlistViaGmail(w)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>
                            {sendingWaitlistId === w.id ? 'Küldés...' : 'Gmail értesítés'}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          capacityService.deleteWaitlistItem(w.id);
                          refreshAll();
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Blocked Attempts Log */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Kapacitásvédelmi Napló
                </span>
                <h3 className="text-lg font-bold font-display text-white">
                  Megfogott / korlátozott beküldési kísérletek ({blockedLogs.length})
                </h3>
              </div>

              {blockedLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    capacityService.clearBlockedAttempts();
                    refreshAll();
                  }}
                  className="text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  Napló ürítése
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {blockedLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Még nem történt limit miatt elutasított beküldési kísérlet.
                </p>
              ) : (
                blockedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold font-mono text-white block">{log.email}</span>
                      <span className="text-[11px] text-slate-400">
                        {formatCategoryWithIcon(log.projectCategory)} · Következő lehetőség:{' '}
                        <strong className="text-amber-300 font-mono">
                          {log.nextAllowedDate || '—'}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleUserException(log.email)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      Kivétel adása
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
