import {
  Project,
  Download,
  ProjectRequest,
  ProjectCategory,
  ProjectType,
  SiteSettings,
  AdminUser,
  NotificationItem,
  Promotion,
  PromotionStatus,
  RequestStatus,
  PublicRequestStatusDTO,
  EmailTemplate,
  EmailHistoryItem,
  EmailHistoryStatus,
  StatusTemplateMap,
  DownloadFlowConfig,
  DownloadStepItem
} from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_DOWNLOADS,
  INITIAL_REQUESTS,
  INITIAL_SETTINGS,
  INITIAL_ADMIN_USER,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROMOTIONS,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_STATUS_TEMPLATE_MAP
} from '../data/initialData';
import { pushKeyToServer } from './syncService';

const KEYS = {
  PROJECTS: 'hl_studio_projects',
  DOWNLOADS: 'hl_studio_downloads',
  DOWNLOAD_FLOW_CONFIG: 'hl_studio_download_flow_config',
  REQUESTS: 'hl_studio_requests',
  PROMOTIONS: 'hl_studio_promotions',
  EMAIL_TEMPLATES: 'hl_studio_email_templates',
  STATUS_TEMPLATE_MAP: 'hl_studio_status_template_map',
  SETTINGS: 'hl_studio_settings',
  NOTIFICATIONS: 'hl_studio_notifications',
  AUTH: 'hl_studio_admin_session',
  ADMIN_PASSWORD: 'hl_studio_admin_pwd'
};

function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStorage<T>(key: string, value: T, syncToServer = true): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(`store_${key}`, { detail: value }));
    if (syncToServer) {
      pushKeyToServer(key, value);
    }
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// ================= PROJECT CATEGORY CONFIGURATION & HELPERS =================
export interface ProjectCategoryDefinition {
  id: ProjectCategory;
  shortLabel: string;
  label: string;
  icon: string;
  badgeText: string;
  description: string;
  defaultProjectType: ProjectType;
}

export const PROJECT_CATEGORIES: ProjectCategoryDefinition[] = [
  {
    id: 'Weboldal',
    shortLabel: 'Weboldal',
    label: 'Weboldal',
    icon: '🌐',
    badgeText: '🌐 Weboldal',
    description: 'Bemutatkozó oldalak, céges weboldalak, portfóliók és modern egyedi landing page-ek.',
    defaultProjectType: 'Weboldal'
  },
  {
    id: 'Webalkalmazás',
    shortLabel: 'Webapp',
    label: 'Webalkalmazás',
    icon: '⚡',
    badgeText: '⚡ Webalkalmazás',
    description: 'Összetett webes rendszerek, portálok, webshopok, SaaS megoldások és interaktív funkciók.',
    defaultProjectType: 'Webalkalmazás'
  },
  {
    id: 'Játékprojekt',
    shortLabel: 'Játék',
    label: 'Játékprojekt',
    icon: '🎮',
    badgeText: '🎮 Játékprojekt',
    description: 'Egyedi játékötletek, szimulátorok, stratégiai és indie játékprojektek megvalósítása.',
    defaultProjectType: 'Játékprojekt'
  },
  {
    id: 'Mobilalkalmazás',
    shortLabel: 'Mobil',
    label: 'Mobilalkalmazás',
    icon: '📱',
    badgeText: '📱 Mobilalkalmazás',
    description: 'Modern Android és iOS mobilalkalmazások, cross-platform megoldások és kliens appok.',
    defaultProjectType: 'Mobilalkalmazás'
  },
  {
    id: 'Egyedi szoftver',
    shortLabel: 'Szoftver',
    label: 'Egyedi szoftver',
    icon: '💻',
    badgeText: '💻 Egyedi szoftver',
    description: 'Asztali alkalmazások, üzleti automatizációk, belső vállalati rendszerek és célprogramok.',
    defaultProjectType: 'Egyedi szoftver'
  },
  {
    id: 'AI projekt',
    shortLabel: 'AI',
    label: 'AI projekt',
    icon: '🤖',
    badgeText: '🤖 AI projekt',
    description: 'Generatív AI integrációk, intelligens asszisztensek, nyelvi modellek és adatfeldolgozó rendszerek.',
    defaultProjectType: 'AI projekt'
  },
  {
    id: 'Egyéb projekt',
    shortLabel: 'Egyéb',
    label: 'Egyéb projekt',
    icon: '🧩',
    badgeText: '🧩 Egyéb projekt',
    description: 'Speciális digitális ötletek, hibrid megoldások, prototípusok vagy egyedi tanácsadás.',
    defaultProjectType: 'Egyéb'
  }
];

export function inferProjectCategory(
  projectType?: string,
  existingCategory?: ProjectCategory | string
): ProjectCategory {
  if (existingCategory) {
    if (existingCategory === 'Weboldal / Webalkalmazás') {
      return projectType === 'Webalkalmazás' ? 'Webalkalmazás' : 'Weboldal';
    }
    const found = PROJECT_CATEGORIES.find(
      (c) =>
        c.id.toLowerCase() === existingCategory.toLowerCase() ||
        c.shortLabel.toLowerCase() === existingCategory.toLowerCase()
    );
    if (found) return found.id;
  }

  switch (projectType) {
    case 'Weboldal':
      return 'Weboldal';
    case 'Webalkalmazás':
      return 'Webalkalmazás';
    case 'Egyedi szoftver':
    case 'Asztali alkalmazás':
      return 'Egyedi szoftver';
    case 'AI projekt':
      return 'AI projekt';
    case 'Játékprojekt':
      return 'Játékprojekt';
    case 'Mobilalkalmazás':
      return 'Mobilalkalmazás';
    default:
      return 'Egyéb projekt';
  }
}

export function getCategoryIcon(category?: ProjectCategory | string): string {
  const normalized = inferProjectCategory(category, category);
  const found = PROJECT_CATEGORIES.find((c) => c.id === normalized);
  return found ? found.icon : '🧩';
}

export const getProjectCategoryEmoji = getCategoryIcon;

export function formatCategoryWithIcon(category?: ProjectCategory | string): string {
  const normalized = inferProjectCategory(category, category);
  const found = PROJECT_CATEGORIES.find((c) => c.id === normalized);
  return found ? `${found.icon} ${found.label}` : `🧩 ${normalized}`;
}

// Initialize default data if not present
export function initializeStorage(): void {
  if (!localStorage.getItem(KEYS.PROJECTS)) {
    setStorage(KEYS.PROJECTS, INITIAL_PROJECTS, false);
  }
  if (!localStorage.getItem(KEYS.DOWNLOADS)) {
    setStorage(KEYS.DOWNLOADS, INITIAL_DOWNLOADS, false);
  }
  if (!localStorage.getItem(KEYS.REQUESTS)) {
    setStorage(KEYS.REQUESTS, INITIAL_REQUESTS, false);
  } else {
    // Ensure new sample game project request is seeded if missing
    const existingReqs = getStorage<ProjectRequest[]>(KEYS.REQUESTS, INITIAL_REQUESTS);
    const hasGameSample = existingReqs.some((r) => r.id === 'req-103' || r.requestId === 'HL-9G2M-41KP');
    if (!hasGameSample) {
      const gameSample = INITIAL_REQUESTS.find((r) => r.id === 'req-103');
      if (gameSample) {
        setStorage(KEYS.REQUESTS, [...existingReqs, gameSample], false);
      }
    }
  }
  if (!localStorage.getItem(KEYS.PROMOTIONS)) {
    setStorage(KEYS.PROMOTIONS, INITIAL_PROMOTIONS, false);
  } else {
    // Ensure new Game Project promotion (/ajanlat/ingyenes-jatekprojekt) is seeded if missing
    const existingPromos = getStorage<Promotion[]>(KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
    const hasGamePromo = existingPromos.some(
      (p) => p.slug === 'ingyenes-jatekprojekt' || p.id === 'promo-ingyenes-jatekprojekt'
    );
    if (!hasGamePromo) {
      const gamePromo = INITIAL_PROMOTIONS.find((p) => p.slug === 'ingyenes-jatekprojekt');
      if (gamePromo) {
        setStorage(KEYS.PROMOTIONS, [gamePromo, ...existingPromos], false);
      }
    }
  }
  if (!localStorage.getItem(KEYS.EMAIL_TEMPLATES)) {
    setStorage(KEYS.EMAIL_TEMPLATES, INITIAL_EMAIL_TEMPLATES, false);
  }
  if (!localStorage.getItem(KEYS.STATUS_TEMPLATE_MAP)) {
    setStorage(KEYS.STATUS_TEMPLATE_MAP, INITIAL_STATUS_TEMPLATE_MAP, false);
  }
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    setStorage(KEYS.SETTINGS, INITIAL_SETTINGS, false);
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    setStorage(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS, false);
  }
  if (!localStorage.getItem(KEYS.ADMIN_PASSWORD)) {
    // Default admin password for local development
    localStorage.setItem(KEYS.ADMIN_PASSWORD, 'admin2026');
  }
}

