import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Mail,
  Eye,
  Code2,
  Sliders,
  FileText,
  CheckCircle2,
  Send,
  Server,
  AlertCircle
} from 'lucide-react';
import {
  ProjectRequest,
  RequestStatus,
  EmailTemplate,
  EmailHistoryStatus,
  GmailStatusInfo
} from '../../types';
import {
  analyzeProjectRequestWithAI,
  emailTemplateService,
  buildEmailDynamicContext,
  generateContextualEmailFields,
  buildStudioHtmlEmail,
  buildPlainTextEmail,
  personalizeStatusEmailWithAI,
  requestService,
  getStatusEmoji
} from '../../services/storage';
import { gmailService } from '../../services/gmailService';
import { StatusBadge } from '../ui/StatusBadge';

interface EmailReplyModalProps {
  request: ProjectRequest;
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: RequestStatus;
  statusTransitionLabel?: string; // e.g. "Új → Átnézés alatt"
  onAnalysisUpdated?: (analysis: NonNullable<ProjectRequest['aiAnalysis']>) => void;
  onHistoryAdded?: (updatedRequest: ProjectRequest) => void;
}

export const EmailReplyModal: React.FC<EmailReplyModalProps> = ({
  request,
  isOpen,
  onClose,
  initialStatus,
  statusTransitionLabel,
  onAnalysisUpdated,
  onHistoryAdded
}) => {
  const richPreviewRef = useRef<HTMLDivElement>(null);

  const effectiveStatus: RequestStatus =
    initialStatus || request.publicStatus || request.status || 'Új';

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'customize'>('preview');
  const [includeAiBlock, setIncludeAiBlock] = useState<boolean>(true);

  const [isPersonalizingAI, setIsPersonalizingAI] = useState(false);
  const [, setIsAnalyzingProject] = useState(false);
  const [customAiInstruction, setCustomAiInstruction] = useState('');

  // Gmail API sending states
  const [gmailStatus, setGmailStatus] = useState<GmailStatusInfo>(gmailService.getCachedStatus());
  const [isSendingGmail, setIsSendingGmail] = useState(false);
  const [isConnectingGmailInline, setIsConnectingGmailInline] = useState(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{
    success: boolean;
    title: string;
    detail?: string;
  } | null>(null);

  // Copy feedback states ("✓ Kimásolva")
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedHtmlCode, setCopiedHtmlCode] = useState(false);
  const [copiedPlainText, setCopiedPlainText] = useState(false);
  const [copiedFullEmail, setCopiedFullEmail] = useState(false);
  const [copiedRecipient, setCopiedRecipient] = useState(false);
  const [historyRecordedId, setHistoryRecordedId] = useState<string | null>(null);
  const [recordedStatus, setRecordedStatus] = useState<EmailHistoryStatus>('Előkészítve');

  // Editable email fields
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [introText, setIntroText] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [nextStepsText, setNextStepsText] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [footerText, setFooterText] = useState('');
  const [icon, setIcon] = useState('✉️');
  const [accentColor, setAccentColor] = useState<EmailTemplate['accentColor']>('indigo');

  // AI evaluation fields
  const [aiSummary, setAiSummary] = useState(request.aiAnalysis?.summary || '');
  const [aiEstimatedWeeks, setAiEstimatedWeeks] = useState(
    request.aiAnalysis?.estimatedWeeks || '4-6 hét'
  );
  const [aiComplexity, setAiComplexity] = useState<'Alacsony' | 'Közepes' | 'Magas'>(
    request.aiAnalysis?.complexity || 'Közepes'
  );
  const [aiSuggestedTech, setAiSuggestedTech] = useState<string[]>(
    request.aiAnalysis?.suggestedTech || ['React', 'TypeScript', 'Tailwind CSS']
  );

  // Load templates and initialize fields for current status + request
  useEffect(() => {
    if (!isOpen) return;
    const allTemplates = emailTemplateService.getAll();
    setTemplates(allTemplates);

    const matchedTemplate = emailTemplateService.getTemplateForStatus(effectiveStatus);
    setSelectedTemplateId(matchedTemplate.id);
    applyTemplateToDraft(matchedTemplate, effectiveStatus);
    setHistoryRecordedId(null);
    setRecordedStatus('Előkészítve');
    setSendFeedback(null);
    setShowSendConfirmModal(false);

    gmailService.fetchStatus().then((st) => setGmailStatus(st));

    if (request.aiAnalysis) {
      setAiSummary(request.aiAnalysis.summary);
      setAiEstimatedWeeks(request.aiAnalysis.estimatedWeeks);
      setAiComplexity(request.aiAnalysis.complexity);
      setAiSuggestedTech(request.aiAnalysis.suggestedTech);
    } else {
      runBackgroundProjectAnalysis();
    }
  }, [isOpen, request.id, effectiveStatus]);

  useEffect(() => {
    const handleStatusEvent = (e: Event) => {
      const custom = e as CustomEvent<GmailStatusInfo>;
      if (custom.detail) setGmailStatus(custom.detail);
    };
    window.addEventListener('gmail_status_changed', handleStatusEvent);
    return () => window.removeEventListener('gmail_status_changed', handleStatusEvent);
  }, []);

  const applyTemplateToDraft = (tpl: EmailTemplate, statusToUse: RequestStatus) => {
    const ctx = buildEmailDynamicContext(request, statusToUse);
    const generated = generateContextualEmailFields(tpl, ctx);

    setSubject(generated.subject);
    setPreheader(generated.preheader);
    setIntroText(generated.introText);
    setBodyContent(generated.bodyContent);
    setNextStepsText(generated.nextStepsText);
    setCtaText(generated.ctaText);
    setCtaLink(generated.ctaLink);
    setFooterText(generated.footerText);
    setIcon(tpl.icon || getStatusEmoji(statusToUse));
    setAccentColor(tpl.accentColor || 'indigo');
  };

  const handleTemplateSelectChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = templates.find((t) => t.id === tplId);
    if (found) {
      applyTemplateToDraft(found, effectiveStatus);
    }
  };

  const runBackgroundProjectAnalysis = async () => {
    setIsAnalyzingProject(true);
    try {
      const result = await analyzeProjectRequestWithAI(request);
      setAiSummary(result.summary);
      setAiEstimatedWeeks(result.estimatedWeeks);
      setAiComplexity(result.complexity);
      setAiSuggestedTech(result.suggestedTech);
      if (onAnalysisUpdated) {
        onAnalysisUpdated(result);
      }
    } catch (e) {
      console.error('AI project analysis error:', e);
    } finally {
      setIsAnalyzingProject(false);
    }
  };

  const handleAiPersonalize = async () => {
    setIsPersonalizingAI(true);
    try {
      const personalized = await personalizeStatusEmailWithAI(
        request,
        effectiveStatus,
        customAiInstruction
      );
      setSubject(personalized.subject);
      setPreheader(personalized.preheader);
      setIntroText(personalized.introText);
      setBodyContent(personalized.bodyContent);
      setNextStepsText(personalized.nextStepsText);
      setCtaText(personalized.ctaText);
    } catch (err) {
      console.error('Error personalizing email:', err);
    } finally {
      setIsPersonalizingAI(false);
    }
  };

  if (!isOpen) return null;

  const dynamicContext = buildEmailDynamicContext(request, effectiveStatus);
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId);

  const generatedHtml = buildStudioHtmlEmail({
    subject,
    preheader,
    introText,
    bodyContent,
    nextStepsText,
    ctaText,
    ctaLink,
    footerText,
    icon,
    accentColor,
    context: dynamicContext,
    aiSummary,
    aiEstimatedWeeks,
    aiComplexity,
    aiSuggestedTech,
    includeAiBlock: includeAiBlock && effectiveStatus !== 'Elutasítva'
  });

  const generatedPlainText = buildPlainTextEmail({
    subject,
    introText,
    bodyContent,
    nextStepsText,
    ctaText,
    ctaLink,
    footerText,
    icon,
    context: dynamicContext,
    aiSummary,
    aiEstimatedWeeks,
    aiComplexity,
    aiSuggestedTech,
    includeAiBlock: includeAiBlock && effectiveStatus !== 'Elutasítva'
  });

  const ensureHistoryRecorded = (statusToLog: EmailHistoryStatus = 'Előkészítve') => {
    if (historyRecordedId) return;
    const updatedReq = requestService.addEmailHistory(request.id, {
      requestId: request.requestId,
      templateId: currentTemplate?.id,
      templateName: currentTemplate?.name || `Státusz sablon (${effectiveStatus})`,
      emailType:
        effectiveStatus === 'Új'
          ? 'Ajánlatkérés visszaigazolás'
          : `Státuszértesítés (${effectiveStatus})`,
      statusAtSend: effectiveStatus,
      recipientName: request.name,
      recipientEmail: request.email,
      subject,
      deliveryStatus: statusToLog,
      provider: 'manual-copy',
      sendMode: 'manual-copy'
    });
    if (updatedReq && updatedReq.emailHistory && updatedReq.emailHistory.length > 0) {
      setHistoryRecordedId(updatedReq.emailHistory[0].id);
      setRecordedStatus(statusToLog);
      if (onHistoryAdded) {
        onHistoryAdded(updatedReq);
      }
    }
  };

  const handleDeliveryStatusChange = (newDeliveryStatus: EmailHistoryStatus) => {
    setRecordedStatus(newDeliveryStatus);
    if (!historyRecordedId) {
      ensureHistoryRecorded(newDeliveryStatus);
      return;
    }
    const updatedReq = requestService.updateEmailHistoryStatus(
      request.id,
      historyRecordedId,
      newDeliveryStatus
    );
    if (updatedReq && onHistoryAdded) {
      onHistoryAdded(updatedReq);
    }
  };

  // Connect Gmail directly if disconnected
  const handleConnectGmailInline = async () => {
    setIsConnectingGmailInline(true);
    setSendFeedback(null);
    try {
      const status = await gmailService.connect();
      setGmailStatus(status);
      if (status.state === 'connected' && status.email) {
        setSendFeedback({
          success: true,
          title: '✓ Gmail csatlakoztatva',
          detail: `Feladó: ${status.email} • Most már közvetlenül elküldheted az e-mailt.`
        });
      }
    } catch (err: any) {
      setSendFeedback({
        success: false,
        title: '✕ Gmail csatlakozási hiba',
        detail: err?.message || 'Nem sikerült csatlakoztatni a Gmail-fiókot.'
      });
    } finally {
      setIsConnectingGmailInline(false);
    }
  };

  // Execute Manual Send via Gmail API after explicit confirmation
  const handleConfirmSendViaGmail = async () => {
    setShowSendConfirmModal(false);
    setIsSendingGmail(true);
    setSendFeedback(null);

    try {
      const result = await gmailService.sendEmailForRequest({
        request,
        targetStatus: effectiveStatus,
        template: currentTemplate,
        customSubject: subject,
        customHtmlBody: generatedHtml,
        customPlainText: generatedPlainText,
        sendMode: 'manual',
        existingHistoryId: historyRecordedId
      });

      if (result.updatedRequest && onHistoryAdded) {
        onHistoryAdded(result.updatedRequest);
      }
      if (result.historyId) {
        setHistoryRecordedId(result.historyId);
      }

      if (result.success) {
        setRecordedStatus('Elküldve');
        setSendFeedback({
          success: true,
          title: '✓ Az e-mail sikeresen elküldve.',
          detail: `A Gmail API sikeresen átadta az üzenetet kézbesítésre (${request.email}).`
        });
      } else {
        setRecordedStatus('Sikertelen');
        setSendFeedback({
          success: false,
          title: '✕ Az e-mail küldése sikertelen.',
          detail: result.errorDetail || 'Hiba történt az e-mail küldése során.'
        });
      }
    } finally {
      setIsSendingGmail(false);
    }
  };

  const copyRawString = async (
    text: string,
    setFlag: (v: boolean) => void,
    recordHistory = true
  ) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setFlag(true);
    setTimeout(() => setFlag(false), 2500);
    if (recordHistory) {
      ensureHistoryRecorded('Előkészítve');
    }
  };

  // Copies the full styled email (HTML + Plain Text MIME types + DOM selection) so it pastes with full visual styling in Gmail / Outlook
  const handleCopyFullStyledEmail = async () => {
    let copied = false;

    if (richPreviewRef.current) {
      try {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          const range = document.createRange();
          range.selectNodeContents(richPreviewRef.current);
          selection.addRange(range);
          copied = document.execCommand('copy');
          selection.removeAllRanges();
        }
      } catch {
        copied = false;
      }
    }

    try {
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const htmlBlob = new Blob([generatedHtml], { type: 'text/html' });
        const textBlob = new Blob([generatedPlainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
          })
        ]);
        copied = true;
      }
    } catch {
      // Ignore if ClipboardItem is restricted in iframe; DOM selection copy already succeeded
    }

    if (!copied) {
      await copyRawString(generatedPlainText, setCopiedFullEmail, true);
      return;
    }

    setCopiedFullEmail(true);
    setTimeout(() => setCopiedFullEmail(false), 2500);
    ensureHistoryRecorded('Előkészítve');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel rounded-2xl border border-indigo-500/30 w-full max-w-5xl my-auto overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-display text-white">
                  E-mail Előnézet & Státuszértesítő Küldése
                </h3>
                {statusTransitionLabel && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold">
                    Státuszváltás: {statusTransitionLabel}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Horvát László – Web & Project Studio egységes HTML e-mail generátor és közvetlen Gmail API küldő.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAiPersonalize}
              disabled={isPersonalizingAI}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="E-mail szövegének AI alapú újrafogalmazása az ajánlatkérés adatai alapján"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isPersonalizingAI ? 'animate-spin' : ''}`} />
              <span>{isPersonalizingAI ? 'AI Generálás...' : 'AI Szöveg Frissítése'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Immediate Send Result Banner (Section 4) */}
        {sendFeedback && (
          <div
            className={`mx-4 mt-3 p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
              sendFeedback.success
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {sendFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-sm">{sendFeedback.title}</div>
                {sendFeedback.detail && (
                  <div className="text-[11px] opacity-90 mt-0.5">{sendFeedback.detail}</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSendFeedback(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Metadata Summary Bar */}
        <div className="p-4 bg-black/50 border-b border-white/10 space-y-3 text-xs">
          {/* Dynamic Request Data Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-2.5 rounded-xl bg-indigo-950/25 border border-indigo-500/20">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Ügyfél:</span>
              <span className="font-bold text-white truncate block">{dynamicContext.customerName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Projekt:</span>
              <span className="font-bold text-white truncate block" title={dynamicContext.projectName}>
                {dynamicContext.projectName}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Kategória:</span>
              <span className="font-bold text-indigo-200 truncate block" title={dynamicContext.projectCategory}>
                {dynamicContext.projectCategory}
              </span>
              {dynamicContext.gameType && (
                <span className="text-[10px] text-purple-300 truncate block">
                  {dynamicContext.gameType} {dynamicContext.platform ? `• ${dynamicContext.platform}` : ''}
                </span>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Azonosító:</span>
              <span className="font-mono font-bold text-cyan-300 block">{dynamicContext.requestId}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Aktuális státusz:</span>
              <div className="mt-0.5">
                <StatusBadge status={dynamicContext.publicStatus} size="sm" />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Használt sablon:</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelectChange(e.target.value)}
                className="mt-0.5 w-full bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-indigo-200 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id} className="bg-slate-900 text-white">
                    {tpl.icon} {tpl.name} ({tpl.targetStatus})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recipient & Subject Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            <div className="md:col-span-5 flex items-center gap-2">
              <span className="text-slate-400 font-semibold w-16 shrink-0">Címzett:</span>
              <div className="flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 min-w-0">
                <div className="truncate">
                  <span className="text-white font-semibold">{request.name}</span>
                  <span className="text-slate-400 ml-1.5 font-mono text-[11px]">&lt;{request.email}&gt;</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyRawString(request.email, setCopiedRecipient, false)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedRecipient ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">✓ Kimásolva</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Cím</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="md:col-span-7 flex items-center gap-2">
              <span className="text-slate-400 font-semibold w-14 shrink-0">Tárgy:</span>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => copyRawString(subject, setCopiedSubject, true)}
                  className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedSubject ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">✓ Kimásolva</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>📋 Tárgy másolása</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Előnézet (Ügyfél nézet)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'html'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>HTML (Generált forráskód)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('customize')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'customize'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Szöveg & AI Testreszabás</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={includeAiBlock}
                onChange={(e) => setIncludeAiBlock(e.target.checked)}
                className="rounded border-white/20 bg-black/50 text-indigo-600 focus:ring-indigo-500"
              />
              <span>AI projektbecslés blokk megjelenítése</span>
            </label>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: RENDERED HTML PREVIEW */}
          <div
            className={
              activeTab === 'preview'
                ? 'block'
                : 'fixed -left-[9999px] top-0 w-[680px] opacity-0 pointer-events-none'
            }
          >
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
              <span>
                💡 Az alábbi előnézet pontosan úgy jelenik meg, ahogy <strong>{request.name}</strong> látni fogja a levelezőjében:
              </span>
              {dynamicContext.publicStatusMessage && (
                <span className="text-indigo-300 truncate max-w-md">
                  Státusz üzenet: „{dynamicContext.publicStatusMessage}”
                </span>
              )}
            </div>

            <div className="rounded-2xl p-2 sm:p-4 bg-[#05070b] border border-white/10 overflow-x-auto shadow-inner">
              <div
                ref={richPreviewRef}
                dangerouslySetInnerHTML={{ __html: generatedHtml }}
              />
            </div>
          </div>

          {/* TAB 2: RAW HTML SOURCE CODE */}
          {activeTab === 'html' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Generált, inline CSS-sel ellátott, Gmail és Outlook kompatibilis HTML e-mail forráskód:
                </span>
                <button
                  type="button"
                  onClick={() => copyRawString(generatedHtml, setCopiedHtmlCode, true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedHtmlCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">✓ Kimásolva</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>📋 HTML másolása</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                rows={18}
                value={generatedHtml}
                className="w-full p-4 rounded-xl bg-black/70 border border-white/10 text-cyan-300 font-mono text-xs leading-relaxed focus:outline-none"
              />
            </div>
          )}

          {/* TAB 3: CUSTOMIZE & AI PERSONALIZE */}
          {activeTab === 'customize' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/50 to-purple-950/40 border border-indigo-500/30 space-y-2.5">
                <label className="block text-indigo-200 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Személyre Szabás az adott projekthez ({request.projectName})</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customAiInstruction}
                    onChange={(e) => setCustomAiInstruction(e.target.value)}
                    placeholder="Opcionális instrukció az AI-nak (pl. Hangsúlyozd a mobilbarát kialakítást és kérj időpontot jövő keddre)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAiPersonalize}
                    disabled={isPersonalizingAI}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isPersonalizingAI ? 'Generálás...' : 'AI Újrafogalmazás'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Bevezető szöveg & Megszólítás</label>
                  <textarea
                    rows={3}
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Következő lépések blokk</label>
                  <textarea
                    rows={3}
                    value={nextStepsText}
                    onChange={(e) => setNextStepsText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Fő e-mail tartalom</label>
                <textarea
                  rows={5}
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">CTA Gomb Szövege</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">CTA Link</label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Lábléc (Footer)</label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar: Direct Gmail API Send + 4 Copy Buttons */}
        <div className="p-4 border-t border-white/10 bg-[#07090e] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* PRIMARY GMAIL API SEND BUTTON (Section 6: Kézi küldés) */}
              <button
                type="button"
                onClick={() => setShowSendConfirmModal(true)}
                disabled={isSendingGmail}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingGmail
                    ? 'Küldés folyamatban...'
                    : '📧 E-mail küldése a státuszról (Gmail)'}
                </span>
              </button>

              {/* 1. Teljes e-mail másolása */}
              <button
                type="button"
                onClick={handleCopyFullStyledEmail}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/35 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedFullEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>✓ Kimásolva</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>📋 Teljes e-mail másolása</span>
                  </>
                )}
              </button>

              {/* 2. HTML másolása */}
              <button
                type="button"
                onClick={() => copyRawString(generatedHtml, setCopiedHtmlCode, true)}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedHtmlCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">✓ Kimásolva</span>
                  </>
                ) : (
                  <>
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>📋 HTML másolása</span>
                  </>
                )}
              </button>

              {/* 3. Szöveg másolása */}
              <button
                type="button"
                onClick={() => copyRawString(generatedPlainText, setCopiedPlainText, true)}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedPlainText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">✓ Kimásolva</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-indigo-300" />
                    <span>📋 Szöveg másolása</span>
                  </>
                )}
              </button>

              {/* 4. Tárgy másolása */}
              <button
                type="button"
                onClick={() => copyRawString(subject, setCopiedSubject, true)}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSubject ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">✓ Kimásolva</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-purple-300" />
                    <span>📋 Tárgy másolása</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Bezárás
            </button>
          </div>

          {/* Gmail Connection Status & History Strip */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              {gmailStatus.state === 'connected' && gmailStatus.email ? (
                <span className="text-emerald-300 font-semibold">
                  ✓ Gmail csatlakoztatva • Feladó: <strong className="font-mono">{gmailStatus.email}</strong>
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-amber-300">
                    Gmail nincs csatlakoztatva (kézi másolás elérhető, vagy csatlakoztasd a Gmailt):
                  </span>
                  <button
                    type="button"
                    onClick={handleConnectGmailInline}
                    disabled={isConnectingGmailInline}
                    className="px-2.5 py-1 rounded-lg bg-white text-slate-900 font-bold text-[11px] hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {isConnectingGmailInline ? 'Kapcsolódás...' : 'Kapcsolódás Gmailhez'}
                  </button>
                  <Link
                    to="/admin/beallitasok"
                    className="text-indigo-400 hover:underline"
                  >
                    Beállítások →
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span>E-mail előzmény állapota:</span>
              {(['Előkészítve', 'Elküldve', 'Sikertelen'] as EmailHistoryStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleDeliveryStatusChange(st)}
                  className={`px-2.5 py-1 rounded-md font-semibold border transition-colors cursor-pointer ${
                    recordedStatus === st && historyRecordedId
                      ? st === 'Elküldve'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : st === 'Sikertelen'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Confirmation Dialog before sending email via Gmail API */}
      {showSendConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl border border-emerald-500/40 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">E-mail küldésének megerősítése</h4>
                <p className="text-xs text-slate-400">
                  Az üzenet a csatlakoztatott Gmail-fiókon keresztül kerül kiküldésre.
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
                <strong className="text-white">{request.name}</strong>{' '}
                <span className="font-mono text-indigo-300">&lt;{request.email}&gt;</span>
              </div>
              <div>
                <span className="text-slate-500">Státusz & Sablon:</span>{' '}
                <strong className="text-white">
                  {getStatusEmoji(effectiveStatus)} {effectiveStatus}
                </strong>{' '}
                ({currentTemplate?.name})
              </div>
              <div>
                <span className="text-slate-500">Tárgy:</span>{' '}
                <strong className="text-indigo-200">{subject}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSendConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleConfirmSendViaGmail}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Megerősítés és E-mail Küldése</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
