import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Clock,
  Palette,
  Type,
  ListChecks,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Play,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import {
  DownloadFlowConfig,
  DownloadStepItem,
  DownloadAccentTheme,
  DownloadSpinnerStyle,
  DownloadCheckmarkStyle,
  DownloadProgressBarStyle,
  Download as DownloadType
} from '../../types';
import {
  createDefaultDownloadSteps,
  DEFAULT_DOWNLOAD_FLOW_CONFIG,
  downloadFlowService
} from '../../services/storage';
import {
  DownloadProcessModal,
  StepSpinnerIcon,
  AnimatedCheckmarkIcon
} from '../ui/DownloadProcessModal';

interface DownloadFlowConfigEditorProps {
  config: DownloadFlowConfig;
  onChange: (updated: DownloadFlowConfig) => void;
  isGlobal?: boolean;
  sampleDownload?: Partial<DownloadType>;
}

const GAME_PRESET_STEPS: DownloadStepItem[] = [
  {
    id: 'g-1',
    label: 'Kapcsolódás a játékkiadási szerverhez...',
    subtext: 'Dedikált letöltési csomópont kiválasztása',
    doneBadgeText: 'Kapcsolódva',
    durationMs: 550
  },
  {
    id: 'g-2',
    label: 'Játék build verzió és manifest ellenőrzése...',
    subtext: 'Build azonosító és platform kompatibilitás',
    doneBadgeText: 'Ellenőrizve',
    durationMs: 550
  },
  {
    id: 'g-3',
    label: '3D modellek, textúrák és asset csomagok vizsgálata...',
    subtext: 'Tömörített játékarchívumok integritása',
    doneBadgeText: 'Hitelesítve',
    durationMs: 650
  },
  {
    id: 'g-4',
    label: 'Hangfájlok és fizikai motor modulok validálása...',
    subtext: 'Audio bankok és shader gyorsítótár ellenőrzése',
    doneBadgeText: 'Validálva',
    durationMs: 600
  },
  {
    id: 'g-5',
    label: 'SHA-256 ellenőrzőösszeg és csomag sértetlenség...',
    subtext: 'Kriptográfiai aláírás egyeztetése',
    doneBadgeText: 'Tiszta',
    durationMs: 650
  },
  {
    id: 'g-6',
    label: 'Vírus- és kártékonykód-mentességi vizsgálat...',
    subtext: 'Stúdió biztonsági tanúsítvány megerősítése',
    doneBadgeText: 'Biztonságos',
    durationMs: 600
  },
  {
    id: 'g-7',
    label: 'Futtatókörnyezet és DirectX / Vulkan profil előkészítése...',
    subtext: 'Indító konfiguráció összeállítása',
    doneBadgeText: 'Előkészítve',
    durationMs: 600
  },
  {
    id: 'g-8',
    label: 'Telepítőcsomag fejléc és licenc hitelesítése...',
    subtext: 'Horvát László – Web & Project Studio kiadás',
    doneBadgeText: 'Aláírva',
    durationMs: 550
  },
  {
    id: 'g-9',
    label: 'Gyorsított letöltési adatfolyam megnyitása...',
    subtext: 'Sávszélesség allokáció véglegesítése',
    doneBadgeText: 'Megnyitva',
    durationMs: 600
  },
  {
    id: 'g-10',
    label: 'Játék telepítőcsomag letöltésének indítása...',
    subtext: 'Fájl átadása a böngészőnek',
    doneBadgeText: 'Elindítva',
    durationMs: 650
  }
];