// ================= PROJECTS =================
export const projectService = {
  getAll: (includePrivate = false): Project[] => {
    initializeStorage();
    const all = getStorage<Project[]>(KEYS.PROJECTS, INITIAL_PROJECTS);
    if (includePrivate) return all;
    return all.filter((p) => p.isPublic);
  },

  getBySlug: (slug: string): Project | undefined => {
    const all = projectService.getAll(true);
    return all.find((p) => p.slug === slug);
  },

  getById: (id: string): Project | undefined => {
    const all = projectService.getAll(true);
    return all.find((p) => p.id === id);
  },

  save: (project: Project): Project => {
    const all = projectService.getAll(true);
    const existingIndex = all.findIndex((p) => p.id === project.id);
    const now = new Date().toISOString();

    let savedProject: Project;
    let updated: Project[];
    if (existingIndex >= 0) {
      savedProject = { ...project, updatedAt: now };
      updated = [...all];
      updated[existingIndex] = savedProject;
    } else {
      savedProject = {
        ...project,
        id: project.id || `proj-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      updated = [savedProject, ...all];
    }

    // If project has a downloadUrl configured, ensure a linked Download item exists and is synced
    if (savedProject.downloadUrl && savedProject.downloadUrl.trim()) {
      const allDownloads = getStorage<Download[]>(KEYS.DOWNLOADS, INITIAL_DOWNLOADS);
      const existingDlIdx = allDownloads.findIndex(
        (d) =>
          (savedProject.downloadId && d.id === savedProject.downloadId) ||
          d.projectId === savedProject.id
      );
      const dlId =
        existingDlIdx >= 0
          ? allDownloads[existingDlIdx].id
          : savedProject.downloadId || `dl-${savedProject.id}`;

      savedProject.downloadId = dlId;

      const syncedDl: Download = {
        id: dlId,
        projectId: savedProject.id,
        projectSlug: savedProject.slug,
        projectTitle: savedProject.title,
        fileName:
          savedProject.downloadFileName ||
          (existingDlIdx >= 0 ? allDownloads[existingDlIdx].fileName : '') ||
          `${savedProject.slug.replace(/-/g, '_')}_v${savedProject.version || '1.0.0'}.zip`,
        fileUrl: savedProject.downloadUrl.trim(),
        version: savedProject.version || '1.0.0',
        platform:
          savedProject.downloadPlatform ||
          (existingDlIdx >= 0 ? allDownloads[existingDlIdx].platform : 'Windows'),
        fileSize:
          savedProject.downloadFileSize ||
          (existingDlIdx >= 0 ? allDownloads[existingDlIdx].fileSize : '45 MB'),
        releaseDate:
          existingDlIdx >= 0
            ? allDownloads[existingDlIdx].releaseDate
            : now.split('T')[0],
        isActive: true,
        downloadCount: existingDlIdx >= 0 ? allDownloads[existingDlIdx].downloadCount : 0,
        changelog: existingDlIdx >= 0 ? allDownloads[existingDlIdx].changelog : '',
        flowConfig:
          savedProject.flowConfig ||
          (existingDlIdx >= 0 ? allDownloads[existingDlIdx].flowConfig : undefined)
      };

      const nextDownloads = [...allDownloads];
      if (existingDlIdx >= 0) {
        nextDownloads[existingDlIdx] = syncedDl;
      } else {
        nextDownloads.unshift(syncedDl);
      }
      setStorage(KEYS.DOWNLOADS, nextDownloads);
    }

    setStorage(KEYS.PROJECTS, updated);
    return savedProject;
  },

  delete: (id: string): boolean => {
    const all = projectService.getAll(true);
    const filtered = all.filter((p) => p.id !== id);
    setStorage(KEYS.PROJECTS, filtered);
    return filtered.length < all.length;
  },

  togglePublish: (id: string): Project | undefined => {
    const all = projectService.getAll(true);
    const project = all.find((p) => p.id === id);
    if (!project) return undefined;
    project.isPublic = !project.isPublic;
    project.updatedAt = new Date().toISOString();
    setStorage(KEYS.PROJECTS, all);
    return project;
  }
};

// ================= DOWNLOADS =================
export const downloadService = {
  getAll: (activeOnly = false): Download[] => {
    initializeStorage();
    const all = getStorage<Download[]>(KEYS.DOWNLOADS, INITIAL_DOWNLOADS);
    if (activeOnly) return all.filter((d) => d.isActive);
    return all;
  },

  getById: (id: string): Download | undefined => {
    const all = downloadService.getAll();
    return all.find((d) => d.id === id);
  },

  getByProjectId: (projectId: string): Download[] => {
    const all = downloadService.getAll();
    const proj = projectService.getById(projectId);
    return all.filter(
      (d) =>
        d.isActive &&
        (d.projectId === projectId ||
          (proj && (d.projectSlug === proj.slug || proj.downloadId === d.id)))
    );
  },

  getForProject: (project: Project): Download[] => {
    const all = downloadService.getAll();
    const matched = all.filter(
      (d) =>
        d.isActive &&
        (d.projectId === project.id ||
          d.projectSlug === project.slug ||
          (project.downloadId && d.id === project.downloadId))
    );
    if (matched.length > 0) return matched;

    // If project has direct downloadUrl configured, return a synthesized Download item
    if (project.downloadUrl && project.downloadUrl.trim()) {
      return [
        {
          id: project.downloadId || `dl-proj-${project.id}`,
          projectId: project.id,
          projectSlug: project.slug,
          projectTitle: project.title,
          fileName:
            project.downloadFileName ||
            `${project.slug.replace(/-/g, '_')}_v${project.version || '1.0.0'}.zip`,
          fileUrl: project.downloadUrl,
          version: project.version || '1.0.0',
          platform: project.downloadPlatform || 'Windows',
          fileSize: project.downloadFileSize || '45 MB',
          releaseDate: project.updatedAt ? project.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          isActive: true,
          downloadCount: 0,
          flowConfig: project.flowConfig
        }
      ];
    }

    return [];
  },

  save: (download: Download): Download => {
    const all = downloadService.getAll();
    const existingIndex = all.findIndex((d) => d.id === download.id);
    let savedItem: Download;
    let updated: Download[];

    if (existingIndex >= 0) {
      savedItem = { ...download };
      updated = [...all];
      updated[existingIndex] = savedItem;
    } else {
      savedItem = {
        ...download,
        id: download.id || `dl-${Date.now()}`,
        downloadCount: download.downloadCount || 0
      };
      updated = [savedItem, ...all];
    }
    setStorage(KEYS.DOWNLOADS, updated);

    // Ensure linked project also references this downloadId so project pages/cards always show the download button
    if (savedItem.projectId) {
      const allProjects = getStorage<Project[]>(KEYS.PROJECTS, INITIAL_PROJECTS);
      const pIdx = allProjects.findIndex((p) => p.id === savedItem.projectId);
      if (pIdx >= 0 && !allProjects[pIdx].downloadId) {
        allProjects[pIdx] = {
          ...allProjects[pIdx],
          downloadId: savedItem.id
        };
        setStorage(KEYS.PROJECTS, allProjects);
      }
    }

    return savedItem;
  },

  delete: (id: string): boolean => {
    const all = downloadService.getAll();
    const filtered = all.filter((d) => d.id !== id);
    setStorage(KEYS.DOWNLOADS, filtered);
    return filtered.length < all.length;
  },

  incrementCount: (id: string): void => {
    const all = downloadService.getAll();
    const item = all.find((d) => d.id === id);
    if (item) {
      item.downloadCount = (item.downloadCount || 0) + 1;
      setStorage(KEYS.DOWNLOADS, all);
    }
  }
};

// ================= DOWNLOAD PROGRESS & VERIFICATION FLOW CONFIGURATION =================
export function createDefaultDownloadSteps(): DownloadStepItem[] {
  return [
    {
      id: 'step-1',
      label: 'Kapcsolódás a kiadási szerverhez...',
      subtext: 'Titkosított TLS 1.3 csatorna felépítése',
      doneBadgeText: 'Kapcsolódva',
      durationMs: 550
    },
    {
      id: 'step-2',
      label: 'Projekt csomag és verzióazonosító lekérése...',
      subtext: 'Metaadatok és kiadási jegyzék egyeztetése',
      doneBadgeText: 'Azonosítva',
      durationMs: 550
    },
    {
      id: 'step-3',
      label: 'Fájl integritás és SHA-256 ellenőrzőösszeg vizsgálata...',
      subtext: 'Kriptográfiai hash ellenőrzés',
      doneBadgeText: 'Hitelesítve',
      durationMs: 650
    },
    {
      id: 'step-4',
      label: 'Biztonsági és kártékonykód-mentességi ellenőrzés...',
      subtext: 'Stúdió biztonsági tanúsítvány ellenőrzése',
      doneBadgeText: 'Tiszta',
      durationMs: 650
    },
    {
      id: 'step-5',
      label: 'Függőségek és futtatókörnyezeti modulok validálása...',
      subtext: 'Rendszerkövetelmények és könyvtárak ellenőrzése',
      doneBadgeText: 'Validálva',
      durationMs: 600
    },
    {
      id: 'step-6',
      label: 'Telepítőcsomag és erőforrások előkészítése...',
      subtext: 'Bináris állományok és konfigurációk összekészítése',
      doneBadgeText: 'Előkészítve',
      durationMs: 650
    },
    {
      id: 'step-7',
      label: 'Digitális aláírás és kiadói tanúsítvány ellenőrzése...',
      subtext: 'Horvát László – Web & Project Studio aláírás',
      doneBadgeText: 'Aláírva',
      durationMs: 550
    },
    {
      id: 'step-8',
      label: 'Optimalizált letöltési csatorna megnyitása...',
      subtext: 'Gyorsítótárazott szerver végpont kiválasztása',
      doneBadgeText: 'Megnyitva',
      durationMs: 550
    },
    {
      id: 'step-9',
      label: 'Adatfolyam inicializálása és csomagolás véglegesítése...',
      subtext: 'Letöltési munkamenet indítása',
      doneBadgeText: 'Kész',
      durationMs: 600
    },
    {
      id: 'step-10',
      label: 'Letöltés indítása a böngészőben...',
      subtext: 'Állomány átadása a kliensnek',
      doneBadgeText: 'Elindítva',
      durationMs: 650
    }
  ];
}

export const DEFAULT_DOWNLOAD_FLOW_CONFIG: DownloadFlowConfig = {
  enabled: true,
  useCustomConfig: false,
  displayMode: 'modal',
  timingMode: 'total',
  totalDurationSeconds: 6,
  accentTheme: 'indigo',
  spinnerStyle: 'dual-ring',
  checkmarkStyle: 'draw',
  progressBarStyle: 'gradient',
  showPercentage: true,
  showElapsedTimer: true,
  showStepNumbers: true,
  showSubtexts: true,
  showFileInfoCard: true,
  autoStartDownload: true,
  autoCloseAfterSeconds: 0,
  buttonText: 'Letöltés',
  downloadingButtonText: 'Előkészítés folyamatban...',
  completedButtonText: 'Letöltés elindult!',
  modalTitle: 'Telepítőcsomag Előkészítése & Ellenőrzése',
  modalSubtitle:
    'Kérjük, várj néhány másodpercet, amíg a rendszer ellenőrzi az állomány integritását és előkészíti a biztonságos letöltést.',
  completionTitle: 'Minden ellenőrzés sikeres – A letöltés elindult!',
  completionSubtitle:
    'A telepítőcsomag sikeresen átment az összes ellenőrzési lépésen. Ha a letöltés nem indult el automatikusan, kattints az alábbi gombra.',
  manualDownloadButtonText: 'Közvetlen letöltés indítása',
  closeButtonText: 'Bezárás',
  steps: createDefaultDownloadSteps()
};

export const downloadFlowService = {
  getGlobalConfig: (): DownloadFlowConfig => {
    initializeStorage();
    const stored = getStorage<DownloadFlowConfig | null>(KEYS.DOWNLOAD_FLOW_CONFIG, null);
    if (!stored) return { ...DEFAULT_DOWNLOAD_FLOW_CONFIG, steps: createDefaultDownloadSteps() };
    return {
      ...DEFAULT_DOWNLOAD_FLOW_CONFIG,
      ...stored,
      steps:
        Array.isArray(stored.steps) && stored.steps.length > 0
          ? stored.steps
          : createDefaultDownloadSteps()
    };
  },

  saveGlobalConfig: (config: DownloadFlowConfig): DownloadFlowConfig => {
    const normalized: DownloadFlowConfig = {
      ...DEFAULT_DOWNLOAD_FLOW_CONFIG,
      ...config,
      totalDurationSeconds: Math.max(1, Number(config.totalDurationSeconds) || 6),
      steps:
        Array.isArray(config.steps) && config.steps.length > 0
          ? config.steps
          : createDefaultDownloadSteps()
    };
    setStorage(KEYS.DOWNLOAD_FLOW_CONFIG, normalized);
    return normalized;
  },

  resetGlobalConfig: (): DownloadFlowConfig => {
    const fresh: DownloadFlowConfig = {
      ...DEFAULT_DOWNLOAD_FLOW_CONFIG,
      steps: createDefaultDownloadSteps()
    };
    setStorage(KEYS.DOWNLOAD_FLOW_CONFIG, fresh);
    return fresh;
  },

  resolveConfig: (download?: Download | null, project?: Project | null): DownloadFlowConfig => {
    const globalCfg = downloadFlowService.getGlobalConfig();
    if (download?.flowConfig && download.flowConfig.useCustomConfig) {
      return {
        ...globalCfg,
        ...download.flowConfig,
        steps:
          Array.isArray(download.flowConfig.steps) && download.flowConfig.steps.length > 0
            ? download.flowConfig.steps
            : globalCfg.steps
      };
    }
    if (project?.flowConfig && project.flowConfig.useCustomConfig) {
      return {
        ...globalCfg,
        ...project.flowConfig,
        steps:
          Array.isArray(project.flowConfig.steps) && project.flowConfig.steps.length > 0
            ? project.flowConfig.steps
            : globalCfg.steps
      };
    }
    return globalCfg;
  }
};

// ================= PROMOTIONS UTILITIES & SERVICE =================
export function slugify(text: string): string {
  if (!text) return '';
  const charMap: Record<string, string> = {
    á: 'a', é: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o', ú: 'u', ü: 'u', ű: 'u',
    Á: 'a', É: 'e', Í: 'i', Ó: 'o', Ö: 'o', Ő: 'o', Ú: 'u', Ü: 'u', Ű: 'u'
  };
  const result = text
    .split('')
    .map((c) => charMap[c] || c)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return result || `promo-${Date.now()}`;
}

export function formatHungarianDate(dateStr: string, timeStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthNames = [
      'január', 'február', 'március', 'április', 'május', 'június',
      'július', 'augusztus', 'szeptember', 'október', 'november', 'december'
    ];
    const monthName = monthNames[monthIndex] || parts[1];
    const timeFormatted = timeStr ? ` ${timeStr}` : '';
    return `${year}. ${monthName} ${day}.${timeFormatted}`;
  } catch {
    return dateStr;
  }
}

export function getPromotionStatus(promo: Promotion): PromotionStatus {
  if (promo.isArchived) return 'Archivált';
  if (!promo.active) return 'Archivált';

  const now = new Date();
  const startTime = promo.startTime || '00:00';
  const endTime = promo.endTime || '23:59';

  const start = new Date(`${promo.startDate}T${startTime}:00`);
  const end = new Date(`${promo.endDate}T${endTime}:00`);

  if (!isNaN(start.getTime()) && now < start) {
    return 'Tervezett';
  }
  if (!isNaN(end.getTime()) && now > end) {
    return 'Lejárt';
  }
  return 'Aktív';
}

export function isPromotionActive(promo: Promotion): boolean {
  if (!promo || !promo.active || promo.isArchived) return false;
  return getPromotionStatus(promo) === 'Aktív';
}

export function formatPromotionValidity(promo: Promotion): string {
  const formatted = formatHungarianDate(promo.endDate, promo.endTime);
  return `${formatted}-ig`;
}

export const promotionService = {
  getAll: (includeArchived = true): Promotion[] => {
    initializeStorage();
    const all = getStorage<Promotion[]>(KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
    if (includeArchived) return all;
    return all.filter((p) => !p.isArchived);
  },

  getActive: (): Promotion[] => {
    const all = promotionService.getAll(false);
    return all.filter((p) => isPromotionActive(p));
  },

  getBySlug: (slug: string): Promotion | undefined => {
    const all = promotionService.getAll(true);
    return all.find((p) => p.slug === slug);
  },

  getById: (id: string): Promotion | undefined => {
    const all = promotionService.getAll(true);
    return all.find((p) => p.id === id);
  },

  save: (promoData: Partial<Promotion> & { title: string }): { promotion?: Promotion; error?: string } => {
    const all = promotionService.getAll(true);
    const now = new Date().toISOString();

    const title = promoData.title?.trim();
    if (!title) {
      return { error: 'A promóció címe nem lehet üres.' };
    }

    if (promoData.startDate && promoData.endDate) {
      const startDateTime = new Date(`${promoData.startDate}T${promoData.startTime || '00:00'}:00`);
      const endDateTime = new Date(`${promoData.endDate}T${promoData.endTime || '23:59'}:00`);
      if (endDateTime < startDateTime) {
        return { error: 'A lejárati dátum és idő nem lehet korábbi a kezdési időpontnál.' };
      }
    }

    let slug = promoData.slug ? slugify(promoData.slug) : slugify(title);
    if (!slug) {
      slug = `promo-${Date.now()}`;
    }

    // Check duplicate slug across non-self items
    const duplicate = all.find((p) => p.slug === slug && p.id !== promoData.id);
    if (duplicate) {
      return { error: `Ez az egyedi URL azonosító (slug: "${slug}") már foglalt. Válassz másikat!` };
    }

    const existingIndex = promoData.id ? all.findIndex((p) => p.id === promoData.id) : -1;
    let saved: Promotion;

    if (existingIndex >= 0) {
      saved = {
        ...all[existingIndex],
        ...promoData,
        title,
        shortTitle: promoData.shortTitle?.trim() || title,
        slug,
        updatedAt: now
      } as Promotion;
      const updated = [...all];
      updated[existingIndex] = saved;
      setStorage(KEYS.PROMOTIONS, updated);
    } else {
      saved = {
        id: promoData.id || `promo-${Date.now()}`,
        title,
        shortTitle: promoData.shortTitle?.trim() || title,
        slug,
        shortDescription: promoData.shortDescription?.trim() || '',
        fullDescription: promoData.fullDescription?.trim() || '',
        icon: promoData.icon || '🎁',
        image: promoData.image || '',
        ctaText: promoData.ctaText?.trim() || 'Ajánlatot kérek',
        startDate: promoData.startDate || new Date().toISOString().split('T')[0],
        startTime: promoData.startTime || '00:00',
        endDate: promoData.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        endTime: promoData.endTime || '23:59',
        active: promoData.active !== undefined ? promoData.active : true,
        showBanner: !!promoData.showBanner,
        allowRequests: promoData.allowRequests !== undefined ? promoData.allowRequests : true,
        features: promoData.features && promoData.features.length > 0 ? promoData.features : [
          'modern weboldal',
          'reszponzív kialakítás',
          'alapvető UI/UX',
          'alapfunkciók',
          'egyeztetés'
        ],
        additionalInfo: promoData.additionalInfo || '',
        isArchived: false,
        createdAt: now,
        updatedAt: now
      };
      const updated = [saved, ...all];
      setStorage(KEYS.PROMOTIONS, updated);
    }

    return { promotion: saved };
  },

  delete: (id: string): boolean => {
    const all = promotionService.getAll(true);
    const filtered = all.filter((p) => p.id !== id);
    setStorage(KEYS.PROMOTIONS, filtered);
    return filtered.length < all.length;
  },

  toggleActive: (id: string): Promotion | undefined => {
    const all = promotionService.getAll(true);
    const promo = all.find((p) => p.id === id);
    if (!promo) return undefined;
    promo.active = !promo.active;
    promo.updatedAt = new Date().toISOString();
    setStorage(KEYS.PROMOTIONS, all);
    return promo;
  },

  toggleArchive: (id: string): Promotion | undefined => {
    const all = promotionService.getAll(true);
    const promo = all.find((p) => p.id === id);
    if (!promo) return undefined;
    promo.isArchived = !promo.isArchived;
    promo.updatedAt = new Date().toISOString();
    setStorage(KEYS.PROMOTIONS, all);
    return promo;
  },

  getBannerPromotion: (): Promotion | null => {
    const activePromos = promotionService.getActive();
    const bannerPromo = activePromos.find((p) => p.showBanner);
    return bannerPromo || null;
  },

  getRequestsCount: (promotionId: string): number => {
    const requests = requestService.getAll();
    return requests.filter((r) => r.promotionId === promotionId).length;
  }
};

// ================= PROJECT REQUESTS & TRACKING SYSTEM =================
const SAFE_ID_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const REQUEST_ID_FORMAT = /^HL-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function generateSecureRandomRequestId(existingIds: Set<string> = new Set()): string {
  const generateBlock = (len: number): string => {
    const array = new Uint32Array(len);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
      return Array.from(array, (n) => SAFE_ID_CHARS[n % SAFE_ID_CHARS.length]).join('');
    }
    let out = '';
    for (let i = 0; i < len; i++) {
      out += SAFE_ID_CHARS[Math.floor(Math.random() * SAFE_ID_CHARS.length)];
    }
    return out;
  };

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = `HL-${generateBlock(4)}-${generateBlock(4)}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }
  return `HL-${generateBlock(4)}-${generateBlock(4)}`;
}

export const DEFAULT_PUBLIC_STATUS_MESSAGES: Record<RequestStatus, string> = {
  'Új': 'Az ajánlatkérésed sikeresen beérkezett rendszerünkbe. Hamarosan megkezdem az elképzelésed áttekintését.',
  'Átnézés alatt': 'Az ajánlatkérésedet jelenleg átnézem. Hamarosan e-mailben felveszem veled a kapcsolatot.',
  'Kapcsolatfelvétel': 'A megadott e-mail címen felvettem veled a kapcsolatot a részletek pontosítása érdekében.',
  'Ajánlat egyeztetése': 'Az előzetes specifikáció, az ütemezés és az ajánlat részletei jelenleg egyeztetés alatt állnak.',
  'Elfogadva': 'A projektajánlat elfogadásra került, előkészítjük a fejlesztési fázis indulását.',
  'Folyamatban': 'A projekt fejlesztése folyamatban van a megbeszélt specifikáció alapján.',
  'Tesztelés': 'A projekt elkészült moduljai jelenleg minőségbiztosítási és tesztelési fázisban vannak.',
  'Elkészült': 'A projekt sikeresen elkészült és átadásra kész!',
  'Lezárva': 'Az ajánlatkérés és a hozzá tartozó projekt sikeresen lezárult.',
  'Elutasítva': 'Sajnáljuk, de a megkeresést jelenleg kapacitási vagy profilbeli okokból nem tudjuk vállalni.'
};

export function getStatusEmoji(status: RequestStatus | string): string {
  switch (status) {
    case 'Új':
      return '🆕';
    case 'Átnézés alatt':
      return '👀';
    case 'Kapcsolatfelvétel':
      return '💬';
    case 'Ajánlat egyeztetése':
      return '💰';
    case 'Elfogadva':
      return '✅';
    case 'Folyamatban':
      return '🔨';
    case 'Tesztelés':
      return '🧪';
    case 'Elkészült':
      return '🎉';
    case 'Lezárva':
      return '📁';
    case 'Elutasítva':
      return '❌';
    default:
      return '📌';
  }
}

export function formatTrackingDate(isoStr: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}.`;
  } catch {
    return isoStr;
  }
}

export function formatTrackingDateTime(isoStr: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}. ${hh}:${min}`;
  } catch {
    return isoStr;
  }
}

