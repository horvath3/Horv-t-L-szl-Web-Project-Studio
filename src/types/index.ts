export type ProjectStatus =
  | 'Tervezés alatt'
  | 'Fejlesztés alatt'
  | 'Tesztelés'
  | 'Elkészült'
  | 'Karbantartás'
  | 'Archivált';

export type RequestStatus =
  | 'Új'
  | 'Átnézés alatt'
  | 'Kapcsolatfelvétel'
  | 'Ajánlat egyeztetése'
  | 'Elfogadva'
  | 'Folyamatban'
  | 'Tesztelés'
  | 'Elkészült'
  | 'Lezárva'
  | 'Elutasítva';

export type PromotionStatus = 'Tervezett' | 'Aktív' | 'Lejárt' | 'Archivált';

export type ProjectCategory =
  | 'Weboldal'
  | 'Webalkalmazás'
  | 'Weboldal / Webalkalmazás'
  | 'Játékprojekt'
  | 'Mobilalkalmazás'
  | 'Egyedi szoftver'
  | 'AI projekt'
  | 'Egyéb projekt';

export type WebsiteSubtype =
  | 'bemutatkozó oldal'
  | 'céges oldal'
  | 'webshop'
  | 'portfólió'
  | 'egyéb';

export type GameTypeOption =
  | 'Szimulátor'
  | 'Kalandjáték'
  | 'Stratégia'
  | 'Puzzle'
  | 'Verseny'
  | 'Egyéb';

export type GamePlatformOption = 'Windows' | 'Android' | 'iOS' | 'Web';

export type GameEngineOption = 'Unity' | 'Unreal Engine' | 'Godot' | 'Nem tudom';

export interface ProjectFileAttachment {
  name: string;
  size?: number;
  type?: string;
  dataUrl?: string;
}

