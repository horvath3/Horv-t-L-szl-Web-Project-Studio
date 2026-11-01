import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ProjectRequest,
  RequestStatus,
  GmailStatusInfo,
  EmailTemplate
} from '../types';
import {
  authService,
  emailTemplateService,
  buildEmailDynamicContext,
  generateContextualEmailFields,
  buildStudioHtmlEmail,
  buildPlainTextEmail,
  requestService,
  settingsService,
  getStatusEmoji
} from './storage';

// Minimum required Gmail scope for sending status notification emails
export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send'
];

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent select_account'
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory (NEVER in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;
let cachedGmailStatus: GmailStatusInfo = {
  state: 'disconnected',
  email: null,
  scopeGranted: false
};

const GLOBAL_AUTO_EMAIL_KEY = 'hl_studio_global_auto_status_email_enabled';

function notifyGmailStateChanged(info: GmailStatusInfo): void {
  cachedGmailStatus = info;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gmail_status_changed', { detail: info }));
  }
}

function getAdminHeaders(token?: string | null): Record<string, string> {
  const isAdmin = authService.isAuthenticated();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Admin-Auth': isAdmin ? 'superadmin' : 'none'
  };
  const effectiveToken = token || cachedAccessToken;
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }
  return headers;
}

// Initialize auth state listener. Clears in-memory token on sign-out.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Trigger OAuth 2.0 popup to connect Gmail account
export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
  statusInfo: GmailStatusInfo;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Nem sikerült OAuth hozzáférési tokent kérni a Google-tól.');
    }

    cachedAccessToken = credential.accessToken;
    const userEmail = result.user.email || null;

    // Register & validate token with the secure server vault
    const res = await fetch('/api/gmail/connect', {
      method: 'POST',
      headers: getAdminHeaders(cachedAccessToken),
      body: JSON.stringify({ email: userEmail })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.state === 'error') {
      const errStatus: GmailStatusInfo = {
        state: 'error',
        email: data.email || userEmail,
        scopeGranted: false,
        errorMessage:
          data.errorMessage ||
          'A Gmail küldési jogosultság (gmail.send) nem lett engedélyezve. Kérjük, csatlakoztasd újra és fogadd el az engedélyt!',
        lastCheckedAt: new Date().toISOString()
      };
      notifyGmailStateChanged(errStatus);
      return { user: result.user, accessToken: cachedAccessToken, statusInfo: errStatus };
    }

    const connectedStatus: GmailStatusInfo = {
      state: 'connected',
      email: data.email || userEmail,
      scopeGranted: true,
      lastCheckedAt: data.lastCheckedAt || new Date().toISOString()
    };
    notifyGmailStateChanged(connectedStatus);

    return {
      user: result.user,
      accessToken: cachedAccessToken,
      statusInfo: connectedStatus
    };
  } catch (error: any) {
    let readableError = 'A Gmail bejelentkezés megszakadt vagy sikertelen volt.';
    if (error?.code === 'auth/popup-closed-by-user') {
      readableError = 'A Google bejelentkező ablakot bezártad a csatlakozás befejezése előtt.';
    } else if (error?.code === 'auth/popup-blocked') {
      readableError = 'A böngésző blokkolta a felugró ablakot. Kérjük, engedélyezd a felugró ablakokat!';
    } else if (error?.message) {
      readableError = error.message;
    }

    const errStatus: GmailStatusInfo = {
      state: 'error',
      email: null,
      scopeGranted: false,
      errorMessage: readableError,
      lastCheckedAt: new Date().toISOString()
    };
    notifyGmailStateChanged(errStatus);
    throw new Error(readableError);
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async (): Promise<GmailStatusInfo> => {
  const tokenToRevoke = cachedAccessToken;
  cachedAccessToken = null;
  try {
    await auth.signOut();
  } catch {
    // ignore signout error
  }

  try {
    await fetch('/api/gmail/disconnect', {
      method: 'POST',
      headers: getAdminHeaders(tokenToRevoke)
    });
  } catch {
    // ignore network error
  }

  const disconnected: GmailStatusInfo = {
    state: 'disconnected',
    email: null,
    scopeGranted: false,
    lastCheckedAt: new Date().toISOString()
  };
  notifyGmailStateChanged(disconnected);
  return disconnected;
};

export const gmailService = {
  // Global toggle: "Automatikus státusz-e-mailek engedélyezése" (Default: KI / false)
  isGlobalAutoEmailEnabled: (): boolean => {
    try {
      const raw = localStorage.getItem(GLOBAL_AUTO_EMAIL_KEY);
      if (!raw) return false; // Strictly default to false (KI)
      return JSON.parse(raw) === true;
    } catch {
      return false;
    }
  },

  setGlobalAutoEmailEnabled: (enabled: boolean): boolean => {
    try {
      localStorage.setItem(GLOBAL_AUTO_EMAIL_KEY, JSON.stringify(!!enabled));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gmail_global_auto_changed', { detail: !!enabled })
        );
      }
    } catch {
      // ignore
    }
    return !!enabled;
  },

  getCachedStatus: (): GmailStatusInfo => {
    return cachedGmailStatus;
  },

  fetchStatus: async (): Promise<GmailStatusInfo> => {
    try {
      const res = await fetch('/api/gmail/status', {
        method: 'GET',
        headers: getAdminHeaders()
      });
      if (!res.ok) {
        const disconnected: GmailStatusInfo = {
          state: 'disconnected',
          email: null,
          scopeGranted: false
        };
        notifyGmailStateChanged(disconnected);
        return disconnected;
      }
      const data = await res.json();
      const info: GmailStatusInfo = {
        state: data.state || 'disconnected',
        email: data.email || null,
        scopeGranted: !!data.scopeGranted,
        errorMessage: data.errorMessage || undefined,
        lastCheckedAt: data.lastCheckedAt || new Date().toISOString()
      };
      notifyGmailStateChanged(info);
      return info;
    } catch {
      return cachedGmailStatus;
    }
  },

  connect: async (): Promise<GmailStatusInfo> => {
    const result = await googleSignIn();
    if (!result) {
      throw new Error('A Gmail csatlakoztatása nem sikerült.');
    }
    return result.statusInfo;
  },

  disconnect: async (): Promise<GmailStatusInfo> => {
    return await logout();
  },

  testConnection: async (sendTestEmail = false): Promise<{
    success: boolean;
    message: string;
    status: GmailStatusInfo;
  }> => {
    try {
      const res = await fetch('/api/gmail/test', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ sendTestEmail })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const nextState = data.state === 'disconnected' ? 'disconnected' : 'error';
        const errInfo: GmailStatusInfo = {
          state: nextState,
          email: data.email || cachedGmailStatus.email || null,
          errorMessage:
            data.error || 'A Gmail kapcsolat tesztelése sikertelen volt.',
          lastCheckedAt: new Date().toISOString()
        };
        notifyGmailStateChanged(errInfo);
        return {
          success: false,
          message: errInfo.errorMessage!,
          status: errInfo
        };
      }

      const okInfo: GmailStatusInfo = {
        state: 'connected',
        email: data.email || cachedGmailStatus.email,
        scopeGranted: true,
        lastCheckedAt: new Date().toISOString()
      };
      notifyGmailStateChanged(okInfo);
      return {
        success: true,
        message:
          data.message ||
          `✓ A Gmail kapcsolat aktív és működőképes (${okInfo.email}).`,
        status: okInfo
      };
    } catch {
      return {
        success: false,
        message: 'Ideiglenes hálózati hiba történt a kapcsolat tesztelése közben.',
        status: cachedGmailStatus
      };
    }
  },

  // Check if an email was already successfully sent for the exact same status on this request (prevents duplicate emails)
  hasAlreadySentForStatus: (request: ProjectRequest, targetStatus: RequestStatus): boolean => {
    const history = request.emailHistory || [];
    if (history.length === 0) return false;
    // Check if the most recent sent email was already for this exact status
    const latestSent = history.find((item) => item.deliveryStatus === 'Elküldve');
    if (!latestSent) return false;
    return latestSent.statusAtSend === targetStatus;
  },

  // Prepare complete subject, HTML and plain-text email for a given request & status using the existing template system
  prepareStatusEmailPayload: (
    request: ProjectRequest,
    targetStatus: RequestStatus,
    overrideTemplate?: EmailTemplate
  ) => {
    const template =
      overrideTemplate || emailTemplateService.getTemplateForStatus(targetStatus);
    const context = buildEmailDynamicContext(request, targetStatus);
    const fields = generateContextualEmailFields(template, context);

    const includeAiBlock =
      !!request.aiAnalysis?.summary && targetStatus !== 'Elutasítva';

    const htmlBody = buildStudioHtmlEmail({
      subject: fields.subject,
      preheader: fields.preheader,
      introText: fields.introText,
      bodyContent: fields.bodyContent,
      nextStepsText: fields.nextStepsText,
      ctaText: fields.ctaText,
      ctaLink: fields.ctaLink,
      footerText: fields.footerText,
      icon: template.icon || getStatusEmoji(targetStatus),
      accentColor: template.accentColor || 'indigo',
      context,
      aiSummary: request.aiAnalysis?.summary,
      aiEstimatedWeeks: request.aiAnalysis?.estimatedWeeks,
      aiComplexity: request.aiAnalysis?.complexity,
      aiSuggestedTech: request.aiAnalysis?.suggestedTech,
      includeAiBlock
    });

    const plainText = buildPlainTextEmail({
      subject: fields.subject,
      introText: fields.introText,
      bodyContent: fields.bodyContent,
      nextStepsText: fields.nextStepsText,
      ctaText: fields.ctaText,
      ctaLink: fields.ctaLink,
      footerText: fields.footerText,
      icon: template.icon || getStatusEmoji(targetStatus),
      context,
      aiSummary: request.aiAnalysis?.summary,
      aiEstimatedWeeks: request.aiAnalysis?.estimatedWeeks,
      aiComplexity: request.aiAnalysis?.complexity,
      aiSuggestedTech: request.aiAnalysis?.suggestedTech,
      includeAiBlock
    });

    return {
      template,
      context,
      subject: fields.subject,
      htmlBody,
      plainText
    };
  },

  // Send email through connected Gmail account and record outcome in existing EmailHistory
  sendEmailForRequest: async (params: {
    request: ProjectRequest;
    targetStatus: RequestStatus;
    template?: EmailTemplate;
    customSubject?: string;
    customHtmlBody?: string;
    customPlainText?: string;
    sendMode: 'manual' | 'auto';
    existingHistoryId?: string | null;
  }): Promise<{
    success: boolean;
    message: string;
    errorDetail?: string;
    updatedRequest?: ProjectRequest;
    historyId?: string;
  }> => {
    const {
      request,
      targetStatus,
      template,
      customSubject,
      customHtmlBody,
      customPlainText,
      sendMode
    } = params;

    // Duplicate protection for automatic status emails
    if (
      sendMode === 'auto' &&
      gmailService.hasAlreadySentForStatus(request, targetStatus)
    ) {
      return {
        success: false,
        message: '✕ Az e-mail küldése kihagyva (dupla küldés védelem).',
        errorDetail: `Ehhez a státuszhoz (${targetStatus}) már sikeresen elküldésre került az értesítő e-mail.`
      };
    }

    const prepared = gmailService.prepareStatusEmailPayload(
      request,
      targetStatus,
      template
    );

    const finalSubject = customSubject || prepared.subject;
    const finalHtml = customHtmlBody || prepared.htmlBody;
    const finalPlain = customPlainText || prepared.plainText;
    const usedTemplate = template || prepared.template;
    const settings = settingsService.get();

    // Ensure backend request index has the latest request synced for strict recipient validation
    const allRequests = requestService.getAll();
    try {
      await fetch('/api/requests/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: allRequests.map((r) => ({
            id: r.id,
            requestId: r.requestId,
            name: r.name,
            email: r.email,
            projectName: r.projectName,
            projectType: r.projectType,
            projectCategory: r.projectCategory,
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
      });
    } catch {
      // continue
    }

    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          requestId: request.requestId,
          recipientEmail: request.email,
          recipientName: request.name,
          subject: finalSubject,
          htmlBody: finalHtml,
          plainText: finalPlain,
          senderDisplayName: `${settings.ownerName || 'Horvát László'} – ${settings.studioName || 'Web & Project Studio'}`
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        const errDetail =
          data.error ||
          'Ismeretlen Gmail API hiba történt az e-mail küldése közben.';

        if (data.code === 'OAUTH_EXPIRED') {
          notifyGmailStateChanged({
            state: 'error',
            email: cachedGmailStatus.email,
            scopeGranted: false,
            errorMessage: errDetail,
            lastCheckedAt: new Date().toISOString()
          });
        } else if (data.code === 'GMAIL_NOT_CONNECTED') {
          notifyGmailStateChanged({
            state: 'disconnected',
            email: null,
            scopeGranted: false,
            errorMessage: errDetail,
            lastCheckedAt: new Date().toISOString()
          });
        }

        // Record failed attempt in EmailHistory
        const updatedReq = requestService.addEmailHistory(request.id, {
          requestId: request.requestId,
          templateId: usedTemplate.id,
          templateName: usedTemplate.name,
          emailType:
            sendMode === 'auto'
              ? `Automatikus státusz e-mail (${targetStatus})`
              : `Kézi státusz e-mail (${targetStatus})`,
          statusAtSend: targetStatus,
          recipientName: request.name,
          recipientEmail: request.email,
          subject: finalSubject,
          deliveryStatus: 'Sikertelen',
          provider: 'gmail',
          sendMode,
          errorMessage: errDetail
        });

        return {
          success: false,
          message: '✕ Az e-mail küldése sikertelen.',
          errorDetail: errDetail,
          updatedRequest: updatedReq,
          historyId: updatedReq?.emailHistory?.[0]?.id
        };
      }

      // Record successful Gmail API dispatch in EmailHistory
      const updatedReq = requestService.addEmailHistory(request.id, {
        requestId: request.requestId,
        templateId: usedTemplate.id,
        templateName: usedTemplate.name,
        emailType:
          sendMode === 'auto'
            ? `Automatikus státusz e-mail (${targetStatus})`
            : `Kézi státusz e-mail (${targetStatus})`,
        statusAtSend: targetStatus,
        recipientName: request.name,
        recipientEmail: request.email,
        subject: finalSubject,
        deliveryStatus: 'Elküldve',
        provider: 'gmail',
        sendMode
      });

      return {
        success: true,
        message: '✓ Az e-mail sikeresen elküldve.',
        updatedRequest: updatedReq,
        historyId: updatedReq?.emailHistory?.[0]?.id
      };
    } catch {
      const errDetail = 'Ideiglenes hálózati vagy API hiba történt az e-mail küldése közben.';
      const updatedReq = requestService.addEmailHistory(request.id, {
        requestId: request.requestId,
        templateId: usedTemplate.id,
        templateName: usedTemplate.name,
        emailType:
          sendMode === 'auto'
            ? `Automatikus státusz e-mail (${targetStatus})`
            : `Kézi státusz e-mail (${targetStatus})`,
        statusAtSend: targetStatus,
        recipientName: request.name,
        recipientEmail: request.email,
        subject: finalSubject,
        deliveryStatus: 'Sikertelen',
        provider: 'gmail',
        sendMode,
        errorMessage: errDetail
      });

      return {
        success: false,
        message: '✕ Az e-mail küldése sikertelen.',
        errorDetail: errDetail,
        updatedRequest: updatedReq,
        historyId: updatedReq?.emailHistory?.[0]?.id
      };
    }
  }
};