function syncRequestsToBackend(requests: ProjectRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    fetch('/api/requests/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: requests.map((r) => ({
          id: r.id,
          requestId: r.requestId,
          name: r.name,
          email: r.email,
          projectName: r.projectName,
          projectType: r.projectType,
          projectCategory: r.projectCategory || inferProjectCategory(r.projectType),
          gameName: r.gameName,
          gameType: r.gameType,
          platform: r.platform,
          status: r.status,
          internalStatus: r.internalStatus || r.status,
          publicStatus: r.publicStatus || r.status,
          publicStatusMessage: r.publicStatusMessage,
          promotionTitle: r.promotionTitle,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }))
      })
    }).catch(() => {
      // Non-blocking background sync
    });
  } catch {
    // Ignore sync errors in offline mode
  }
}

function normalizeStoredRequests(rawList: ProjectRequest[]): { list: ProjectRequest[]; changed: boolean } {
  let changed = false;
  const usedIds = new Set<string>();

  for (const item of rawList) {
    if (item.requestId && REQUEST_ID_FORMAT.test(item.requestId)) {
      usedIds.add(item.requestId.toUpperCase());
    }
  }

  const normalized = rawList.map((item) => {
    let updatedItem = { ...item };

    // Ensure deterministic requestId for initial demo items or generate secure random ID
    if (!updatedItem.requestId || !REQUEST_ID_FORMAT.test(updatedItem.requestId)) {
      changed = true;
      if (updatedItem.id === 'req-101' && !usedIds.has('HL-3M8Q-54VN')) {
        updatedItem.requestId = 'HL-3M8Q-54VN';
      } else if (updatedItem.id === 'req-102' && !usedIds.has('HL-7K4P-92XM')) {
        updatedItem.requestId = 'HL-7K4P-92XM';
      } else if (updatedItem.id === 'req-103' && !usedIds.has('HL-9G2M-41KP')) {
        updatedItem.requestId = 'HL-9G2M-41KP';
      } else {
        updatedItem.requestId = generateSecureRandomRequestId(usedIds);
      }
      usedIds.add(updatedItem.requestId);
    }

    // Ensure projectCategory and requestedFeatures / requiredFeatures consistency
    if (!updatedItem.projectCategory) {
      changed = true;
      updatedItem.projectCategory = inferProjectCategory(updatedItem.projectType);
    }
    if (!updatedItem.requestedFeatures && Array.isArray(updatedItem.requiredFeatures)) {
      changed = true;
      updatedItem.requestedFeatures = [...updatedItem.requiredFeatures];
    } else if (!updatedItem.requiredFeatures && Array.isArray(updatedItem.requestedFeatures)) {
      changed = true;
      updatedItem.requiredFeatures = [...updatedItem.requestedFeatures];
    } else if (!updatedItem.requestedFeatures && !updatedItem.requiredFeatures) {
      changed = true;
      updatedItem.requestedFeatures = [];
      updatedItem.requiredFeatures = [];
    }

    // Legacy status normalization
    const validStatus: RequestStatus = (updatedItem.status as RequestStatus) || 'Új';
    if (!updatedItem.internalStatus) {
      changed = true;
      updatedItem.internalStatus = validStatus;
    }
    if (!updatedItem.publicStatus) {
      changed = true;
      updatedItem.publicStatus = updatedItem.id === 'req-102' && validStatus === 'Új' ? 'Átnézés alatt' : validStatus;
    }
    if (updatedItem.publicStatusMessage === undefined) {
      changed = true;
      updatedItem.publicStatusMessage = DEFAULT_PUBLIC_STATUS_MESSAGES[updatedItem.publicStatus] || '';
    }

    return updatedItem;
  });

  return { list: normalized, changed };
}