const WEB_PRESET_STEPS: DownloadStepItem[] = [
  {
    id: 'w-1',
    label: 'Kapcsolódás a stúdió tárolóhoz...',
    subtext: 'Titkosított HTTPS kapcsolat',
    doneBadgeText: 'Kapcsolódva',
    durationMs: 550
  },
  {
    id: 'w-2',
    label: 'Projekt archívum és verzió lekérése...',
    subtext: 'Csomag metaadatok olvasása',
    doneBadgeText: 'Lekérve',
    durationMs: 550
  },
  {
    id: 'w-3',
    label: 'Forrásfájlok és statikus erőforrások ellenőrzése...',
    subtext: 'Komponensek és stíluslapok megléte',
    doneBadgeText: 'Rendben',
    durationMs: 600
  },
  {
    id: 'w-4',
    label: 'Konfigurációs sablonok és dokumentáció csatolása...',
    subtext: 'Telepítési útmutató előkészítése',
    doneBadgeText: 'Csatolva',
    durationMs: 600
  },
  {
    id: 'w-5',
    label: 'Csomag integritás (SHA-256) ellenőrzése...',
    subtext: 'Ellenőrzőösszeg megerősítése',
    doneBadgeText: 'Hitelesítve',
    durationMs: 650
  },
  {
    id: 'w-6',
    label: 'Biztonsági és tisztasági ellenőrzés...',
    subtext: 'Kártékony kódoktól mentes csomag',
    doneBadgeText: 'Tiszta',
    durationMs: 600
  },
  {
    id: 'w-7',
    label: 'Tömörített kiadási archívum összeállítása...',
    subtext: 'Optimalizált csomagméret',
    doneBadgeText: 'Összeállítva',
    durationMs: 650
  },
  {
    id: 'w-8',
    label: 'Stúdió digitális pecsét elhelyezése...',
    subtext: 'Horvát László – Web & Project Studio',
    doneBadgeText: 'Hitelesítve',
    durationMs: 550
  },
  {
    id: 'w-9',
    label: 'Letöltési token és csatorna generálása...',
    subtext: 'Közvetlen letöltési hivatkozás aktiválása',
    doneBadgeText: 'Aktiválva',
    durationMs: 600
  },
  {
    id: 'w-10',
    label: 'Letöltés indítása...',
    subtext: 'Archívum küldése a kliensnek',
    doneBadgeText: 'Elindítva',
    durationMs: 650
  }
];