export interface Promotion {
  id: string;
  title: string;
  shortTitle: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  image?: string;
  ctaText: string;
  projectCategory?: ProjectCategory; // Kapcsolódó projekt kategória (pl. Játékprojekt, Weboldal / Webalkalmazás)
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  active: boolean; // manual enable/disable toggle
  showBanner: boolean; // display in top banner
  allowRequests: boolean; // allow submitting quotation requests
  features: string[]; // "Mit tartalmaz?" list
  additionalInfo?: string; // Additional terms & info
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectType =
  | 'Weboldal'
  | 'Webalkalmazás'
  | 'Asztali alkalmazás'
  | 'Mobilalkalmazás'
  | 'Egyedi szoftver'
  | 'AI projekt'
  | 'Játékprojekt'
  | 'Egyéb';

export interface ProjectTechnology {
  name: string;
  category?: 'frontend' | 'backend' | 'database' | 'desktop' | 'ai' | 'game' | 'tool';
}

export interface ProjectImage {
  id: string;
  url: string;
  caption?: string;
  isCover?: boolean;
}

export interface DownloadStepItem {
  id: string;
  label: string;
  subtext?: string;
  doneBadgeText?: string;
  durationMs: number;
}

export type DownloadAccentTheme = 'indigo' | 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose';
export type DownloadSpinnerStyle = 'ring' | 'dual-ring' | 'orbit' | 'dots';
export type DownloadCheckmarkStyle = 'draw' | 'pop' | 'shield';
export type DownloadProgressBarStyle = 'gradient' | 'striped' | 'segmented';
export type DownloadDisplayMode = 'modal' | 'inline-and-modal';

export interface DownloadFlowConfig {
  enabled: boolean;
  useCustomConfig?: boolean;
  displayMode: DownloadDisplayMode;
  timingMode: 'total' | 'per-step';
  totalDurationSeconds: number;
  accentTheme: DownloadAccentTheme;
  spinnerStyle: DownloadSpinnerStyle;
  checkmarkStyle: DownloadCheckmarkStyle;
  progressBarStyle: DownloadProgressBarStyle;
  showPercentage: boolean;
  showElapsedTimer: boolean;
  showStepNumbers: boolean;
  showSubtexts: boolean;
  showFileInfoCard: boolean;
  autoStartDownload: boolean;
  autoCloseAfterSeconds: number;
  buttonText: string;
  downloadingButtonText: string;
  completedButtonText: string;
  modalTitle: string;
  modalSubtitle: string;
  completionTitle: string;
  completionSubtitle: string;
  manualDownloadButtonText: string;
  closeButtonText: string;
  steps: DownloadStepItem[];
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  status: ProjectStatus;
  isPublic: boolean;
  category: 'web' | 'app' | 'software' | 'ai' | 'game' | 'mobile' | 'other';
  featured: boolean;
  version: string;
  imageUrl: string;
  gallery: string[];
  technologies: string[];
  features: string[];
  downloadId?: string;
  downloadUrl?: string;
  downloadFileName?: string;
  downloadFileSize?: string;
  downloadPlatform?: 'Windows' | 'macOS' | 'Linux' | 'Cross-platform' | 'Web';
  flowConfig?: DownloadFlowConfig;
  githubUrl?: string;
  liveUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Download {
  id: string;
  projectId?: string;
  projectSlug?: string;
  projectTitle: string;
  fileName: string;
  fileUrl: string;
  version: string;
  platform: 'Windows' | 'macOS' | 'Linux' | 'Cross-platform' | 'Web';
  fileSize: string;
  releaseDate: string;
  isActive: boolean;
  downloadCount: number;
  changelog?: string;
  flowConfig?: DownloadFlowConfig;
}

export interface ProjectRequest {
  id: string;
  requestId: string; // Egyedi biztonságos azonosító, pl. HL-7K4P-92XM
  name: string;
  email: string;
  projectName: string;
  projectType: ProjectType;
  projectCategory: ProjectCategory; // 🌐 Weboldal / Webalkalmazás | 💻 Egyedi szoftver | 🤖 AI projekt | 🎮 Játékprojekt | 📱 Mobilalkalmazás | 🧩 Egyéb projekt
  websiteType?: WebsiteSubtype | string; // Weboldal típusa (bemutatkozó oldal, céges oldal, webshop, portfólió, egyéb)
  gameName?: string; // Játék neve (Játékprojekt esetén)
  gameType?: GameTypeOption | string; // Játék típusa (Szimulátor, Kalandjáték, Stratégia, Puzzle, Verseny, Egyéb)
  platform?: string; // Platform (Windows, Android, iOS, Web)
  engine?: GameEngineOption | string; // Motor / technológia (Unity, Unreal Engine, Godot, Nem tudom)
  referenceLink?: string; // Steam link / referencia link
  inspiration?: string; // Inspiráció vagy referencia játék (pl. „Bus Simulator 27” - egyedi fejlesztéshez inspiráció)
  requestedFeatures: string[]; // Kért funkciók listája
  requiredFeatures: string[]; // Kompatibilitás a 1.0 mezővel (szinkronban a requestedFeatures-szel)
  projectFiles?: ProjectFileAttachment[]; // Feltöltött képek vagy dokumentumok
  shortDescription: string;
  detailedDescription: string;
  referenceUrl?: string;
  deadline?: string;
  budget?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  notes?: string; // Megjegyzés a megrendelőtől
  promotionId?: string | null; // Aktív promóció azonosítója
  promotionTitle?: string; // Kapcsolódó promóció neve
  status: RequestStatus; // Szinkronban az internalStatus-szal
  internalStatus: RequestStatus; // Belső admin státusz
  publicStatus: RequestStatus; // Ügyfél által látható státusz
  publicStatusMessage?: string; // Rövid, ügyfélnek látható státuszmagyarázat
  adminNotes?: string; // Belső admin megjegyzések (SOHA nem publikus)
  aiAnalysis?: {
    summary: string;
    estimatedWeeks: string;
    suggestedTech: string[];
    complexity: 'Alacsony' | 'Közepes' | 'Magas';
    recommendedNextSteps: string[];
  };
  emailHistory?: EmailHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export type EmailHistoryStatus = 'Előkészítve' | 'Elküldve' | 'Sikertelen';

export type EmailProviderType = 'manual-copy' | 'smtp' | 'gmail' | 'outlook' | 'resend';

export type GmailConnectionState = 'disconnected' | 'connected' | 'error';

export interface GmailStatusInfo {
  state: GmailConnectionState;
  email: string | null;
  errorMessage?: string;
  scopeGranted?: boolean;
  lastCheckedAt?: string;
}

export interface EmailHistoryItem {
  id: string;
  requestId: string;
  templateId?: string;
  templateName: string;
  emailType: string;
  statusAtSend: RequestStatus;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  deliveryStatus: EmailHistoryStatus;
  provider?: EmailProviderType;
  sendMode?: 'manual' | 'auto' | 'manual-copy';
  errorMessage?: string;
  timestamp: string;
}

export interface EmailTemplate {
  id: string;
  name: string; // Sablon neve, pl. "Ajánlatkérés beérkezett"
  targetStatus: RequestStatus; // Státusz, amelyhez tartozik
  subject: string; // E-mail tárgya (dinamikus változókkal, pl. "Megkaptuk az ajánlatkérésed – {{projectName}}")
  preheader?: string; // Rövid előnézeti szöveg
  introText: string; // Bevezető szöveg
  bodyContent: string; // Fő tartalom
  nextStepsText?: string; // Következő lépésekre vonatkozó információ
  ctaText: string; // CTA gomb szövege
  ctaLink: string; // CTA link (pl. "{{websiteUrl}}/ajanlat-statusz?id={{requestId}}")
  footerText: string; // Footer szöveg
  icon: string; // Státuszhoz illő ikon
  accentColor?: 'indigo' | 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate';
  active: boolean; // Aktív / inaktív állapot
  isDefault: boolean; // Alapértelmezett sablon az adott státuszhoz
  isAiGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StatusTemplateMap = Record<RequestStatus, string>; // status -> templateId

export interface PublicRequestStatusDTO {
  requestId: string;
  projectName: string;
  projectType: ProjectType;
  projectCategory: ProjectCategory;
  gameName?: string;
  gameType?: string;
  platform?: string;
  publicStatus: RequestStatus;
  publicStatusMessage?: string;
  promotionTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  ownerName: string;
  ownerTitle: string;
  studioName: string;
  bio: string;
  email: string;
  phone?: string;
  location: string;
  heroHeading: string;
  heroSubheading: string;
  avatarUrl: string;
  heroImageUrl: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    discord?: string;
    twitter?: string;
  };
  seoTitle: string;
  seoDescription: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin';
  lastLogin?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  timestamp: string;
  link?: string;
}

export type CapacityMode = 'normal' | 'limited' | 'paused';

export type PauseReasonType = 'travel' | 'busy' | 'development' | 'other';

export type CapacityBannerPlacement = 'top' | 'request-page' | 'both';

export type CapacityBannerTheme = 'amber' | 'indigo' | 'rose' | 'purple' | 'emerald' | 'cyan';

export type UserLimitPreset = 7 | 14 | 30 | 'custom';

export interface CategoryCapacityRule {
  category: ProjectCategory;
  limitDays: number;
  paused: boolean;
  pauseReason?: string;
  customNote?: string;
  slotLimitEnabled?: boolean;
  availableSlots?: number;
  totalSlots?: number;
}

export interface CapacityExceptionUser {
  id: string;
  email: string;
  name?: string;
  bypassLimit: boolean;
  bypassPause: boolean;
  note?: string;
  createdAt: string;
}

export interface CapacityWaitlistItem {
  id: string;
  name: string;
  email: string;
  projectCategory: ProjectCategory;
  projectIdea?: string;
  modeAtSignup: CapacityMode;
  notified: boolean;
  notifiedAt?: string;
  createdAt: string;
}

export interface CapacityBlockedAttempt {
  id: string;
  email: string;
  visitorId?: string;
  projectCategory: ProjectCategory;
  reason: 'user-limit' | 'category-limit' | 'paused-mode' | 'category-paused';
  lastRequestId?: string;
  lastRequestDate?: string;
  nextAllowedDate?: string;
  timestamp: string;
}

export interface ProjectCapacityConfig {
  mode: CapacityMode;
  // Korlátozott mód banner beállítások
  bannerEnabled: boolean;
  bannerIcon: string;
  bannerTitle: string;
  bannerText: string;
  bannerPlacement: CapacityBannerPlacement;
  bannerTheme: CapacityBannerTheme;
  estimatedResponseTimeText: string;
  // Felhasználói projektlimit
  userLimitEnabled: boolean;
  applyLimitInNormalMode: boolean;
  blockIfActiveRequestInProgress: boolean;
  limitPreset: UserLimitPreset;
  customLimitDays: number;
  maxRequestsPerPeriod: number;
  limitBlockedTitle: string;
  limitBlockedSubtitle: string;
  limitBlockedDescription: string;
  // Kategória alapú limit
  useCategorySpecificLimits: boolean;
  categoryRules: Record<ProjectCategory, CategoryCapacityRule>;
  // Szüneteltetett mód
  pauseReason: PauseReasonType;
  pauseCustomReasonText: string;
  pausedIcon: string;
  pausedTitle: string;
  pausedSubtitle: string;
  pausedDescription: string;
  allowWaitlistSignup: boolean;
  autoNotifyWaitlistOnReopen?: boolean;
  allowPromoOverrideInLimited: boolean;
  // Időzített szünet / korlátozás
  scheduleEnabled: boolean;
  scheduleTargetMode: 'paused' | 'limited';
  scheduleStartDate: string;
  scheduleStartTime: string;
  scheduleEndDate: string;
  scheduleEndTime: string;
  autoRevertToNormal: boolean;
  // Utazási mód gyorskapcsoló
  travelModeActive: boolean;
  travelStartDate: string;
  travelReturnDate: string;
  travelBehavior: 'pause' | 'limited';
  travelCustomNote: string;
  // Automatikus terhelésvédelem
  autoLimitedThresholdEnabled: boolean;
  autoLimitedActiveRequestsThreshold: number;
  updatedAt: string;
}