// Client-side rate limit fallback
let clientLookupAttempts: number[] = [];

export const requestService = {
  getAll: (): ProjectRequest[] => {
    initializeStorage();
    const raw = getStorage<ProjectRequest[]>(KEYS.REQUESTS, INITIAL_REQUESTS);
    const { list, changed } = normalizeStoredRequests(raw);
    if (changed) {
      setStorage(KEYS.REQUESTS, list);
    }
    syncRequestsToBackend(list);
    return list;
  },

  getById: (id: string): ProjectRequest | undefined => {
    const all = requestService.getAll();
    return all.find((r) => r.id === id);
  },

  getByRequestId: (requestId: string): ProjectRequest | undefined => {
    if (!requestId) return undefined;
    const clean = requestId.trim().toUpperCase();
    if (!REQUEST_ID_FORMAT.test(clean)) return undefined;
    const all = requestService.getAll();
    return all.find((r) => r.requestId.toUpperCase() === clean);
  },

  lookupPublicStatus: async (
    rawRequestId: string
  ): Promise<{ data?: PublicRequestStatusDTO; error?: string }> => {
    const cleanId = (rawRequestId || '').trim().toUpperCase();

    // Client-side rate limiting check (max 15 lookups per 60 seconds)
    const now = Date.now();
    clientLookupAttempts = clientLookupAttempts.filter((t) => now - t < 60000);
    clientLookupAttempts.push(now);
    if (clientLookupAttempts.length > 15) {
      return {
        error: 'Túl sok lekérdezési próbálkozás történt rövid időn belül. Kérjük, várj egy percet, majd próbáld újra.'
      };
    }

    // Validate strict format (prevents sequential ID enumeration like 1, 2, 3...)
    if (!cleanId || !REQUEST_ID_FORMAT.test(cleanId)) {
      return {
        error: 'Nem találtunk ilyen ajánlatkérést. Ellenőrizd az azonosítót, majd próbáld újra.'
      };
    }

    // Ensure latest local state is synced before querying backend
    const all = requestService.getAll();

    try {
      const response = await fetch('/api/request-status/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: cleanId })
      });

      if (response.status === 429) {
        const errBody = await response.json().catch(() => ({}));
        return {
          error:
            errBody.error ||
            'Túl sok lekérdezési próbálkozás történt. Kérjük, várj egy percet, majd próbáld újra.'
        };
      }

      if (response.ok) {
        const body = await response.json();
        if (body && body.status) {
          return { data: body.status as PublicRequestStatusDTO };
        }
      }
    } catch {
      // Fallback to local projection if server API is unreachable
    }

    const found = all.find((r) => r.requestId.toUpperCase() === cleanId);
    if (!found) {
      return {
        error: 'Nem találtunk ilyen ajánlatkérést. Ellenőrizd az azonosítót, majd próbáld újra.'
      };
    }

    // Strictly return ONLY non-sensitive public fields (PublicRequestStatusDTO)
    const resolvedCategory = found.projectCategory || inferProjectCategory(found.projectType);
    const publicDto: PublicRequestStatusDTO = {
      requestId: found.requestId,
      projectName: found.projectName,
      projectType: found.projectType,
      projectCategory: resolvedCategory,
      gameName: resolvedCategory === 'Játékprojekt' ? found.gameName || found.projectName : undefined,
      gameType: resolvedCategory === 'Játékprojekt' ? found.gameType : undefined,
      platform: resolvedCategory === 'Játékprojekt' ? found.platform : undefined,
      publicStatus: found.publicStatus || found.status || 'Új',
      publicStatusMessage: found.publicStatusMessage || undefined,
      promotionTitle: found.promotionTitle || undefined,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt
    };

    return { data: publicDto };
  },

  create: (
    reqData: Omit<
      ProjectRequest,
      'id' | 'requestId' | 'status' | 'internalStatus' | 'publicStatus' | 'createdAt' | 'updatedAt'
    > & {
      projectCategory?: ProjectCategory;
      requestedFeatures?: string[];
    }
  ): ProjectRequest => {
    const all = requestService.getAll();
    const now = new Date().toISOString();

    let promoTitle = reqData.promotionTitle;
    if (reqData.promotionId && !promoTitle) {
      const p = promotionService.getById(reqData.promotionId);
      if (p) {
        promoTitle = p.title;
      }
    }

    const existingIds = new Set(all.map((r) => r.requestId.toUpperCase()));
    const uniqueRequestId = generateSecureRandomRequestId(existingIds);

    const resolvedCategory =
      reqData.projectCategory || inferProjectCategory(reqData.projectType);
    const featuresList =
      reqData.requestedFeatures || reqData.requiredFeatures || [];

    const newRequest: ProjectRequest = {
      ...reqData,
      projectCategory: resolvedCategory,
      requestedFeatures: featuresList,
      requiredFeatures: featuresList,
      referenceLink: reqData.referenceLink || reqData.referenceUrl,
      referenceUrl: reqData.referenceUrl || reqData.referenceLink,
      promotionTitle: promoTitle,
      id: `req-${Date.now()}`,
      requestId: uniqueRequestId,
      status: 'Új',
      internalStatus: 'Új',
      publicStatus: 'Új',
      publicStatusMessage:
        reqData.publicStatusMessage || DEFAULT_PUBLIC_STATUS_MESSAGES['Új'],
      createdAt: now,
      updatedAt: now
    };

    const updated = [newRequest, ...all];
    setStorage(KEYS.REQUESTS, updated);
    syncRequestsToBackend(updated);

    // Create notification for admin
    const promoSnippet = promoTitle ? ` [Promóció: ${promoTitle}]` : '';
    notificationService.add({
      title: `Új ajánlatkérés (${uniqueRequestId})`,
      message: `${newRequest.name} küldött ajánlatkérést: „${newRequest.projectName}”${promoSnippet}`,
      type: 'info',
      link: '/admin/ajanlatkeresek'
    });

    return newRequest;
  },

  updateStatus: (
    id: string,
    status: RequestStatus,
    syncPublicStatus = true
  ): ProjectRequest | undefined => {
    const all = requestService.getAll();
    const req = all.find((r) => r.id === id);
    if (!req) return undefined;
    req.status = status;
    req.internalStatus = status;
    if (syncPublicStatus) {
      req.publicStatus = status;
      if (
        !req.publicStatusMessage ||
        Object.values(DEFAULT_PUBLIC_STATUS_MESSAGES).includes(req.publicStatusMessage)
      ) {
        req.publicStatusMessage = DEFAULT_PUBLIC_STATUS_MESSAGES[status];
      }
    }
    req.updatedAt = new Date().toISOString();
    setStorage(KEYS.REQUESTS, all);
    syncRequestsToBackend(all);
    return req;
  },

  updateTrackingSettings: (
    id: string,
    settings: {
      internalStatus: RequestStatus;
      publicStatus: RequestStatus;
      publicStatusMessage?: string;
    }
  ): ProjectRequest | undefined => {
    const all = requestService.getAll();
    const req = all.find((r) => r.id === id);
    if (!req) return undefined;
    req.internalStatus = settings.internalStatus;
    req.status = settings.internalStatus;
    req.publicStatus = settings.publicStatus;
    req.publicStatusMessage = settings.publicStatusMessage?.trim() || '';
    req.updatedAt = new Date().toISOString();
    setStorage(KEYS.REQUESTS, all);
    syncRequestsToBackend(all);
    return req;
  },

  updateNotes: (id: string, adminNotes: string): ProjectRequest | undefined => {
    const all = requestService.getAll();
    const req = all.find((r) => r.id === id);
    if (!req) return undefined;
    req.adminNotes = adminNotes;
    req.updatedAt = new Date().toISOString();
    setStorage(KEYS.REQUESTS, all);
    syncRequestsToBackend(all);
    return req;
  },

  saveAiAnalysis: (
    id: string,
    aiAnalysis: NonNullable<ProjectRequest['aiAnalysis']>
  ): ProjectRequest | undefined => {
    const all = requestService.getAll();
    const req = all.find((r) => r.id === id);
    if (!req) return undefined;
    req.aiAnalysis = aiAnalysis;
    req.updatedAt = new Date().toISOString();
    setStorage(KEYS.REQUESTS, all);
    syncRequestsToBackend(all);
    return req;
  },

  addEmailHistory: (
    id: string,
    entry: Omit<EmailHistoryItem, 'id' | 'timestamp'>
  ): ProjectRequest | undefined => {
    const all = requestService.getAll();
    const req = all.find((r) => r.id === id || r.requestId === id);
    if (!req) return undefined;
    const newItem: EmailHistoryItem = {
      ...entry,
      id: `eh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    req.emailHistory = [newItem, ...(req.emailHistory || [])];
    req.updatedAt = new Date().toISOString();
    setStorage(KEYS.REQUESTS, all);
    syncRequestsToBackend(all);
    return req;
  },

  updateEmailHistoryStatus: (
    id: string,
    historyId: string,
    deliveryStatus: EmailHistoryStatus
  ): ProjectRequest | undefined => {
    const all = requestService.getAll();
    const req = all.find((r) => r.id === id || r.requestId === id);
    if (!req || !req.emailHistory) return undefined;
    req.emailHistory = req.emailHistory.map((item) =>
      item.id === historyId ? { ...item, deliveryStatus } : item
    );
    setStorage(KEYS.REQUESTS, all);
    return req;
  },

  delete: (id: string): boolean => {
    const all = requestService.getAll();
    const filtered = all.filter((r) => r.id !== id);
    setStorage(KEYS.REQUESTS, filtered);
    syncRequestsToBackend(filtered);
    return filtered.length < all.length;
  }
};

// ================= SITE SETTINGS =================
export const settingsService = {
  get: (): SiteSettings => {
    initializeStorage();
    const stored = getStorage<SiteSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
    if (
      !stored.heroImageUrl ||
      stored.heroImageUrl === '/src/assets/images/studio_hero_visual_1790358021032.jpg'
    ) {
      stored.heroImageUrl = INITIAL_SETTINGS.heroImageUrl;
      setStorage(KEYS.SETTINGS, stored, false);
    }
    return stored;
  },

  save: (settings: SiteSettings): SiteSettings => {
    setStorage(KEYS.SETTINGS, settings);
    return settings;
  }
};

// ================= NOTIFICATIONS =================
export const notificationService = {
  getAll: (): NotificationItem[] => {
    initializeStorage();
    return getStorage<NotificationItem[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  add: (item: Omit<NotificationItem, 'id' | 'read' | 'timestamp'>): NotificationItem => {
    const all = notificationService.getAll();
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      read: false,
      timestamp: new Date().toISOString()
    };
    const updated = [newItem, ...all];
    setStorage(KEYS.NOTIFICATIONS, updated);
    return newItem;
  },

  markAsRead: (id: string): void => {
    const all = notificationService.getAll();
    const item = all.find((n) => n.id === id);
    if (item) {
      item.read = true;
      setStorage(KEYS.NOTIFICATIONS, all);
    }
  },

  markAllAsRead: (): void => {
    const all = notificationService.getAll().map((n) => ({ ...n, read: true }));
    setStorage(KEYS.NOTIFICATIONS, all);
  }
};

// ================= AUTHENTICATION =================
export const authService = {
  isAuthenticated: (): boolean => {
    try {
      const session = sessionStorage.getItem(KEYS.AUTH) || localStorage.getItem(KEYS.AUTH);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return !!parsed?.id && parsed.role === 'superadmin';
    } catch {
      return false;
    }
  },

  getCurrentUser: (): AdminUser | null => {
    try {
      const session = sessionStorage.getItem(KEYS.AUTH) || localStorage.getItem(KEYS.AUTH);
      if (!session) return null;
      return JSON.parse(session) as AdminUser;
    } catch {
      return null;
    }
  },

  login: (password: string, rememberMe = true): boolean => {
    initializeStorage();
    const savedPassword = localStorage.getItem(KEYS.ADMIN_PASSWORD) || 'admin2026';
    if (password === savedPassword) {
      const user: AdminUser = {
        ...INITIAL_ADMIN_USER,
        lastLogin: new Date().toISOString()
      };
      const serialized = JSON.stringify(user);
      if (rememberMe) {
        localStorage.setItem(KEYS.AUTH, serialized);
      } else {
        sessionStorage.setItem(KEYS.AUTH, serialized);
      }
      window.dispatchEvent(new CustomEvent('admin_auth_changed', { detail: user }));
      return true;
    }
    return false;
  },

  updatePassword: (currentPwd: string, newPwd: string): { success: boolean; message: string } => {
    const savedPassword = localStorage.getItem(KEYS.ADMIN_PASSWORD) || 'admin2026';
    if (currentPwd !== savedPassword) {
      return { success: false, message: 'A jelenlegi jelszó helytelen.' };
    }
    if (newPwd.length < 6) {
      return { success: false, message: 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie.' };
    }
    localStorage.setItem(KEYS.ADMIN_PASSWORD, newPwd);
    return { success: true, message: 'A jelszó sikeresen módosítva!' };
  },

  logout: (): void => {
    sessionStorage.removeItem(KEYS.AUTH);
    localStorage.removeItem(KEYS.AUTH);
    window.dispatchEvent(new CustomEvent('admin_auth_changed', { detail: null }));
  }
};

// ================= AI PROJECT ANALYSIS INTEGRATION =================
export async function analyzeProjectRequestWithAI(req: ProjectRequest): Promise<NonNullable<ProjectRequest['aiAnalysis']>> {
  try {
    const res = await fetch('/api/ai/analyze-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request: req })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.analysis) {
        requestService.saveAiAnalysis(req.id, data.analysis);
        return data.analysis;
      }
    }
  } catch (err) {
    console.warn('Backend AI analysis endpoint unavailable or offline, using intelligent studio analyzer fallback', err);
  }

  // High quality structured heuristic engine fallback
  const techMap: Record<string, string[]> = {
    Weboldal: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'SEO & Analytics'],
    Webalkalmazás: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
    'Asztali alkalmazás': ['Electron', 'TypeScript', 'React', 'SQLite', 'C# / .NET'],
    Mobilalkalmazás: ['React Native', 'TypeScript', 'Expo', 'Firebase / Supabase'],
    'Egyedi szoftver': ['Node.js', 'TypeScript', 'Python', 'PostgreSQL', 'REST / GraphQL'],
    'AI projekt': ['Python', 'Gemini API', 'TypeScript', 'Vector Database', 'FastAPI'],
    Játékprojekt: [
      req.engine && req.engine !== 'Nem tudom' ? req.engine : 'Unity / Godot Engine',
      'C# / GDScript',
      '3D / 2D Fizikai Motor',
      req.platform ? `${req.platform} Build Pipeline` : 'Windows / Multi-platform',
      'Egyedi Játékmechanika & UI'
    ],
    Egyéb: ['TypeScript', 'Full-Stack Architektúra', 'Modern UI/UX']
  };

  const category = req.projectCategory || inferProjectCategory(req.projectType);
  const featureCount = (req.requestedFeatures || req.requiredFeatures)?.length || 1;
  const isHigh =
    featureCount > 4 ||
    req.detailedDescription.length > 300 ||
    category === 'AI projekt' ||
    category === 'Játékprojekt';
  const isLow = featureCount <= 2 && req.projectType === 'Weboldal';

  const complexity: 'Alacsony' | 'Közepes' | 'Magas' = isHigh ? 'Magas' : isLow ? 'Alacsony' : 'Közepes';
  const estimatedWeeks =
    category === 'Játékprojekt'
      ? '6-12 hét (Prototípus / MVP)'
      : isHigh
      ? '6-10 hét'
      : isLow
      ? '2-3 hét'
      : '4-6 hét';

  const summaryText =
    category === 'Játékprojekt'
      ? `A(z) „${req.gameName || req.projectName}” egy saját ötleten alapuló, egyedi fejlesztésű ${
          req.gameType ? req.gameType.toLowerCase() + ' ' : ''
        }játékprojekt (${req.platform || 'Windows'} platformra)${
          req.inspiration ? `, amelyhez a(z) „${req.inspiration}” szolgál hangulati inspirációként` : ''
        }. A játékmenet jól strukturálható mérföldkövekre.`
      : `A(z) „${req.projectName}” egy ${category.toLowerCase()} (${req.projectType.toLowerCase()}) projekt ${
          req.name
        } részéről. A megfogalmazott célok alapján a specifikáció jól ütemezhető, moduláris architektúrát kíván.`;

  const analysis: NonNullable<ProjectRequest['aiAnalysis']> = {
    summary: summaryText,
    estimatedWeeks,
    suggestedTech:
      techMap[category === 'Játékprojekt' ? 'Játékprojekt' : req.projectType] || techMap['Weboldal'],
    complexity,
    recommendedNextSteps:
      category === 'Játékprojekt'
        ? [
            'Egyedi játékmechanika (Game Design Document) és saját koncepció véglegesítése',
            'Játszható alapprototípus (Core Loop) és fizika/irányítás felépítése',
            'Platformspecifikus tesztelés és vizuális elemek iterációja'
          ]
        : [
            'Részletes funkcionalitási jegyzék és wireframe jóváhagyása',
            'Adatmodell és felhasználói jogosultságok pontosítása',
            'Ütemterv és mérföldkövek véglegesítése'
          ]
  };

  requestService.saveAiAnalysis(req.id, analysis);
  return analysis;
}

// ================= EMAIL TEMPLATES & STATUS NOTIFICATIONS SYSTEM =================
export const AVAILABLE_EMAIL_VARIABLES = [
  { token: '{{customerName}}', label: 'Ügyfél neve', example: 'Kovács Péter' },
  { token: '{{projectName}}', label: 'Projekt neve', example: 'SmartLogistics Portál' },
  { token: '{{projectCategory}}', label: 'Projekt kategória', example: '🎮 Játékprojekt' },
  { token: '{{gameName}}', label: 'Játék neve (ha játékprojekt)', example: 'CityLine Transit Simulator' },
  { token: '{{gameType}}', label: 'Játék típusa (ha játékprojekt)', example: 'Szimulátor' },
  { token: '{{platform}}', label: 'Platform (ha játékprojekt)', example: 'Windows' },
  { token: '{{requestId}}', label: 'Ajánlatkérés azonosító', example: 'HL-7K4P-92XM' },
  { token: '{{status}}', label: 'Státusz', example: 'Átnézés alatt' },
  { token: '{{publicStatus}}', label: 'Ügyfél által látható státusz', example: 'Átnézés alatt' },
  { token: '{{publicStatusMessage}}', label: 'Nyilvános státuszüzenet', example: 'Az ajánlatkérésedet jelenleg átnézem.' },
  { token: '{{createdAt}}', label: 'Beküldés dátuma', example: '2026.03.24.' },
  { token: '{{updatedAt}}', label: 'Utolsó frissítés dátuma', example: '2026.03.25.' },
  { token: '{{promotionName}}', label: 'Kapcsolódó promóció', example: 'Ingyenes weboldal készítés' },
  { token: '{{websiteUrl}}', label: 'Weboldal alap URL', example: 'https://horvatstudio.hu' }
];

export interface EmailDynamicContext {
  customerName: string;
  projectName: string;
  projectCategory: string;
  rawCategory: ProjectCategory;
  gameName: string;
  gameType: string;
  platform: string;
  engine: string;
  inspiration: string;
  websiteType: string;
  requestId: string;
  status: RequestStatus;
  publicStatus: RequestStatus;
  publicStatusMessage: string;
  createdAt: string;
  updatedAt: string;
  promotionName: string;
  websiteUrl: string;
  projectType?: string;
  shortDescription?: string;
  requiredFeatures?: string[];
}

export function buildEmailDynamicContext(
  request?: Partial<ProjectRequest> | null,
  overrideStatus?: RequestStatus
): EmailDynamicContext {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://horvatstudio.hu';

  const pubStatus: RequestStatus =
    overrideStatus ||
    (request?.publicStatus as RequestStatus) ||
    (request?.status as RequestStatus) ||
    'Átnézés alatt';

  const statusMsg =
    request?.publicStatusMessage?.trim() ||
    DEFAULT_PUBLIC_STATUS_MESSAGES[pubStatus] ||
    'Az ajánlatkérésed feldolgozása folyamatban van.';

  const rawCategory = inferProjectCategory(request?.projectType, request?.projectCategory);
  const formattedCategory = formatCategoryWithIcon(rawCategory);
  const isGame = rawCategory === 'Játékprojekt';

  return {
    customerName: request?.name?.trim() || 'Érdeklődő Ügyfelünk',
    projectName: request?.projectName?.trim() || (isGame && request?.gameName?.trim()) || 'Egyedi Projekt',
    projectCategory: formattedCategory,
    rawCategory,
    gameName: isGame ? (request?.gameName?.trim() || request?.projectName?.trim() || '') : '',
    gameType: isGame ? (request?.gameType?.trim() || '') : '',
    platform: isGame ? (request?.platform?.trim() || '') : (request?.platform?.trim() || ''),
    engine: isGame ? (request?.engine?.trim() || '') : '',
    inspiration: isGame ? (request?.inspiration?.trim() || '') : '',
    websiteType: request?.websiteType?.trim() || '',
    requestId: request?.requestId?.trim() || 'HL-7K4P-92XM',
    status: pubStatus,
    publicStatus: pubStatus,
    publicStatusMessage: statusMsg,
    createdAt: request?.createdAt ? formatTrackingDate(request.createdAt) : formatTrackingDate(new Date().toISOString()),
    updatedAt: request?.updatedAt ? formatTrackingDate(request.updatedAt) : formatTrackingDate(new Date().toISOString()),
    promotionName: request?.promotionTitle ? request.promotionTitle.replace('🎁', '').replace('🎮', '').trim() : '',
    websiteUrl: origin,
    projectType: request?.projectType || 'Weboldal',
    shortDescription: request?.shortDescription || '',
    requiredFeatures: request?.requestedFeatures || request?.requiredFeatures || []
  };
}

export function interpolateEmailVariables(templateStr: string, ctx: EmailDynamicContext): string {
  if (!templateStr) return '';
  let result = templateStr
    .replace(/\{\{\s*customerName\s*\}\}/g, ctx.customerName || 'Ügyfelünk')
    .replace(/\{\{\s*projectName\s*\}\}/g, ctx.projectName || 'Projekt')
    .replace(/\{\{\s*projectCategory\s*\}\}/g, ctx.projectCategory || '')
    .replace(/\{\{\s*gameName\s*\}\}/g, ctx.gameName || '')
    .replace(/\{\{\s*gameType\s*\}\}/g, ctx.gameType || '')
    .replace(/\{\{\s*platform\s*\}\}/g, ctx.platform || '')
    .replace(/\{\{\s*requestId\s*\}\}/g, ctx.requestId || 'HL-0000-0000')
    .replace(/\{\{\s*status\s*\}\}/g, ctx.publicStatus || ctx.status || 'Új')
    .replace(/\{\{\s*publicStatus\s*\}\}/g, ctx.publicStatus || ctx.status || 'Új')
    .replace(/\{\{\s*publicStatusMessage\s*\}\}/g, ctx.publicStatusMessage || '')
    .replace(/\{\{\s*createdAt\s*\}\}/g, ctx.createdAt || '')
    .replace(/\{\{\s*updatedAt\s*\}\}/g, ctx.updatedAt || '')
    .replace(/\{\{\s*promotionName\s*\}\}/g, ctx.promotionName || '')
    .replace(/\{\{\s*websiteUrl\s*\}\}/g, ctx.websiteUrl || '');

  // Clean up any lines where a label was followed by an empty placeholder (never display empty fields!)
  result = result
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (/^(Játék neve|Játék típusa|Platform|Kapcsolódó promóció)\s*:\s*$/i.test(trimmed)) {
        return false;
      }
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return result;
}

export const emailTemplateService = {
  getAll: (): EmailTemplate[] => {
    initializeStorage();
    return getStorage<EmailTemplate[]>(KEYS.EMAIL_TEMPLATES, INITIAL_EMAIL_TEMPLATES);
  },

  getById: (id: string): EmailTemplate | undefined => {
    const all = emailTemplateService.getAll();
    return all.find((t) => t.id === id);
  },

  getStatusMap: (): StatusTemplateMap => {
    initializeStorage();
    const saved = getStorage<StatusTemplateMap>(KEYS.STATUS_TEMPLATE_MAP, INITIAL_STATUS_TEMPLATE_MAP);
    return { ...INITIAL_STATUS_TEMPLATE_MAP, ...saved };
  },

  saveStatusMap: (map: StatusTemplateMap): StatusTemplateMap => {
    setStorage(KEYS.STATUS_TEMPLATE_MAP, map);
    return map;
  },

  assignTemplateToStatus: (status: RequestStatus, templateId: string): StatusTemplateMap => {
    const current = emailTemplateService.getStatusMap();
    const updated: StatusTemplateMap = {
      ...current,
      [status]: templateId
    };
    setStorage(KEYS.STATUS_TEMPLATE_MAP, updated);

    // Also update isDefault flag on templates for that status
    const all = emailTemplateService.getAll().map((tpl) => {
      if (tpl.targetStatus === status) {
        return { ...tpl, isDefault: tpl.id === templateId };
      }
      return tpl;
    });
    setStorage(KEYS.EMAIL_TEMPLATES, all);
    return updated;
  },

  getTemplateForStatus: (status: RequestStatus): EmailTemplate => {
    const all = emailTemplateService.getAll();
    const map = emailTemplateService.getStatusMap();
    const mappedId = map[status];

    if (mappedId) {
      const mapped = all.find((t) => t.id === mappedId && t.active);
      if (mapped) return mapped;
    }

    const activeForStatus = all.find((t) => t.targetStatus === status && t.active && t.isDefault);
    if (activeForStatus) return activeForStatus;

    const anyForStatus = all.find((t) => t.targetStatus === status);
    if (anyForStatus) return anyForStatus;

    return INITIAL_EMAIL_TEMPLATES[0];
  },

  save: (tplData: Partial<EmailTemplate> & { name: string; targetStatus: RequestStatus }): EmailTemplate => {
    const all = emailTemplateService.getAll();
    const now = new Date().toISOString();
    const existingIdx = tplData.id ? all.findIndex((t) => t.id === tplData.id) : -1;

    let saved: EmailTemplate;
    if (existingIdx >= 0) {
      saved = {
        ...all[existingIdx],
        ...tplData,
        updatedAt: now
      };
      const updated = [...all];
      updated[existingIdx] = saved;
      setStorage(KEYS.EMAIL_TEMPLATES, updated);
    } else {
      saved = {
        id: tplData.id || `tpl-${Date.now()}`,
        name: tplData.name.trim(),
        targetStatus: tplData.targetStatus,
        subject: tplData.subject?.trim() || 'Értesítés az ajánlatkérésedről – {{projectName}} ({{requestId}})',
        preheader: tplData.preheader?.trim() || 'Státuszfrissítés a(z) {{projectName}} projektedhez.',
        introText:
          tplData.introText?.trim() ||
          'Kedves {{customerName}}!\n\nSzeretnélek tájékoztatni a(z) „{{projectName}}” ajánlatkérésed aktuális állapotáról.',
        bodyContent:
          tplData.bodyContent?.trim() ||
          'Az ajánlatkérésed egyedi azonosítója: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz tájékoztató: {{publicStatusMessage}}',
        nextStepsText:
          tplData.nextStepsText?.trim() ||
          'A további részletekkel kapcsolatban válaszolj bátran erre az e-mailre, vagy kövesd a státuszt online.',
        ctaText: tplData.ctaText?.trim() || 'Ajánlatkérés státuszának megtekintése',
        ctaLink: tplData.ctaLink?.trim() || '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
        footerText:
          tplData.footerText?.trim() ||
          'Horvát László – Web & Project Studio • Egyedi weboldalak, webalkalmazások és szoftverprojektek.',
        icon: tplData.icon || getStatusEmoji(tplData.targetStatus),
        accentColor: tplData.accentColor || 'indigo',
        active: tplData.active !== undefined ? tplData.active : true,
        isDefault: !!tplData.isDefault,
        isAiGenerated: !!tplData.isAiGenerated,
        createdAt: now,
        updatedAt: now
      };
      const updated = [saved, ...all];
      setStorage(KEYS.EMAIL_TEMPLATES, updated);
    }

    if (saved.isDefault) {
      emailTemplateService.assignTemplateToStatus(saved.targetStatus, saved.id);
    }

    return saved;
  },

  duplicate: (id: string): EmailTemplate | undefined => {
    const all = emailTemplateService.getAll();
    const source = all.find((t) => t.id === id);
    if (!source) return undefined;
    const now = new Date().toISOString();
    const copy: EmailTemplate = {
      ...source,
      id: `tpl-${Date.now()}`,
      name: `${source.name} (Másolat)`,
      isDefault: false,
      createdAt: now,
      updatedAt: now
    };
    const updated = [copy, ...all];
    setStorage(KEYS.EMAIL_TEMPLATES, updated);
    return copy;
  },

  toggleActive: (id: string): EmailTemplate | undefined => {
    const all = emailTemplateService.getAll();
    const target = all.find((t) => t.id === id);
    if (!target) return undefined;
    target.active = !target.active;
    target.updatedAt = new Date().toISOString();
    setStorage(KEYS.EMAIL_TEMPLATES, all);
    return target;
  },

  setAsDefault: (id: string): EmailTemplate | undefined => {
    const all = emailTemplateService.getAll();
    const target = all.find((t) => t.id === id);
    if (!target) return undefined;
    target.active = true;
    emailTemplateService.assignTemplateToStatus(target.targetStatus, target.id);
    return emailTemplateService.getById(id);
  },

  delete: (id: string): boolean => {
    const all = emailTemplateService.getAll();
    const filtered = all.filter((t) => t.id !== id);
    setStorage(KEYS.EMAIL_TEMPLATES, filtered);
    return filtered.length < all.length;
  }
};

// Dynamic contextual email generator (Section 8: never purely static when request details exist)
export function generateContextualEmailFields(
  template: EmailTemplate,
  ctx: EmailDynamicContext
): {
  subject: string;
  preheader: string;
  introText: string;
  bodyContent: string;
  nextStepsText: string;
  ctaText: string;
  ctaLink: string;
  footerText: string;
} {
  let subject = interpolateEmailVariables(template.subject, ctx);
  let preheader = interpolateEmailVariables(template.preheader || '', ctx);
  let introText = interpolateEmailVariables(template.introText, ctx);
  let bodyContent = interpolateEmailVariables(template.bodyContent, ctx);
  let nextStepsText = interpolateEmailVariables(template.nextStepsText || '', ctx);
  let ctaText = interpolateEmailVariables(template.ctaText, ctx);
  let ctaLink = interpolateEmailVariables(template.ctaLink, ctx);
  let footerText = interpolateEmailVariables(template.footerText, ctx);

  // Dynamically enrich introText and bodyContent with category-specific context (Section 7)
  // while never rendering empty fields or confidential admin data
  if (ctx.publicStatus === 'Új') {
    const categoryConfirmLine =
      ctx.rawCategory === 'Játékprojekt'
        ? 'A játékprojekt ötleted ajánlatkérését megkaptuk.'
        : ctx.rawCategory === 'Weboldal / Webalkalmazás'
        ? 'A weboldal projekted ajánlatkérését megkaptuk.'
        : ctx.rawCategory === 'AI projekt'
        ? 'Az AI projekted ajánlatkérését megkaptuk.'
        : ctx.rawCategory === 'Egyedi szoftver'
        ? 'Az egyedi szoftverprojekted ajánlatkérését megkaptuk.'
        : ctx.rawCategory === 'Mobilalkalmazás'
        ? 'A mobilalkalmazás projekted ajánlatkérését megkaptuk.'
        : 'A projekted ajánlatkérését megkaptuk.';

    if (!introText.includes(categoryConfirmLine) && !bodyContent.includes(categoryConfirmLine)) {
      introText = `${introText}\n\n${categoryConfirmLine}`;
    }
  }

  const enrichmentLines: string[] = [];
  if (ctx.rawCategory === 'Játékprojekt') {
    const gameParts: string[] = [];
    if (ctx.gameName && !bodyContent.includes(ctx.gameName)) {
      gameParts.push(`Játék neve: ${ctx.gameName}`);
    }
    if (ctx.gameType && !bodyContent.includes(ctx.gameType)) {
      gameParts.push(`Játék típusa: ${ctx.gameType}`);
    }
    if (ctx.platform && !bodyContent.includes(ctx.platform)) {
      gameParts.push(`Platform: ${ctx.platform}`);
    }
    if (gameParts.length > 0) {
      enrichmentLines.push(`Játékprojekt paraméterek (${ctx.projectCategory}): ${gameParts.join(' • ')}.`);
    }
    enrichmentLines.push(
      'A megvalósítás során a saját ötletedre és egyedi fejlesztési koncepciódra építünk.'
    );
  } else {
    if (ctx.projectCategory && !bodyContent.includes(ctx.projectCategory)) {
      enrichmentLines.push(
        `A megjelölt projektkategória (${ctx.projectCategory}${
          ctx.websiteType ? ` – ${ctx.websiteType}` : ''
        }) sajátosságait figyelembe véve zajlik a folyamat.`
      );
    }
  }

  if (ctx.promotionName && !bodyContent.includes(ctx.promotionName)) {
    enrichmentLines.push(`Kapcsolódó promóciós ajánlat: ${ctx.promotionName}.`);
  }
  if (enrichmentLines.length > 0 && ctx.publicStatus !== 'Elutasítva' && ctx.publicStatus !== 'Lezárva') {
    bodyContent = `${bodyContent}\n\n${enrichmentLines.join(' ')}`;
  }

  return {
    subject,
    preheader,
    introText,
    bodyContent,
    nextStepsText,
    ctaText,
    ctaLink,
    footerText
  };
}

// Build complete, responsive, Gmail & Outlook compatible HTML email with Horvát László / Web & Project Studio design
export function buildStudioHtmlEmail(params: {
  subject: string;
  preheader?: string;
  introText: string;
  bodyContent: string;
  nextStepsText?: string;
  ctaText: string;
  ctaLink: string;
  footerText: string;
  icon: string;
  accentColor?: EmailTemplate['accentColor'];
  context: EmailDynamicContext;
  aiSummary?: string;
  aiEstimatedWeeks?: string;
  aiComplexity?: string;
  aiSuggestedTech?: string[];
  includeAiBlock?: boolean;
}): string {
  const {
    subject,
    preheader,
    introText,
    bodyContent,
    nextStepsText,
    ctaText,
    ctaLink,
    footerText,
    icon,
    accentColor = 'indigo',
    context,
    aiSummary,
    aiEstimatedWeeks,
    aiComplexity,
    aiSuggestedTech,
    includeAiBlock
  } = params;

  const settings = settingsService.get();

  const paletteMap: Record<
    string,
    { primary: string; secondary: string; badgeBg: string; badgeBorder: string; badgeText: string; gradient: string }
  > = {
    indigo: {
      primary: '#6366f1',
      secondary: '#818cf8',
      badgeBg: '#1e1b4b',
      badgeBorder: '#4338ca',
      badgeText: '#c7d2fe',
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3b0764 100%)'
    },
    cyan: {
      primary: '#06b6d4',
      secondary: '#22d3ee',
      badgeBg: '#083344',
      badgeBorder: '#0e7490',
      badgeText: '#a5f3fc',
      gradient: 'linear-gradient(135deg, #083344 0%, #1e1b4b 55%, #312e81 100%)'
    },
    purple: {
      primary: '#9333ea',
      secondary: '#c084fc',
      badgeBg: '#3b0764',
      badgeBorder: '#7e22ce',
      badgeText: '#e9d5ff',
      gradient: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #1e1b4b 100%)'
    },
    emerald: {
      primary: '#10b981',
      secondary: '#34d399',
      badgeBg: '#064e3b',
      badgeBorder: '#047857',
      badgeText: '#a7f3d0',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #1e1b4b 60%, #312e81 100%)'
    },
    amber: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      badgeBg: '#451a03',
      badgeBorder: '#b45309',
      badgeText: '#fde68a',
      gradient: 'linear-gradient(135deg, #451a03 0%, #1e1b4b 60%, #312e81 100%)'
    },
    rose: {
      primary: '#f43f5e',
      secondary: '#fb7185',
      badgeBg: '#4c0519',
      badgeBorder: '#be123c',
      badgeText: '#fecdd3',
      gradient: 'linear-gradient(135deg, #4c0519 0%, #1e1b4b 65%, #0f172a 100%)'
    },
    slate: {
      primary: '#64748b',
      secondary: '#94a3b8',
      badgeBg: '#1e293b',
      badgeBorder: '#475569',
      badgeText: '#e2e8f0',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1e1b4b 100%)'
    }
  };

  const theme = paletteMap[accentColor] || paletteMap.indigo;

  const escapeHtml = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const formatParagraphs = (text: string) =>
    escapeHtml(text)
      .split(/\n\n+/)
      .map(
        (p) =>
          `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#e2e8f0;">${p.replace(
            /\n/g,
            '<br />'
          )}</p>`
      )
      .join('');

  const aiHtmlSection =
    includeAiBlock && aiSummary
      ? `
              <!-- AI Project Evaluation Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;background-color:#131826;border:1px solid #2e364f;border-radius:14px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#38bdf8;margin-bottom:8px;">
                      ✨ Szakmai Projektértékelés &amp; Technológiai Javaslat
                    </div>
                    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.65;color:#cbd5e1;">
                      ${escapeHtml(aiSummary)}
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
                      <tr>
                        <td width="50%" style="padding:10px 12px;background-color:#0b0f19;border:1px solid #1e293b;border-radius:10px;">
                          <div style="font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:600;">⏱️ Becsült időtartam</div>
                          <div style="font-size:15px;font-weight:800;color:#818cf8;margin-top:3px;">${escapeHtml(
                            aiEstimatedWeeks || '4-6 hét'
                          )}</div>
                        </td>
                        <td width="10">&nbsp;</td>
                        <td width="50%" style="padding:10px 12px;background-color:#0b0f19;border:1px solid #1e293b;border-radius:10px;">
                          <div style="font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:600;">📊 Projekt komplexitás</div>
                          <div style="font-size:15px;font-weight:800;color:#22d3ee;margin-top:3px;">${escapeHtml(
                            aiComplexity || 'Közepes'
                          )}</div>
                        </td>
                      </tr>
                    </table>
                    ${
                      aiSuggestedTech && aiSuggestedTech.length > 0
                        ? `<div style="margin-top:8px;">
                            <span style="font-size:11px;color:#94a3b8;font-weight:600;display:block;margin-bottom:6px;">Javasolt technológiák:</span>
                            ${aiSuggestedTech
                              .map(
                                (t) =>
                                  `<span style="display:inline-block;background-color:#1e1b4b;color:#a5b4fc;border:1px solid #3730a3;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;margin:0 6px 6px 0;">${escapeHtml(
                                    t
                                  )}</span>`
                              )
                              .join('')}
                          </div>`
                        : ''
                    }
                  </td>
                </tr>
              </table>`
      : '';

  const promoHtmlSection = context.promotionName
    ? `
              <!-- Promotion Badge Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;background-color:#1e1b4b;border-left:4px solid #6366f1;border-radius:10px;">
                <tr>
                  <td style="padding:12px 16px;font-size:13px;color:#e0e7ff;">
                    🎁 <strong>Kapcsolódó promóció:</strong> ${escapeHtml(context.promotionName)}
                  </td>
                </tr>
              </table>`
    : '';

  const nextStepsHtmlSection =
    nextStepsText && nextStepsText.trim()
      ? `
              <!-- Next Steps Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;background-color:#0f1420;border:1px solid #1e293b;border-radius:14px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#38bdf8;margin-bottom:10px;">
                      🚀 Következő lépések &amp; tudnivalók
                    </div>
                    <div style="font-size:14px;line-height:1.7;color:#cbd5e1;">
                      ${escapeHtml(nextStepsText).replace(/\n/g, '<br />')}
                    </div>
                  </td>
                </tr>
              </table>`
      : '';

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#07090e;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#e2e8f0;">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(
          preheader
        )}</div>`
      : ''
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090e;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background-color:#0d111a;border:1px solid #1e293b;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.6);">
          
          <!-- STUDIO HEADER -->
          <tr>
            <td style="background:${theme.gradient};padding:32px 32px 28px 32px;border-bottom:1px solid #2e364f;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:18px;font-weight:800;letter-spacing:0.4px;color:#ffffff;">
                      Horvát László
                    </div>
                    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.8px;color:#38bdf8;margin-top:2px;">
                      Web &amp; Project Studio
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;background-color:${theme.badgeBg};border:1px solid ${theme.badgeBorder};color:${theme.badgeText};padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;">
                      ${escapeHtml(icon)} ${escapeHtml(context.publicStatus)}
                    </span>
                  </td>
                </tr>
              </table>

              <div style="margin-top:22px;">
                <div style="font-size:22px;font-weight:800;line-height:1.3;color:#ffffff;">
                  ${escapeHtml(subject)}
                </div>
                <div style="font-size:13px;color:#c7d2fe;margin-top:6px;">
                  Ajánlatkérés azonosító: <strong style="font-family:monospace;color:#ffffff;">${escapeHtml(
                    context.requestId
                  )}</strong>
                </div>
              </div>
            </td>
          </tr>

          <!-- EMAIL BODY -->
          <tr>
            <td style="padding:30px 32px;">
              <!-- Intro -->
              ${formatParagraphs(introText)}

              ${promoHtmlSection}

              <!-- Structured Status & Project Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 24px 0;background-color:#131826;border:1px solid #262f45;border-radius:14px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#818cf8;margin-bottom:12px;">
                      📋 Ajánlatkérés &amp; Aktuális Státusz Adatok
                    </div>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13.5px;color:#cbd5e1;">
                      <tr>
                        <td style="padding:6px 0;color:#94a3b8;width:42%;">Ügyfél:</td>
                        <td style="padding:6px 0;font-weight:700;color:#ffffff;">${escapeHtml(
                          context.customerName
                        )}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#94a3b8;">Projekt kategória:</td>
                        <td style="padding:6px 0;font-weight:700;color:#c7d2fe;">${escapeHtml(
                          context.projectCategory
                        )}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#94a3b8;">Projekt:</td>
                        <td style="padding:6px 0;font-weight:700;color:#ffffff;">${escapeHtml(
                          context.projectName
                        )}</td>
                      </tr>
                      ${
                        context.rawCategory === 'Játékprojekt' && context.gameName
                          ? `<tr>
                              <td style="padding:6px 0;color:#94a3b8;">Játék neve:</td>
                              <td style="padding:6px 0;font-weight:700;color:#38bdf8;">${escapeHtml(
                                context.gameName
                              )}</td>
                            </tr>`
                          : ''
                      }
                      ${
                        context.rawCategory === 'Játékprojekt' && context.gameType
                          ? `<tr>
                              <td style="padding:6px 0;color:#94a3b8;">Játék típusa:</td>
                              <td style="padding:6px 0;color:#e2e8f0;">${escapeHtml(
                                context.gameType
                              )}</td>
                            </tr>`
                          : ''
                      }
                      ${
                        context.rawCategory === 'Játékprojekt' && context.platform
                          ? `<tr>
                              <td style="padding:6px 0;color:#94a3b8;">Platform:</td>
                              <td style="padding:6px 0;color:#e2e8f0;">${escapeHtml(
                                context.platform
                              )}</td>
                            </tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding:6px 0;color:#94a3b8;">Ajánlatkérés azonosító:</td>
                        <td style="padding:6px 0;font-family:monospace;font-weight:800;color:#38bdf8;">${escapeHtml(
                          context.requestId
                        )}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#94a3b8;">Aktuális státusz:</td>
                        <td style="padding:6px 0;font-weight:700;color:${theme.secondary};">${escapeHtml(
                          icon
                        )} ${escapeHtml(context.publicStatus)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#94a3b8;">Frissítve:</td>
                        <td style="padding:6px 0;color:#e2e8f0;">${escapeHtml(context.updatedAt)}</td>
                      </tr>
                    </table>

                    ${
                      context.publicStatusMessage
                        ? `<div style="margin-top:14px;padding:12px 14px;background-color:#0b0f19;border-left:3px solid ${theme.primary};border-radius:8px;font-size:13px;line-height:1.6;color:#e2e8f0;">
                            <strong style="color:#94a3b8;display:block;font-size:11px;text-transform:uppercase;margin-bottom:4px;">Státusz üzenet:</strong>
                            „${escapeHtml(context.publicStatusMessage)}”
                          </div>`
                        : ''
                    }
                  </td>
                </tr>
              </table>

              <!-- Main Body Content -->
              ${formatParagraphs(bodyContent)}

              ${aiHtmlSection}

              ${nextStepsHtmlSection}

              <!-- CTA Button -->
              ${
                ctaText
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 18px 0;">
                      <tr>
                        <td align="center">
                          <a href="${escapeHtml(
                            ctaLink || `${context.websiteUrl}/ajanlat-statusz?id=${context.requestId}`
                          )}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0891b2 100%);background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;letter-spacing:0.4px;box-shadow:0 8px 20px rgba(79,70,229,0.35);">
                            🔎 ${escapeHtml(ctaText)} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }
            </td>
          </tr>

          <!-- STUDIO FOOTER -->
          <tr>
            <td style="background-color:#090c12;border-top:1px solid #1e293b;padding:24px 32px;font-size:12px;color:#94a3b8;">
              <div style="font-weight:700;color:#ffffff;font-size:14px;margin-bottom:4px;">
                Horvát László – Web &amp; Project Studio
              </div>
              <div style="line-height:1.6;margin-bottom:12px;color:#94a3b8;">
                ${escapeHtml(footerText)}
              </div>
              <div style="border-top:1px solid #1e293b;padding-top:12px;font-size:11.5px;color:#64748b;">
                📧 <a href="mailto:${escapeHtml(
                  settings.email
                )}" style="color:#818cf8;text-decoration:none;">${escapeHtml(settings.email)}</a>
                ${settings.phone ? ` &nbsp;·&nbsp; 📞 ${escapeHtml(settings.phone)}` : ''}
                &nbsp;·&nbsp; 🌐 <a href="${escapeHtml(
                  context.websiteUrl
                )}" style="color:#38bdf8;text-decoration:none;">${escapeHtml(context.websiteUrl)}</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildPlainTextEmail(params: {
  subject: string;
  introText: string;
  bodyContent: string;
  nextStepsText?: string;
  ctaText: string;
  ctaLink: string;
  footerText: string;
  icon: string;
  context: EmailDynamicContext;
  aiSummary?: string;
  aiEstimatedWeeks?: string;
  aiComplexity?: string;
  aiSuggestedTech?: string[];
  includeAiBlock?: boolean;
}): string {
  const {
    introText,
    bodyContent,
    nextStepsText,
    ctaText,
    ctaLink,
    footerText,
    icon,
    context,
    aiSummary,
    aiEstimatedWeeks,
    aiComplexity,
    aiSuggestedTech,
    includeAiBlock
  } = params;
  const settings = settingsService.get();

  const lines: string[] = [];
  lines.push('HORVÁT LÁSZLÓ – WEB & PROJECT STUDIO');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(introText);
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('AJÁNLATKÉRÉS ÉS STÁTUSZ ADATOK');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`• Ügyfél: ${context.customerName}`);
  lines.push(`• Projekt kategória: ${context.projectCategory}`);
  lines.push(`• Projekt: ${context.projectName}`);
  if (context.rawCategory === 'Játékprojekt') {
    if (context.gameName) lines.push(`• Játék neve: ${context.gameName}`);
    if (context.gameType) lines.push(`• Játék típusa: ${context.gameType}`);
    if (context.platform) lines.push(`• Platform: ${context.platform}`);
  }
  lines.push(`• Ajánlatkérés azonosító: ${context.requestId}`);
  lines.push(`• Aktuális státusz: ${icon} ${context.publicStatus}`);
  if (context.publicStatusMessage) {
    lines.push(`• Státusz üzenet: ${context.publicStatusMessage}`);
  }
  if (context.promotionName) {
    lines.push(`• Kapcsolódó promóció: ${context.promotionName}`);
  }
  lines.push(`• Utolsó frissítés: ${context.updatedAt}`);
  lines.push('');
  lines.push(bodyContent);
  lines.push('');

  if (includeAiBlock && aiSummary) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('SZAKMAI ÉRTÉKELÉS ÉS TECHNOLÓGIAI JAVASLAT');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(aiSummary);
    if (aiEstimatedWeeks) lines.push(`• Becsült időtartam: ${aiEstimatedWeeks}`);
    if (aiComplexity) lines.push(`• Projekt komplexitás: ${aiComplexity}`);
    if (aiSuggestedTech && aiSuggestedTech.length > 0) {
      lines.push(`• Javasolt technológiák: ${aiSuggestedTech.join(', ')}`);
    }
    lines.push('');
  }

  if (nextStepsText && nextStepsText.trim()) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('KÖVETKEZŐ LÉPÉSEK');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(nextStepsText);
    lines.push('');
  }

  if (ctaText) {
    lines.push(`🔎 ${ctaText}: ${ctaLink || `${context.websiteUrl}/ajanlat-statusz?id=${context.requestId}`}`);
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('Üdvözlettel,');
  lines.push(settings.ownerName || 'Horvát László');
  lines.push('Horvát László – Web & Project Studio');
  lines.push(footerText);
  lines.push(`E-mail: ${settings.email}${settings.phone ? ` | Telefon: ${settings.phone}` : ''}`);

  return lines.join('\n');
}

export async function generateAiEmailTemplateWithStudioAI(
  prompt: string,
  targetStatus: RequestStatus
): Promise<Omit<EmailTemplate, 'id' | 'active' | 'isDefault' | 'createdAt' | 'updatedAt'>> {
  try {
    const res = await fetch('/api/ai/generate-email-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, targetStatus })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.template) {
        return {
          ...data.template,
          targetStatus,
          isAiGenerated: true
        };
      }
    }
  } catch (err) {
    console.warn('AI template generation backend unavailable, using intelligent studio generator fallback', err);
  }

  // Intelligent Hungarian Studio Fallback based on prompt & targetStatus
  const baseTpl = emailTemplateService.getTemplateForStatus(targetStatus);
  const cleanPrompt = prompt.trim();

  return {
    name: `AI Sablon – ${targetStatus} (${cleanPrompt.slice(0, 28)}${cleanPrompt.length > 28 ? '...' : ''})`,
    targetStatus,
    subject: `${baseTpl.icon} Státuszfrissítés és tájékoztatás: {{projectName}} ({{requestId}})`,
    preheader: `Fontos tájékoztatás a(z) {{projectName}} ajánlatkérésed (${targetStatus}) állapotáról.`,
    introText: `Kedves {{customerName}}!\n\nKöszönöm a bizalmadat! A(z) „{{projectName}}” projekteddel kapcsolatban az alábbi aktuális tájékoztatást küldöm (${cleanPrompt}):`,
    bodyContent: `${baseTpl.bodyContent}\n\nKülön figyelemmel kísérem a megadott igényeket, hogy a(z) „{{projectName}}” minden szempontból prémium minőségben valósuljon meg.`,
    nextStepsText: baseTpl.nextStepsText || '1. Áttekintés és visszajelzés\n2. Következő mérföldkő egyeztetése',
    ctaText: baseTpl.ctaText || 'Ajánlatkérés státuszának megtekintése',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Egyedi weboldalak, webalkalmazások és szoftverprojektek.',
    icon: getStatusEmoji(targetStatus),
    accentColor: baseTpl.accentColor || 'indigo',
    isAiGenerated: true
  };
}

export async function personalizeStatusEmailWithAI(
  req: ProjectRequest,
  status: RequestStatus,
  customInstruction?: string
): Promise<{
  subject: string;
  preheader: string;
  introText: string;
  bodyContent: string;
  nextStepsText: string;
  ctaText: string;
}> {
  const ctx = buildEmailDynamicContext(req, status);

  try {
    const res = await fetch('/api/ai/personalize-status-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestData: ctx,
        status,
        customInstruction
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.emailContent) {
        return data.emailContent;
      }
    }
  } catch (err) {
    console.warn('Backend personalize-status-email unavailable, using contextual template engine', err);
  }

  const tpl = emailTemplateService.getTemplateForStatus(status);
  const generated = generateContextualEmailFields(tpl, ctx);
  return {
    subject: generated.subject,
    preheader: generated.preheader,
    introText: generated.introText,
    bodyContent: generated.bodyContent,
    nextStepsText: generated.nextStepsText,
    ctaText: generated.ctaText
  };
}
