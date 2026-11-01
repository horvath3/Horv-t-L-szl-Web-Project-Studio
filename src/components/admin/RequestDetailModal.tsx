import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Mail,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  Sparkles,
  Save,
  Check,
  FileText,
  Trash2,
  Copy,
  ShieldCheck,
  Eye,
  MessageSquare,
  ExternalLink,
  Lock,
  History,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ProjectRequest,
  RequestStatus,
  EmailHistoryItem,
  EmailHistoryStatus,
  GmailStatusInfo
} from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import {
  analyzeProjectRequestWithAI,
  requestService,
  getStatusEmoji,
  getProjectCategoryEmoji,
  formatTrackingDateTime,
  DEFAULT_PUBLIC_STATUS_MESSAGES
} from '../../services/storage';
import { gmailService } from '../../services/gmailService';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';
import { EmailReplyModal } from './EmailReplyModal';

interface RequestDetailModalProps {
  request: ProjectRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: RequestStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onTrackingUpdated?: (updated: ProjectRequest) => void;
  onDelete?: (id: string) => void;
}

const STATUSES: RequestStatus[] = [
  'Új',
  'Átnézés alatt',
  'Kapcsolatfelvétel',
  'Ajánlat egyeztetése',
  'Elfogadva',
  'Folyamatban',
  'Tesztelés',
  'Elkészült',
  'Lezárva',
  'Elutasítva'
];