export const DownloadFlowConfigEditor: React.FC<DownloadFlowConfigEditorProps> = ({
  config,
  onChange,
  isGlobal = false,
  sampleDownload
}) => {
  const [activeTab, setActiveTab] = useState<'timing' | 'design' | 'texts' | 'steps'>('steps');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const updateField = <K extends keyof DownloadFlowConfig>(
    key: K,
    val: DownloadFlowConfig[K]
  ) => {
    onChange({
      ...config,
      [key]: val
    });
  };

  const handleStepChange = (index: number, patch: Partial<DownloadStepItem>) => {
    const nextSteps = config.steps.map((s, idx) => (idx === index ? { ...s, ...patch } : s));
    updateField('steps', nextSteps);
  };

  const handleMoveStep = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= config.steps.length) return;
    const nextSteps = [...config.steps];
    const temp = nextSteps[index];
    nextSteps[index] = nextSteps[targetIdx];
    nextSteps[targetIdx] = temp;
    updateField('steps', nextSteps);
  };

  const handleRemoveStep = (index: number) => {
    if (config.steps.length <= 1) return;
    const nextSteps = config.steps.filter((_, idx) => idx !== index);
    updateField('steps', nextSteps);
  };

  const handleAddStep = () => {
    const newNum = config.steps.length + 1;
    const newStep: DownloadStepItem = {
      id: `step-${Date.now()}-${newNum}`,
      label: `${newNum}. ellenőrzési feladat végrehajtása...`,
      subtext: 'Rendszerfolyamat ellenőrzése',
      doneBadgeText: 'Kész',
      durationMs: 600
    };
    updateField('steps', [...config.steps, newStep]);
  };

  const handleLoadStepPreset = (preset: 'default' | 'game' | 'web') => {
    if (preset === 'game') {
      updateField(
        'steps',
        GAME_PRESET_STEPS.map((s) => ({ ...s }))
      );
    } else if (preset === 'web') {
      updateField(
        'steps',
        WEB_PRESET_STEPS.map((s) => ({ ...s }))
      );
    } else {
      updateField('steps', createDefaultDownloadSteps());
    }
  };

  const handleCopyFromGlobal = () => {
    const globalCfg = downloadFlowService.getGlobalConfig();
    onChange({
      ...globalCfg,
      useCustomConfig: true
    });
  };

  const previewDownloadObj: DownloadType = {
    id: sampleDownload?.id || 'preview-dl',
    projectTitle: sampleDownload?.projectTitle || 'ConvertFlow Desktop Studio',
    fileName: sampleDownload?.fileName || 'ConvertFlow_Setup_v1.2.4.exe',
    fileUrl: sampleDownload?.fileUrl || '#preview',
    version: sampleDownload?.version || '1.2.4',
    platform: sampleDownload?.platform || 'Windows',
    fileSize: sampleDownload?.fileSize || '74.2 MB',
    releaseDate: sampleDownload?.releaseDate || new Date().toISOString().split('T')[0],
    isActive: true,
    downloadCount: sampleDownload?.downloadCount || 128
  };

  const isCustomActive = isGlobal || !!config.useCustomConfig;

  return (
    <div className="space-y-4 text-xs">
      {/* Top Bar: Global vs Custom Mode + Live Preview Trigger */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-900/80 to-purple-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white text-sm">
              {isGlobal
                ? 'Globális Letöltési Folyamat & Státuszvonal Konfiguráció'
                : 'Letöltési Státuszvonal & 10 Lépéses Folyamat Testreszabása'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            {isGlobal
              ? 'Ezek az alapértelmezett beállítások érvényesek minden letöltésre és projektre, ahol nincs egyedi felülírás.'
              : 'Beállíthatod, hogy ez a letöltés a globális beállításokat használja, vagy teljesen egyedi lépéseket, időzítést és megjelenést kapjon.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Élő Teszt / Előnézet</span>
          </button>
        </div>
      </div>

      {/* Per-item Override Selector (only shown when editing a specific Download or Project) */}
      {!isGlobal && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateField('useCustomConfig', false)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              !config.useCustomConfig
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-bold text-xs flex items-center justify-between">
              <span>Globális alapértelmezett használata</span>
              {!config.useCustomConfig && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              A központi Letöltési Folyamat beállításait és lépéseit használja automatikusan.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!config.steps || config.steps.length === 0) {
                handleCopyFromGlobal();
              } else {
                updateField('useCustomConfig', true);
              }
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              config.useCustomConfig
                ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-bold text-xs flex items-center justify-between">
              <span>Egyedi testreszabás ehhez az elemhez</span>
              {config.useCustomConfig && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Saját 10 lépéses feladatlista, egyedi időtartam, színek, karika, pipa és szövegek.
            </p>
          </button>
        </div>
      )}

      {isCustomActive && (
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-5">
          {/* Sub-navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('steps')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'steps'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>1. Feladatok & Státuszok ({config.steps.length} db)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('timing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'timing'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>2. Időzítés & Működés ({config.totalDurationSeconds} mp)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('design')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'design'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>3. Karika, Pipa & Státuszvonal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('texts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'texts'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>4. Minden Szöveg & Felirat</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...DEFAULT_DOWNLOAD_FLOW_CONFIG,
                  useCustomConfig: !isGlobal,
                  steps: createDefaultDownloadSteps()
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Alapértelmezett értékek visszaállítása"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Alaphelyzet</span>
            </button>
          </div>

          {/* ================= TAB 1: STEPS & TASKS EDITOR ================= */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                    Végrehajtandó Feladatok / Státuszok Listája ({config.steps.length} lépés)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Amikor a látogató rákattint a Letöltés gombra, ezek a feladatok futnak végig egymás után forgó karikával, majd animált pipával.
                  </p>
                </div>

                {/* Preset Loaders */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mr-1">
                    Sablon betöltése:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLoadStepPreset('default')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/10 text-slate-300 hover:text-indigo-200 text-[11px] cursor-pointer"
                  >
                    Alap 10 lépés
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadStepPreset('game')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-200 text-[11px] cursor-pointer"
                  >
                    🎮 Játék 10 lépés
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadStepPreset('web')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 text-slate-300 hover:text-cyan-200 text-[11px] cursor-pointer"
                  >
                    🌐 Web / Kód 10 lépés
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {config.steps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2.5 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-[11px]">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-slate-400 text-[11px] font-medium">
                          Feladat / Státusz szövege és beállításai
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Mozgatás feljebb"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, 1)}
                          disabled={idx === config.steps.length - 1}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Mozgatás lejjebb"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          disabled={config.steps.length <= 1}
                          className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-30 cursor-pointer ml-1"
                          title="Lépés törlése"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Kiírt feladat szövege *
                        </label>
                        <input
                          type="text"
                          value={step.label}
                          onChange={(e) => handleStepChange(idx, { label: e.target.value })}
                          placeholder="Pl. Fájl integritás ellenőrzése..."
                          className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Másodlagos részlet / alcím (opcionális)
                        </label>
                        <input
                          type="text"
                          value={step.subtext || ''}
                          onChange={(e) => handleStepChange(idx, { subtext: e.target.value })}
                          placeholder="Pl. SHA-256 hash ellenőrzés"
                          className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Pipa melletti szó
                        </label>
                        <input
                          type="text"
                          value={step.doneBadgeText || ''}
                          onChange={(e) => handleStepChange(idx, { doneBadgeText: e.target.value })}
                          placeholder="Kész"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-emerald-300 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] text-slate-400 mb-1" title="Időtartam súlyozás vagy ezredmásodperc">
                          Idő (ms)
                        </label>
                        <input
                          type="number"
                          min={150}
                          max={10000}
                          step={50}
                          value={step.durationMs || 600}
                          onChange={(e) =>
                            handleStepChange(idx, {
                              durationMs: Math.max(150, parseInt(e.target.value, 10) || 600)
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-white/10 text-indigo-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddStep}
                className="w-full py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-dashed border-indigo-500/40 text-indigo-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Új feladat / státusz lépés hozzáadása ({config.steps.length + 1}. lépés)</span>
              </button>
            </div>
          )}

          {/* ================= TAB 2: TIMING & BEHAVIOR ================= */}
          {activeTab === 'timing' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-white block">
                    Animált Letöltési Folyamat & Státuszvonal Engedélyezése
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Ha be van kapcsolva, a Letöltés gombra kattintva megjelenik a többlépcsős ellenőrző és előkészítő folyamat.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => updateField('enabled', e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3">
                  <label className="block font-bold text-white">
                    Időzítési Mód
                  </label>
                  <select
                    value={config.timingMode}
                    onChange={(e) => updateField('timingMode', e.target.value as 'total' | 'per-step')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="total">
                      Teljes időtartam megadása (automatikus elosztás a lépések között)
                    </option>
                    <option value="per-step">
                      Lépésenkénti egyedi ezredmásodperc (ms) használata
                    </option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    A „Teljes időtartam” módban az összes lépés együtt pontosan a beállított másodperc alatt fut le (minimum 5 mp ajánlott).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3">
                  <label className="block font-bold text-white">
                    Teljes Folyamat Időtartama (másodpercben)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      step={0.5}
                      value={config.totalDurationSeconds}
                      onChange={(e) =>
                        updateField(
                          'totalDurationSeconds',
                          Math.max(1, parseFloat(e.target.value) || 6)
                        )
                      }
                      className="w-28 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-indigo-300 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-400">másodperc</span>
                  </div>

                  {/* Quick duration buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">
                      Gyorsválasztó:
                    </span>
                    {[5, 6, 7, 8, 10, 12, 15].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => updateField('totalDurationSeconds', sec)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors cursor-pointer ${
                          config.totalDurationSeconds === sec
                            ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {sec} mp
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white block">
                      Automatikus fájlletöltés indítása a végén (100%-nál)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Amikor az utolsó pipa is megjelenik, a böngésző automatikusan elindítja a letöltést.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoStartDownload}
                    onChange={(e) => updateField('autoStartDownload', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
                  <label className="block font-bold text-white">
                    Automatikus ablakbezárás befejezés után (mp)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={config.autoCloseAfterSeconds}
                      onChange={(e) =>
                        updateField(
                          'autoCloseAfterSeconds',
                          Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className="w-24 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400">
                      (0 = maradjon nyitva, amíg a felhasználó be nem zárja)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: VISUAL DESIGN, SPINNER & CHECKMARK ================= */}
          {activeTab === 'design' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Accent Color Theme */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2.5">
                  <label className="block font-bold text-white">
                    Színvilág & Akcentus Téma
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'indigo', label: 'Indigó & Lila', dot: 'bg-indigo-500' },
                        { id: 'emerald', label: 'Smaragd & Zöld', dot: 'bg-emerald-500' },
                        { id: 'cyan', label: 'Cián & Kék', dot: 'bg-cyan-400' },
                        { id: 'purple', label: 'Mélylila & Pink', dot: 'bg-purple-500' },
                        { id: 'amber', label: 'Borostyán & Arany', dot: 'bg-amber-400' },
                        { id: 'rose', label: 'Rózsa & Korall', dot: 'bg-rose-500' }
                      ] as { id: DownloadAccentTheme; label: string; dot: string }[]
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateField('accentTheme', t.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          config.accentTheme === t.id
                            ? 'bg-white/10 border-white text-white font-bold'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Bar Style */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2.5">
                  <label className="block font-bold text-white">
                    Státuszvonal (Progress Bar) Stílusa
                  </label>
                  <div className="space-y-2">
                    {(
                      [
                        { id: 'gradient', label: 'Fényes Gradiens Státuszvonal' },
                        { id: 'striped', label: 'Mozgó Csíkozott (Striped) Státuszvonal' },
                        { id: 'segmented', label: 'Lépésekre Osztott Szegmentált Státuszvonal' }
                      ] as { id: DownloadProgressBarStyle; label: string }[]
                    ).map((bar) => (
                      <button
                        key={bar.id}
                        type="button"
                        onClick={() => updateField('progressBarStyle', bar.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          config.progressBarStyle === bar.id
                            ? 'bg-indigo-600/25 border-indigo-400 text-white font-bold'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {bar.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Spinner Style & Checkmark Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2.5">
                  <label className="block font-bold text-white">
                    Forgó Karika (Spinner) Stílusa
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'dual-ring', label: 'Dupla Gyűrű' },
                        { id: 'ring', label: 'Klasszikus Karika' },
                        { id: 'orbit', label: 'Keringő Fényív' },
                        { id: 'dots', label: 'Forgó Pontok' }
                      ] as { id: DownloadSpinnerStyle; label: string }[]
                    ).map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => updateField('spinnerStyle', sp.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          config.spinnerStyle === sp.id
                            ? 'bg-indigo-600/25 border-indigo-400 text-white font-bold'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <StepSpinnerIcon styleType={sp.id} strokeColor="#818cf8" size={20} />
                        <span>{sp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2.5">
                  <label className="block font-bold text-white">
                    Elkészült Pipa (Checkmark) Animáció Stílusa
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'draw', label: 'Rajzolódó Pipa' },
                        { id: 'pop', label: 'Felugró Pipa' },
                        { id: 'shield', label: 'Pajzs Pipa' }
                      ] as { id: DownloadCheckmarkStyle; label: string }[]
                    ).map((ck) => (
                      <button
                        key={ck.id}
                        type="button"
                        onClick={() => updateField('checkmarkStyle', ck.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                          config.checkmarkStyle === ck.id
                            ? 'bg-emerald-600/20 border-emerald-400 text-white font-bold'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <AnimatedCheckmarkIcon styleType={ck.id} size={22} />
                        <span className="text-[11px]">{ck.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between cursor-pointer">
                  <span className="text-slate-200 font-medium">Százalék (%) kijelzése</span>
                  <input
                    type="checkbox"
                    checked={config.showPercentage}
                    onChange={(e) => updateField('showPercentage', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>

                <label className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between cursor-pointer">
                  <span className="text-slate-200 font-medium">Időmérő (mp) kijelzése</span>
                  <input
                    type="checkbox"
                    checked={config.showElapsedTimer}
                    onChange={(e) => updateField('showElapsedTimer', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>

                <label className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between cursor-pointer">
                  <span className="text-slate-200 font-medium">Sorszámok (#01..#10)</span>
                  <input
                    type="checkbox"
                    checked={config.showStepNumbers}
                    onChange={(e) => updateField('showStepNumbers', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>

                <label className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between cursor-pointer">
                  <span className="text-slate-200 font-medium">Technikai alcímek</span>
                  <input
                    type="checkbox"
                    checked={config.showSubtexts}
                    onChange={(e) => updateField('showSubtexts', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>

                <label className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between cursor-pointer sm:col-span-2">
                  <span className="text-slate-200 font-medium">
                    Fájlnév, verzió és méret információs sáv megjelenítése
                  </span>
                  <input
                    type="checkbox"
                    checked={config.showFileInfoCard}
                    onChange={(e) => updateField('showFileInfoCard', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ================= TAB 4: ALL TEXTS & LABELS ================= */}
          {activeTab === 'texts' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Letöltés gomb felirata
                  </label>
                  <input
                    type="text"
                    value={config.buttonText}
                    onChange={(e) => updateField('buttonText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Gomb felirata folyamat közben
                  </label>
                  <input
                    type="text"
                    value={config.downloadingButtonText}
                    onChange={(e) => updateField('downloadingButtonText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Gomb felirata elkészülés után
                  </label>
                  <input
                    type="text"
                    value={config.completedButtonText}
                    onChange={(e) => updateField('completedButtonText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Folyamatablak Főcíme (ellenőrzés közben)
                  </label>
                  <input
                    type="text"
                    value={config.modalTitle}
                    onChange={(e) => updateField('modalTitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sikeres Befejezés Főcíme (100%-nál)
                  </label>
                  <input
                    type="text"
                    value={config.completionTitle}
                    onChange={(e) => updateField('completionTitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-emerald-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Folyamatablak Alcíme / Leírása
                  </label>
                  <textarea
                    rows={2}
                    value={config.modalSubtitle}
                    onChange={(e) => updateField('modalSubtitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sikeres Befejezés Leírása
                  </label>
                  <textarea
                    rows={2}
                    value={config.completionSubtitle}
                    onChange={(e) => updateField('completionSubtitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Közvetlen Letöltés Gomb Szövege (a végén)
                  </label>
                  <input
                    type="text"
                    value={config.manualDownloadButtonText}
                    onChange={(e) => updateField('manualDownloadButtonText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Bezárás Gomb Szövege
                  </label>
                  <input
                    type="text"
                    value={config.closeButtonText}
                    onChange={(e) => updateField('closeButtonText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Preview Modal */}
      <DownloadProcessModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        download={previewDownloadObj}
        overrideConfig={
          isCustomActive ? config : downloadFlowService.getGlobalConfig()
        }
        isPreviewMode={true}
      />
    </div>
  );
};