const QUICK_STATUS_MESSAGES: string[] = [
  'Az ajánlatkérésedet jelenleg átnézem. Hamarosan e-mailben felveszem veled a kapcsolatot.',
  'Az előzetes specifikáció és a modulok ütemezése jelenleg egyeztetés alatt áll.',
  'A projekt fejlesztése folyamatban van.',
  'A projekt elkészült moduljai jelenleg tesztelés alatt állnak.',
  'A projekt sikeresen elkészült és átadásra kész!'
];

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onNotesChange,
  onTrackingUpdated,
  onDelete
}) => {
  if (!isOpen || !request) return null;

  const [internalStatus, setInternalStatus] = useState<RequestStatus>(
    request.internalStatus || request.status || 'Új'
  );
  const [publicStatus, setPublicStatus] = useState<RequestStatus>(
    request.publicStatus || request.status || 'Új'
  );
  const [publicStatusMessage, setPublicStatusMessage] = useState<string>(
    request.publicStatusMessage || ''
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(request.updatedAt);
  const [trackingSaved, setTrackingSaved] = useState(false);

  // Section 2: "Automatikus e-mail küldése" toggle (Alapértelmezett: KI / false)
  const [autoSendEmail, setAutoSendEmail] = useState<boolean>(false);
  const [globalAutoEmailEnabled, setGlobalAutoEmailEnabled] = useState<boolean>(
    gmailService.isGlobalAutoEmailEnabled()
  );
  const [gmailStatus, setGmailStatus] = useState<GmailStatusInfo>(
    gmailService.getCachedStatus()
  );
  const [isSendingAutoEmail, setIsSendingAutoEmail] = useState(false);
  const [pendingAutoEmailConfirm, setPendingAutoEmailConfirm] = useState<{
    savedRequest: ProjectRequest;
    targetStatus: RequestStatus;
    subject: string;
    templateName: string;
  } | null>(null);
  const [emailActionFeedback, setEmailActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    detail?: string;
  } | null>(null);

  // Track status change transition for Section 5 ("📧 E-mail küldése a státuszról")
  const [statusTransition, setStatusTransition] = useState<{
    from: RequestStatus;
    to: RequestStatus;
  } | null>(null);

  const [notes, setNotes] = useState(request.adminNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiData, setAiData] = useState(request.aiAnalysis);
  const [emailHistory, setEmailHistory] = useState<EmailHistoryItem[]>(
    request.emailHistory || []
  );
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalTargetStatus, setEmailModalTargetStatus] = useState<RequestStatus | undefined>(
    undefined
  );
  const [copiedEmailTop, setCopiedEmailTop] = useState(false);
  const [copiedRequestId, setCopiedRequestId] = useState(false);

  useEffect(() => {
    setInternalStatus(request.internalStatus || request.status || 'Új');
    setPublicStatus(request.publicStatus || request.status || 'Új');
    setPublicStatusMessage(request.publicStatusMessage || '');
    setLastUpdatedAt(request.updatedAt);
    setNotes(request.adminNotes || '');
    setAiData(request.aiAnalysis);
    setEmailHistory(request.emailHistory || []);
    setStatusTransition(null);
    setAutoSendEmail(false); // Default: KI
    setEmailActionFeedback(null);
    setPendingAutoEmailConfirm(null);
    setGlobalAutoEmailEnabled(gmailService.isGlobalAutoEmailEnabled());
    gmailService.fetchStatus().then((st) => setGmailStatus(st));
  }, [request.id]);

  useEffect(() => {
    const handleGmailStatus = (e: Event) => {
      const custom = e as CustomEvent<GmailStatusInfo>;
      if (custom.detail) setGmailStatus(custom.detail);
    };
    const handleGlobalAuto = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setGlobalAutoEmailEnabled(!!custom.detail);
    };
    window.addEventListener('gmail_status_changed', handleGmailStatus);
    window.addEventListener('gmail_global_auto_changed', handleGlobalAuto);
    return () => {
      window.removeEventListener('gmail_status_changed', handleGmailStatus);
      window.removeEventListener('gmail_global_auto_changed', handleGlobalAuto);
    };
  }, []);

  const handleCopyClientEmail = () => {
    try {
      navigator.clipboard.writeText(request.email);
    } catch {
      // fallback
    }
    setCopiedEmailTop(true);
    setTimeout(() => setCopiedEmailTop(false), 2000);
  };

  const handleCopyTrackingId = () => {
    try {
      navigator.clipboard.writeText(request.requestId);
    } catch {
      // fallback
    }
    setCopiedRequestId(true);
    setTimeout(() => setCopiedRequestId(false), 2000);
  };

  const triggerAutoEmailFlowIfEnabled = (
    updatedReq: ProjectRequest,
    targetSt: RequestStatus
  ) => {
    if (!autoSendEmail) return;

    // Section 7: Check global setting
    if (!gmailService.isGlobalAutoEmailEnabled()) {
      setEmailActionFeedback({
        type: 'info',
        title: 'Státusz mentve (Automatikus e-mail globálisan kikapcsolva)',
        detail:
          'Az „Automatikus státusz-e-mailek engedélyezése” globális kapcsoló jelenleg KI van kapcsolva az Admin → Beállítások → Gmail kapcsolat résznél. A kézi küldés gombbal ettől függetlenül elküldheted.'
      });
      return;
    }

    // Section 6: Duplicate protection
    if (gmailService.hasAlreadySentForStatus(updatedReq, targetSt)) {
      setEmailActionFeedback({
        type: 'info',
        title: 'Dupla küldés megakadályozva',
        detail: `Ehhez az ajánlatkéréshez a(z) „${targetSt}” státuszról már sikeresen elküldésre került az e-mail.`
      });
      return;
    }

    // Prepare draft & show confirmation modal
    const prepared = gmailService.prepareStatusEmailPayload(updatedReq, targetSt);
    setPendingAutoEmailConfirm({
      savedRequest: updatedReq,
      targetStatus: targetSt,
      subject: prepared.subject,
      templateName: prepared.template.name
    });
  };

  const handleConfirmAndExecuteAutoEmail = async () => {
    if (!pendingAutoEmailConfirm) return;
    const { savedRequest, targetStatus } = pendingAutoEmailConfirm;
    setPendingAutoEmailConfirm(null);
    setIsSendingAutoEmail(true);
    setEmailActionFeedback(null);

    try {
      const result = await gmailService.sendEmailForRequest({
        request: savedRequest,
        targetStatus,
        sendMode: 'auto'
      });

      if (result.updatedRequest) {
        setEmailHistory(result.updatedRequest.emailHistory || []);
        if (onTrackingUpdated) {
          onTrackingUpdated(result.updatedRequest);
        }
      }

      if (result.success) {
        setEmailActionFeedback({
          type: 'success',
          title: '✓ Az e-mail sikeresen elküldve.',
          detail: `A Gmail API sikeresen átadta a(z) „${targetStatus}” státuszértesítőt (${savedRequest.email}).`
        });
      } else {
        setEmailActionFeedback({
          type: 'error',
          title: '✕ Az e-mail küldése sikertelen.',
          detail: result.errorDetail || 'Hiba történt az automatikus e-mail küldése során.'
        });
      }
    } finally {
      setIsSendingAutoEmail(false);
    }
  };

  const handleSaveTracking = (
    nextInternal = internalStatus,
    nextPublic = publicStatus,
    nextMessage = publicStatusMessage,
    shouldTriggerAutoEmail = true
  ) => {
    const updated = requestService.updateTrackingSettings(request.id, {
      internalStatus: nextInternal,
      publicStatus: nextPublic,
      publicStatusMessage: nextMessage
    });
    if (updated) {
      setLastUpdatedAt(updated.updatedAt);
      setTrackingSaved(true);
      setTimeout(() => setTrackingSaved(false), 2500);
      if (onTrackingUpdated) {
        onTrackingUpdated(updated);
      }
      if (shouldTriggerAutoEmail) {
        triggerAutoEmailFlowIfEnabled(updated, nextPublic);
      }
    }
  };

  const handleInternalStatusSelect = (newStatus: RequestStatus) => {
    const prevStatus = internalStatus;
    setInternalStatus(newStatus);

    let nextPublic = publicStatus;
    let nextMsg = publicStatusMessage;
    if (publicStatus === prevStatus) {
      nextPublic = newStatus;
      setPublicStatus(newStatus);
      if (
        !nextMsg.trim() ||
        Object.values(DEFAULT_PUBLIC_STATUS_MESSAGES).includes(nextMsg.trim())
      ) {
        nextMsg = DEFAULT_PUBLIC_STATUS_MESSAGES[newStatus] || '';
        setPublicStatusMessage(nextMsg);
      }
    }

    if (prevStatus !== newStatus) {
      setStatusTransition({ from: prevStatus, to: newStatus });
    }

    handleSaveTracking(newStatus, nextPublic, nextMsg, true);
  };

  const handlePublicStatusSelect = (newPublicStatus: RequestStatus) => {
    const prevPublic = publicStatus;
    setPublicStatus(newPublicStatus);
    let nextMsg = publicStatusMessage;
    if (
      !nextMsg.trim() ||
      Object.values(DEFAULT_PUBLIC_STATUS_MESSAGES).includes(nextMsg.trim())
    ) {
      nextMsg = DEFAULT_PUBLIC_STATUS_MESSAGES[newPublicStatus] || '';
      setPublicStatusMessage(nextMsg);
    }
    if (prevPublic !== newPublicStatus) {
      setStatusTransition({ from: prevPublic, to: newPublicStatus });
    }
    handleSaveTracking(internalStatus, newPublicStatus, nextMsg, true);
  };

  const handleOpenEmailModal = (targetSt?: RequestStatus) => {
    setEmailModalTargetStatus(targetSt || publicStatus);
    setIsEmailModalOpen(true);
  };

  const handleUpdateHistoryItemStatus = (historyId: string, newStatus: EmailHistoryStatus) => {
    const updated = requestService.updateEmailHistoryStatus(request.id, historyId, newStatus);
    if (updated) {
      setEmailHistory(updated.emailHistory || []);
      if (onTrackingUpdated) {
        onTrackingUpdated(updated);
      }
    }
  };

  const handleNotesSave = () => {
    setIsSavingNotes(true);
    onNotesChange(request.id, notes);
    const refreshed = requestService.getById(request.id);
    if (refreshed) {
      setLastUpdatedAt(refreshed.updatedAt);
    }
    setTimeout(() => {
      setIsSavingNotes(false);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    }, 400);
  };

  const handleRunAIAnalysis = async () => {
    setAnalyzingAI(true);
    try {
      const result = await analyzeProjectRequestWithAI(request);
      setAiData(result);
    } catch (e) {
      console.error('AI analysis error:', e);
    } finally {
      setAnalyzingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel rounded-2xl border border-white/10 w-full max-w-3xl my-6 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg sm:text-xl font-bold font-display text-white">
              {request.projectName}
            </h3>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
              <span>{request.requestId}</span>
              <button
                type="button"
                onClick={handleCopyTrackingId}
                className="text-indigo-300 hover:text-white transition-colors cursor-pointer"
                title="Egyedi azonosító másolása"
              >
                {copiedRequestId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <StatusBadge status={internalStatus} />
          </div>

          <div className="flex items-center gap-2">
            {/* Section 4 & 6: Manual "E-mail küldése" button in request details */}
            <button
              type="button"
              onClick={() => handleOpenEmailModal(publicStatus)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>E-mail küldése</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[76vh] overflow-y-auto">
          {/* Promotion Banner if attached */}
          {request.promotionTitle && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🎁</span>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
                    Kapcsolódó Promóció
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {request.promotionTitle}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/20 font-mono">
                Promóciós ajánlatkérés
              </span>
            </div>
          )}

          {/* Client & Timestamps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block mb-0.5">Megrendelő (Bizalmas)</span>
              <span className="font-semibold text-white block">{request.name}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={() => handleOpenEmailModal(publicStatus)}
                  className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer text-left"
                  title="E-mail előnézet és küldés megnyitása"
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{request.email}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyClientEmail}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="E-mail cím másolása"
                >
                  {copiedEmailTop ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Projekt Kategória & Azonosító</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-indigo-200 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md text-xs mb-1">
                <span>{getProjectCategoryEmoji(request.projectCategory || request.projectType)}</span>
                <span>{request.projectCategory || request.projectType}</span>
              </span>
              {request.websiteType && (
                <span className="text-slate-300 text-[11px] block">
                  Weboldal típusa: <strong className="text-white">{request.websiteType}</strong>
                </span>
              )}
              <span className="text-indigo-300 font-mono text-[11px] block mt-0.5">
                Azonosító: {request.requestId}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Időbélyegek</span>
              <span className="text-slate-300 block">
                Beküldve: {formatTrackingDateTime(request.createdAt)}
              </span>
              <span className="text-indigo-300 font-medium block mt-0.5">
                Utolsó módosítás: {formatTrackingDateTime(lastUpdatedAt)}
              </span>
            </div>
          </div>

          {/* ================= DUAL STATUS & AUTOMATIC / MANUAL STATUS EMAIL PANEL ================= */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-black border border-indigo-500/30 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Státuszkezelés & Státuszértesítő E-mail
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {trackingSaved && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Státusz frissítve!</span>
                  </span>
                )}
                <Link
                  to={`/ajanlat-statusz?id=${encodeURIComponent(request.requestId)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Publikus státuszoldal</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Section 2: "Automatikus e-mail küldése" Toggle Bar (Default: KI) */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Automatikus e-mail küldése
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      autoSendEmail
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-white/10'
                    }`}
                  >
                    {autoSendEmail ? 'BE' : 'KI (Alapértelmezett)'}
                  </span>
                  {gmailStatus.state === 'connected' && gmailStatus.email ? (
                    <span className="text-[11px] text-emerald-300 font-mono">
                      ✓ Gmail: {gmailStatus.email}
                    </span>
                  ) : (
                    <Link
                      to="/admin/beallitasok"
                      className="text-[11px] text-amber-300 hover:underline"
                    >
                      ⚠️ Gmail nincs csatlakoztatva (Beállítások →)
                    </Link>
                  )}
                </div>
                <p className="text-[11px] text-slate-300">
                  Az új státuszról automatikusan küldjön e-mailt az ügyfélnek.
                </p>
                {!globalAutoEmailEnabled && autoSendEmail && (
                  <div className="text-[11px] text-amber-300 flex flex-wrap items-center gap-2 pt-0.5">
                    <span>
                      ⚠️ A globális „Automatikus státusz-e-mailek engedélyezése” jelenleg KI van kapcsolva.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        gmailService.setGlobalAutoEmailEnabled(true);
                        setGlobalAutoEmailEnabled(true);
                      }}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold cursor-pointer"
                    >
                      Globális engedélyezés most (BE)
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoSendEmail}
                  onClick={() => setAutoSendEmail(!autoSendEmail)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                    autoSendEmail
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      autoSendEmail ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  <span>Automatikus küldés: {autoSendEmail ? 'BE' : 'KI'}</span>
                </button>
              </div>
            </div>

            {/* Section 4: Immediate Feedback Banner for Email Sending */}
            {emailActionFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  emailActionFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    : emailActionFeedback.type === 'error'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                    : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {emailActionFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{emailActionFeedback.title}</div>
                    {emailActionFeedback.detail && (
                      <div className="text-[11px] opacity-90 mt-0.5">
                        {emailActionFeedback.detail}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailActionFeedback(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Section 5 & 6: Highlighted Banner when status changes ("📧 E-mail küldése a státuszról") */}
            {statusTransition && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-600/25 via-purple-600/25 to-cyan-600/20 border border-indigo-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Státusz módosult:</span>
                    <span className="px-2 py-0.5 rounded bg-black/50 text-slate-300 font-mono">
                      {getStatusEmoji(statusTransition.from)} {statusTransition.from}
                    </span>
                    <span className="text-indigo-300">→</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-mono">
                      {getStatusEmoji(statusTransition.to)} {statusTransition.to}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Értesítsd {request.name} ügyfelet az új státuszról a hozzátartozó e-mail sablonnal!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEmailModal(statusTransition.to)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shrink-0 cursor-pointer"
                >
                  <span>📧 E-mail küldése a státuszról</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Belső státusz */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Belső státusz (Admin)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Az admin táblázatban és belső munkafolyamatban használt állapot.
                </p>
                <select
                  value={internalStatus}
                  onChange={(e) => handleInternalStatusSelect(e.target.value as RequestStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {getStatusEmoji(st)} {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ügyfél által látható státusz */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                <label className="block text-xs font-bold text-indigo-200 mb-1">
                  Ügyfél által látható státusz
                </label>
                <p className="text-[11px] text-indigo-300/70 mb-2">
                  Ez az állapot jelenik meg a <span className="font-mono">/ajanlat-statusz</span> oldalon és az e-mailben.
                </p>
                <select
                  value={publicStatus}
                  onChange={(e) => handlePublicStatusSelect(e.target.value as RequestStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/40 text-white text-xs font-medium focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {getStatusEmoji(st)} {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Státuszüzenet az ügyfélnek */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ügyfélnek látható státuszüzenet / magyarázat (opcionális)</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isSendingAutoEmail}
                    onClick={() =>
                      handleSaveTracking(
                        internalStatus,
                        publicStatus,
                        publicStatusMessage,
                        true
                      )
                    }
                    className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                      autoSendEmail && globalAutoEmailEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    <Save className="w-3 h-3" />
                    <span>
                      {isSendingAutoEmail
                        ? 'Mentés és küldés...'
                        : autoSendEmail && globalAutoEmailEnabled
                        ? 'Státusz mentése + Automatikus e-mail'
                        : 'Státuszváltozás mentése'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal(publicStatus)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>📧 E-mail küldése a státuszról</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={2}
                value={publicStatusMessage}
                onChange={(e) => setPublicStatusMessage(e.target.value)}
                placeholder="Például: Az ajánlatkérésedet jelenleg átnézem. Hamarosan e-mailben felveszem veled a kapcsolatot."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
              />

              {/* Quick preset message chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mr-1">
                  Gyors sablonok:
                </span>
                {QUICK_STATUS_MESSAGES.map((msg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPublicStatusMessage(msg);
                      handleSaveTracking(internalStatus, publicStatus, msg, false);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-200 border border-white/10 transition-colors cursor-pointer truncate max-w-[260px]"
                    title={msg}
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================= SECTION 5: E-MAIL ELŐZMÉNYEK (EMAIL HISTORY) ================= */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    E-mail előzmények & Státuszértesítések ({emailHistory.length})
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Az „Elküldve” állapot azt jelzi, hogy a Gmail API sikeresen elfogadta/küldte az üzenetet.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenEmailModal(publicStatus)}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Mail className="w-3 h-3" />
                <span>Új e-mail előkészítése / küldése</span>
              </button>
            </div>

            {emailHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                Ehhez az ajánlatkéréshez még nem generáltál vagy küldtél státuszértesítő e-mailt.
              </p>
            ) : (
              <div className="space-y-2">
                {emailHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white">Sablon: {item.templateName}</span>
                          <StatusBadge status={item.statusAtSend} size="sm" />
                          {item.provider === 'gmail' && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold">
                              Gmail API ({item.sendMode === 'auto' ? 'Automatikus' : 'Kézi'})
                            </span>
                          )}
                        </div>
                        <div className="text-indigo-200 font-medium truncate" title={item.subject}>
                          Tárgy: {item.subject}
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                          <span>
                            Címzett: <strong className="text-slate-200">{item.recipientName}</strong> ({item.recipientEmail})
                          </span>
                          <span>•</span>
                          <span>Dátum: {formatTrackingDateTime(item.timestamp)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(['Előkészítve', 'Elküldve', 'Sikertelen'] as EmailHistoryStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateHistoryItemStatus(item.id, st)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                                item.deliveryStatus === st
                                  ? st === 'Elküldve'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : st === 'Sikertelen'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                  : 'bg-black/40 text-slate-500 border-white/10 hover:text-slate-300'
                              }`}
                            >
                              {st}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Display Error Message if delivery failed */}
                    {item.errorMessage && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Hibaüzenet: {item.errorMessage}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================= SECTION 6: JÁTÉKPROJEKT & KATEGÓRIA-SPECIFIKUS EXTRA ADATOK ================= */}
          {(request.projectCategory === 'Játékprojekt' ||
            request.gameName ||
            request.gameType ||
            request.platform ||
            request.engine ||
            request.inspiration ||
            request.referenceLink) && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-black border border-purple-500/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎮</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Projekt kategória: 🎮 Játékprojekt – Specifikus Adatok
                  </h4>
                </div>
                {request.engine && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-[11px] font-semibold">
                    Motor: {request.engine}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 text-[11px] block mb-0.5">Játék neve:</span>
                  <span className="font-bold text-white text-sm">
                    {request.gameName || request.projectName}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 text-[11px] block mb-0.5">Játék típusa:</span>
                  <span className="font-bold text-indigo-200">
                    {request.gameType || 'Nincs megadva'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 text-[11px] block mb-0.5">Platform:</span>
                  <span className="font-bold text-cyan-200">
                    {request.platform || 'Nincs megadva'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 text-[11px] block mb-0.5">
                    Inspiráció vagy referencia játék:
                  </span>
                  <span className="font-semibold text-white">
                    {request.inspiration || 'Nincs megadva'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 text-[11px] block mb-0.5">
                    Steam link / referencia link:
                  </span>
                  {request.referenceLink || request.referenceUrl ? (
                    <a
                      href={request.referenceLink || request.referenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 hover:underline font-mono truncate block"
                    >
                      {request.referenceLink || request.referenceUrl}
                    </a>
                  ) : (
                    <span className="text-slate-500">Nincs megadva</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Rövid összefoglaló
              </h4>
              <p className="text-sm text-slate-200 bg-black/20 p-3 rounded-lg border border-white/5">
                {request.shortDescription}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Részletes elképzelés
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-black/20 p-3.5 rounded-lg border border-white/5 whitespace-pre-line">
                {request.detailedDescription}
              </p>
            </div>

            {request.notes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Ügyfél megjegyzése / egyéb kérés
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-black/20 p-3.5 rounded-lg border border-white/5 whitespace-pre-line">
                  {request.notes}
                </p>
              </div>
            )}
          </div>

          {/* Features requested */}
          {((request.requestedFeatures && request.requestedFeatures.length > 0) ||
            (request.requiredFeatures && request.requiredFeatures.length > 0)) && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Funkciólista & Elvárások
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(request.requestedFeatures || request.requiredFeatures || []).map((feat, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs text-slate-200 flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Uploaded Project Files */}
          {request.projectFiles && request.projectFiles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Csatolt Képek & Dokumentumok ({request.projectFiles.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {request.projectFiles.map((fileItem, idx) => {
                  const displayLabel =
                    typeof fileItem === 'string'
                      ? fileItem
                      : `${fileItem.name}${
                          fileItem.size ? ` (${Math.max(1, Math.round(fileItem.size / 1024))} KB)` : ''
                        }`;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-200 text-xs font-mono"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{displayLabel}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget, Deadline, Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
              <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Költségkeret (Bizalmas):</span>
              </span>
              <span className="font-semibold text-slate-200">
                {request.budget || 'Nem adott meg'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
              <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Kívánt határidő:</span>
              </span>
              <span className="font-semibold text-slate-200">
                {request.deadline || 'Rugalmas'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
              <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Példa / Csatolmány:</span>
              </span>
              {request.referenceUrl ? (
                <a
                  href={request.referenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline truncate block"
                >
                  {request.referenceUrl}
                </a>
              ) : request.attachmentName ? (
                <span className="text-slate-300 truncate block">
                  {request.attachmentName}
                </span>
              ) : (
                <span className="text-slate-500">Nincs megadva</span>
              )}
            </div>
          </div>

          {/* AI Project Analysis Section */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black border border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Projektigény-Elemzés & Ajánlat-Előkészítés
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunAIAnalysis}
                disabled={analyzingAI}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {analyzingAI ? (
                  <>
                    <div className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                    <span>Elemzés...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>{aiData ? 'Újraelemzés' : 'AI Elemzés Futtatása'}</span>
                  </>
                )}
              </button>
            </div>

            {aiData ? (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
                  {aiData.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-500 block mb-1">Becsült Időtartam:</span>
                    <span className="font-semibold text-indigo-300">{aiData.estimatedWeeks}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-500 block mb-1">Projekt Komplexitás:</span>
                    <span className="font-semibold text-indigo-300">{aiData.complexity}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1.5 font-medium">Javasolt Technológiai Stack:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiData.suggestedTech.map((tech, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {aiData.recommendedNextSteps && (
                  <div>
                    <span className="text-slate-400 block mb-1 font-medium">Javasolt Következő Lépések:</span>
                    <ul className="space-y-1">
                      {aiData.recommendedNextSteps.map((step, i) => (
                        <li key={i} className="text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Kattints az „AI Elemzés Futtatása” gombra a megkeresés automatikus szakmai elemzéséhez és becsléséhez.
              </p>
            )}
          </div>

          {/* Internal Studio Notes (Strictly Private) */}
          <div className="space-y-2 p-4 rounded-xl bg-black/30 border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Belső Admin Megjegyzések</span>
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3" />
                <span>Bizalmas – SOHA nem jelenik meg a publikus státuszoldalon és az e-mailben</span>
              </span>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ide írhatsz belső megjegyzéseket az ügyfélről, árképzésről, telefonos megállapodásokról (az ügyfél nem látja)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNotesSave}
                disabled={isSavingNotes}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {notesSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mentve!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Belső jegyzet mentése</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenEmailModal(publicStatus)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>E-mail küldése</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenEmailModal(publicStatus)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>📧 E-mail küldése a státuszról ({publicStatus})</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                title="Megkeresés törlése"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Törlés</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Bezárás
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Automatic Status Email */}
      {pendingAutoEmailConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl border border-emerald-500/40 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Automatikus státusz-e-mail küldése
                </h4>
                <p className="text-xs text-slate-400">
                  A státusz mentve lett. Erősítsd meg az e-mail kiküldését a csatlakoztatott Gmail-fiókon keresztül:
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs space-y-1.5 text-slate-300">
              <div>
                <span className="text-slate-500">Feladó Gmail:</span>{' '}
                <strong className="text-emerald-300 font-mono">
                  {gmailStatus.email || 'Nincs csatlakoztatva'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Címzett:</span>{' '}
                <strong className="text-white">{pendingAutoEmailConfirm.savedRequest.name}</strong>{' '}
                <span className="font-mono text-indigo-300">
                  &lt;{pendingAutoEmailConfirm.savedRequest.email}&gt;
                </span>
              </div>
              <div>
                <span className="text-slate-500">Új státusz & Sablon:</span>{' '}
                <strong className="text-white">
                  {getStatusEmoji(pendingAutoEmailConfirm.targetStatus)}{' '}
                  {pendingAutoEmailConfirm.targetStatus}
                </strong>{' '}
                ({pendingAutoEmailConfirm.templateName})
              </div>
              <div>
                <span className="text-slate-500">Tárgy:</span>{' '}
                <strong className="text-indigo-200">{pendingAutoEmailConfirm.subject}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingAutoEmailConfirm(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Mégse (Csak státusz mentése)
              </button>
              <button
                type="button"
                onClick={handleConfirmAndExecuteAutoEmail}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Megerősítés és E-mail Küldése</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Email Reply & Status Notification Composer Modal */}
      <EmailReplyModal
        request={{
          ...request,
          internalStatus,
          publicStatus,
          publicStatusMessage,
          aiAnalysis: aiData,
          emailHistory
        }}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialStatus={emailModalTargetStatus || publicStatus}
        statusTransitionLabel={
          statusTransition ? `${statusTransition.from} → ${statusTransition.to}` : undefined
        }
        onAnalysisUpdated={(newAnalysis) => setAiData(newAnalysis)}
        onHistoryAdded={(updatedReq) => {
          setEmailHistory(updatedReq.emailHistory || []);
          if (onTrackingUpdated) {
            onTrackingUpdated(updatedReq);
          }
        }}
      />

      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        title="Megkeresés törlése"
        message="Biztosan véglegesen törölni szeretnéd ezt a projektmegkeresést?"
        itemName={`${request.name} – ${request.projectName}`}
        onConfirm={() => {
          setShowConfirmDelete(false);
          if (onDelete) {
            onDelete(request.id);
          }
          onClose();
        }}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </div>
  );
};
