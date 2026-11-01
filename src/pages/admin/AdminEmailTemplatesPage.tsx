import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Sparkles,
  Plus,
  Search,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Check,
  Power,
  Star,
  Code2,
  FileText,
  Sliders,
  X,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { EmailTemplate, RequestStatus, StatusTemplateMap, ProjectRequest } from '../../types';
import {
  emailTemplateService,
  requestService,
  buildEmailDynamicContext,
  generateContextualEmailFields,
  buildStudioHtmlEmail,
  buildPlainTextEmail,
  generateAiEmailTemplateWithStudioAI,
  getStatusEmoji,
  AVAILABLE_EMAIL_VARIABLES
} from '../../services/storage';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmailTemplateEditModal } from '../../components/admin/EmailTemplateEditModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

const ALL_STATUSES: RequestStatus[] = [
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

const AI_DESIGNER_PRESETS: { label: string; status: RequestStatus; prompt: string }[] = [
  {
    label: '🌐 Webprojekt feldolgozás',
    status: 'Átnézés alatt',
    prompt: 'Készíts egy professzionális e-mailt arról, hogy a weboldal projekted feldolgozás alatt van.'
  },
  {
    label: '🎮 Játékprojekt visszaigazolás',
    status: 'Új',
    prompt: 'Készíts egy lelkesítő, professzionális e-mailt arról, hogy a játékprojekt ajánlatkérésedet megkaptuk ({{gameName}}, {{gameType}}, {{platform}}).'
  },
  {
    label: '🤖 AI projekt áttekintés',
    status: 'Átnézés alatt',
    prompt: 'Készíts egy szakmai e-mailt arról, hogy az AI projekted részleteit áttekintjük.'
  },
  {
    label: 'Fejlesztés mérföldkő',
    status: 'Folyamatban',
    prompt: 'Készíts egy lelkesítő státuszértesítő e-mailt arról, hogy a projekt ({{projectCategory}}) fejlesztése jól halad.'
  },
  {
    label: 'Projekt sikeres átadása',
    status: 'Elkészült',
    prompt: 'Készíts egy ünnepélyes, professzionális e-mailt arról, hogy a projekt elkészült, tesztelve lett és átadásra kész.'
  }
];

export const AdminEmailTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(emailTemplateService.getAll());
  const [statusMap, setStatusMap] = useState<StatusTemplateMap>(emailTemplateService.getStatusMap());
  const [requests, setRequests] = useState<ProjectRequest[]>(requestService.getAll());

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showMappingSection, setShowMappingSection] = useState(true);

  // Edit / Create Modal state
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Preview Modal state
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewTab, setPreviewTab] = useState<'preview' | 'html'>('preview');
  const [previewSampleReqId, setPreviewSampleReqId] = useState<string>('');
  const previewDomRef = useRef<HTMLDivElement>(null);

  // Copy states in Preview Modal
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  // AI Email Designer Modal state (Section 9: ✨ AI e-mail tervező)
  const [isAiDesignerOpen, setIsAiDesignerOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(
    'Készíts egy professzionális e-mailt arról, hogy az ajánlatkérés feldolgozása megkezdődött.'
  );
  const [aiTargetStatus, setAiTargetStatus] = useState<RequestStatus>('Átnézés alatt');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedDraft, setAiGeneratedDraft] = useState<Omit<
    EmailTemplate,
    'id' | 'active' | 'isDefault' | 'createdAt' | 'updatedAt'
  > | null>(null);
  const [aiDesignerView, setAiDesignerView] = useState<'preview' | 'html'>('preview');

  // Delete Confirmation state
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const reload = () => {
    setTemplates(emailTemplateService.getAll());
    setStatusMap(emailTemplateService.getStatusMap());
    setRequests(requestService.getAll());
  };

  useEffect(() => {
    window.addEventListener('store_hl_studio_email_templates', reload);
    window.addEventListener('store_hl_studio_status_template_map', reload);
    return () => {
      window.removeEventListener('store_hl_studio_email_templates', reload);
      window.removeEventListener('store_hl_studio_status_template_map', reload);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const filteredTemplates = templates.filter((t) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.targetStatus.toLowerCase().includes(q) ||
      t.bodyContent.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || t.targetStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveTemplate = (
    tplData: Partial<EmailTemplate> & { name: string; targetStatus: RequestStatus }
  ) => {
    emailTemplateService.save(tplData);
    reload();
    showToast('E-mail sablon sikeresen elmentve!');
  };

  const handleDuplicate = (id: string) => {
    const copy = emailTemplateService.duplicate(id);
    if (copy) {
      reload();
      showToast(`Sablon duplikálva: „${copy.name}”`);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = emailTemplateService.toggleActive(id);
    if (updated) {
      reload();
      showToast(
        `„${updated.name}” állapota: ${updated.active ? 'Aktív' : 'Inaktív'}`
      );
    }
  };

  const handleSetDefault = (id: string) => {
    const updated = emailTemplateService.setAsDefault(id);
    if (updated) {
      reload();
      showToast(`„${updated.name}” beállítva alapértelmezettként (${updated.targetStatus})!`);
    }
  };

  const handleStatusMapChange = (status: RequestStatus, templateId: string) => {
    emailTemplateService.assignTemplateToStatus(status, templateId);
    reload();
    showToast(`A(z) „${status}” státuszhoz tartozó sablon frissítve!`);
  };

  const handleRunAiDesigner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const result = await generateAiEmailTemplateWithStudioAI(aiPrompt, aiTargetStatus);
      setAiGeneratedDraft(result);
    } catch (err) {
      console.error('AI email designer error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveAiDraftAsTemplate = (setAsStatusDefault: boolean) => {
    if (!aiGeneratedDraft) return;
    const saved = emailTemplateService.save({
      ...aiGeneratedDraft,
      active: true,
      isDefault: setAsStatusDefault
    });
    reload();
    setIsAiDesignerOpen(false);
    setAiGeneratedDraft(null);
    showToast(`AI által tervezett sablon („${saved.name}”) elmentve!`);
  };

  // Helper for copying in Preview Modal
  const copyStringWithFeedback = async (val: string, setFlag: (v: boolean) => void) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(val);
      } else {
        const ta = document.createElement('textarea');
        ta.value = val;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {
      const ta = document.createElement('textarea');
      ta.value = val;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setFlag(true);
    setTimeout(() => setFlag(false), 2500);
  };

  const handleCopyFullFromPreview = async (htmlStr: string, plainStr: string) => {
    let copied = false;
    if (previewDomRef.current) {
      try {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          const range = document.createRange();
          range.selectNodeContents(previewDomRef.current);
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
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlStr], { type: 'text/html' }),
            'text/plain': new Blob([plainStr], { type: 'text/plain' })
          })
        ]);
        copied = true;
      }
    } catch {
      // ignore
    }
    if (!copied) {
      await copyStringWithFeedback(plainStr, setCopiedFull);
      return;
    }
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2500);
  };

  // Build preview data if previewTemplate is open
  const sampleReqForPreview =
    requests.find((r) => r.id === previewSampleReqId) || requests[0] || null;

  const previewContext = previewTemplate
    ? buildEmailDynamicContext(sampleReqForPreview, previewTemplate.targetStatus)
    : null;

  const previewFields =
    previewTemplate && previewContext
      ? generateContextualEmailFields(previewTemplate, previewContext)
      : null;

  const previewHtml =
    previewTemplate && previewContext && previewFields
      ? buildStudioHtmlEmail({
          ...previewFields,
          icon: previewTemplate.icon,
          accentColor: previewTemplate.accentColor,
          context: previewContext
        })
      : '';

  const previewPlainText =
    previewTemplate && previewContext && previewFields
      ? buildPlainTextEmail({
          ...previewFields,
          icon: previewTemplate.icon,
          context: previewContext
        })
      : '';

  // Build AI designer preview if aiGeneratedDraft exists
  const aiSampleContext = buildEmailDynamicContext(
    requests[0] || null,
    aiGeneratedDraft?.targetStatus || aiTargetStatus
  );
  const aiPreviewFields = aiGeneratedDraft
    ? generateContextualEmailFields(
        {
          ...aiGeneratedDraft,
          id: 'ai-preview',
          active: true,
          isDefault: false,
          createdAt: '',
          updatedAt: ''
        },
        aiSampleContext
      )
    : null;
  const aiPreviewHtml =
    aiGeneratedDraft && aiPreviewFields
      ? buildStudioHtmlEmail({
          ...aiPreviewFields,
          icon: aiGeneratedDraft.icon,
          accentColor: aiGeneratedDraft.accentColor,
          context: aiSampleContext
        })
      : '';

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <span>E-mail sablonok & Státuszértesítések</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Horvát László – Web & Project Studio egységes HTML e-mail sablonok, AI tervező és státuszonkénti hozzárendelés ({templates.length} sablon).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAiDesignerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>✨ AI e-mail tervező</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTemplate(null);
              setIsEditModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Új sablon létrehozása</span>
          </button>
        </div>
      </div>

      {/* Section 11: STÁTUSZONKÉNTI SABLONHOZZÁRENDELÉS */}
      <div className="glass-panel rounded-2xl border border-indigo-500/25 overflow-hidden shadow-xl">
        <div
          onClick={() => setShowMappingSection(!showMappingSection)}
          className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/30 border-b border-white/5 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-white">
                Státuszonkénti sablonhozzárendelés
              </h2>
              <p className="text-[11px] text-slate-400">
                Válaszd ki, hogy az egyes ajánlatkérési státuszokhoz melyik e-mail sablon töltődjön be automatikusan.
              </p>
            </div>
          </div>

          <span className="text-xs text-indigo-300 font-semibold">
            {showMappingSection ? 'Elrejtés ▲' : 'Megnyitás ▼'}
          </span>
        </div>

        {showMappingSection && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-black/20">
            {ALL_STATUSES.map((st) => {
              const assignedId = statusMap[st] || '';
              return (
                <div
                  key={st}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{getStatusEmoji(st)}</span>
                      <span>{st}</span>
                    </span>
                  </div>

                  <select
                    value={assignedId}
                    onChange={(e) => handleStatusMapChange(st, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-indigo-500/30 text-indigo-200 text-[11px] font-medium focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id} className="bg-slate-900 text-white">
                        {tpl.icon} {tpl.name} {!tpl.active ? '(Inaktív)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search & Status Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Keresés sablon neve, tárgya vagy tartalma alapján..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 text-[11px]">Státusz szűrő:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Összes státusz ({templates.length})</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st} className="bg-slate-900">
                  {getStatusEmoji(st)} {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((tpl) => {
          const isMappedDefault = statusMap[tpl.targetStatus] === tpl.id;

          return (
            <div
              key={tpl.id}
              className={`glass-panel rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                tpl.active
                  ? isMappedDefault
                    ? 'border-indigo-500/40 shadow-lg shadow-indigo-950/20'
                    : 'border-white/10'
                  : 'border-white/5 opacity-60'
              }`}
            >
              <div className="space-y-3">
                {/* Top badges & status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-lg">
                      {tpl.icon || getStatusEmoji(tpl.targetStatus)}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                        <span>{tpl.name}</span>
                        {tpl.isAiGenerated && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold">
                            ✨ AI
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={tpl.targetStatus} size="sm" />
                        {isMappedDefault && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            <span>Alapértelmezett</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      tpl.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}
                  >
                    {tpl.active ? 'Aktív' : 'Inaktív'}
                  </span>
                </div>

                {/* Subject & snippet */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                      E-mail tárgya:
                    </span>
                    <span className="text-indigo-200 font-semibold block truncate" title={tpl.subject}>
                      {tpl.subject}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                      Tartalom előnézet:
                    </span>
                    <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                      {tpl.bodyContent}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Bar (Section 10: Szerkesztés, Előnézet, Duplikálás, Aktiválás/kikapcsolás, Alapértelmezettként beállítás, Törlés) */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewTemplate(tpl);
                      setPreviewTab('preview');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Előnézet & HTML kód"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Előnézet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(tpl);
                      setIsEditModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Sablon szerkesztése"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Szerkesztés</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(tpl.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Sablon duplikálása"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplikálás</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isMappedDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(tpl.id)}
                      className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 transition-colors cursor-pointer"
                      title="Beállítás alapértelmezettként ehhez a státuszhoz"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleActive(tpl.id)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      tpl.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                    title={tpl.active ? 'Sablon kikapcsolása' : 'Sablon aktiválása'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingTemplate(tpl)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Sablon törlése"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= TEMPLATE PREVIEW & HTML COPY MODAL (Sections 6 & 7) ================= */}
      {previewTemplate && previewContext && previewFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel rounded-2xl border border-indigo-500/30 w-full max-w-4xl my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <span>{previewTemplate.icon}</span>
                  <span>Sablon előnézet: {previewTemplate.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tárgy: <strong className="text-indigo-200">{previewFields.subject}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {requests.length > 0 && (
                  <select
                    value={previewSampleReqId || requests[0].id}
                    onChange={(e) => setPreviewSampleReqId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-slate-200"
                    title="Teszt ajánlatkérés kiválasztása a dinamikus adatokhoz"
                  >
                    {requests.map((r) => (
                      <option key={r.id} value={r.id}>
                        Minta adat: {r.name} – {r.projectName} ({r.requestId})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    previewTab === 'preview' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Előnézet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('html')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    previewTab === 'html' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div
                className={
                  previewTab === 'preview'
                    ? 'block'
                    : 'fixed -left-[9999px] top-0 w-[680px] opacity-0 pointer-events-none'
                }
              >
                <div className="rounded-2xl p-3 bg-[#05070b] border border-white/10 overflow-x-auto">
                  <div ref={previewDomRef} dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>

              {previewTab === 'html' && (
                <textarea
                  readOnly
                  rows={18}
                  value={previewHtml}
                  className="w-full p-4 rounded-xl bg-black/70 border border-white/10 text-cyan-300 font-mono text-xs leading-relaxed focus:outline-none"
                />
              )}
            </div>

            {/* 4 Copy Buttons */}
            <div className="p-4 border-t border-white/10 bg-[#07090e] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyFullFromPreview(previewHtml, previewPlainText)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedFull ? (
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

                <button
                  type="button"
                  onClick={() => copyStringWithFeedback(previewHtml, setCopiedHtml)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedHtml ? (
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

                <button
                  type="button"
                  onClick={() => copyStringWithFeedback(previewPlainText, setCopiedText)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedText ? (
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

                <button
                  type="button"
                  onClick={() => copyStringWithFeedback(previewFields.subject, setCopiedSubject)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
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
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ✨ AI E-MAIL TERVEZŐ MODAL (Section 9) ================= */}
      {isAiDesignerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel rounded-2xl border border-purple-500/40 w-full max-w-4xl my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-white">
                    ✨ AI E-mail Tervező – Web & Project Studio
                  </h3>
                  <p className="text-xs text-slate-300">
                    Írd le magyarul, milyen e-mailt szeretnél, és az AI megtervezi a tárgyat, a szöveget, a CTA-t és a HTML struktúrát.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiDesignerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              <form onSubmit={handleRunAiDesigner} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Instrukció az AI számára:
                    </label>
                    <textarea
                      rows={2}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Pl.: Készíts egy professzionális e-mailt arról, hogy az ajánlatkérés feldolgozása megkezdődött."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-4 flex flex-col justify-between">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">
                        Célzott státusz:
                      </label>
                      <select
                        value={aiTargetStatus}
                        onChange={(e) => setAiTargetStatus(e.target.value as RequestStatus)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-purple-500"
                      >
                        {ALL_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {getStatusEmoji(st)} {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isAiGenerating}
                      className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
                      <span>{isAiGenerating ? 'AI Sablon Generálása...' : 'AI Sablon Generálása'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Example Prompts */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Gyors példák:</span>
                  {AI_DESIGNER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiPrompt(preset.prompt);
                        setAiTargetStatus(preset.status);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-200 text-[11px] transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </form>

              {/* Generated Result Preview */}
              {aiGeneratedDraft && aiPreviewFields && (
                <div className="space-y-4 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-purple-300 block">
                        Generált sablon: {aiGeneratedDraft.name}
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        Tárgy: {aiGeneratedDraft.subject}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Előnézeti szöveg: {aiGeneratedDraft.preheader}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAiDesignerView('preview')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          aiDesignerView === 'preview' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        Előnézet
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiDesignerView('html')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          aiDesignerView === 'html' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        HTML struktúra
                      </button>
                    </div>
                  </div>

                  {aiDesignerView === 'preview' ? (
                    <div className="rounded-2xl p-3 bg-[#05070b] border border-white/10 overflow-x-auto">
                      <div dangerouslySetInnerHTML={{ __html: aiPreviewHtml }} />
                    </div>
                  ) : (
                    <textarea
                      readOnly
                      rows={14}
                      value={aiPreviewHtml}
                      className="w-full p-4 rounded-xl bg-black/70 border border-white/10 text-cyan-300 font-mono text-xs"
                    />
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveAiDraftAsTemplate(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Mentés a sablonok közé
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAiDraftAsTemplate(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mentés és beállítás alapértelmezettként ({aiGeneratedDraft.targetStatus})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <EmailTemplateEditModal
        template={editingTemplate}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTemplate}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingTemplate}
        title="E-mail sablon törlése"
        message="Biztosan törölni szeretnéd ezt az e-mail sablont?"
        itemName={deletingTemplate?.name}
        onConfirm={() => {
          if (deletingTemplate) {
            emailTemplateService.delete(deletingTemplate.id);
            setDeletingTemplate(null);
            reload();
            showToast('Sablon törölve.');
          }
        }}
        onCancel={() => setDeletingTemplate(null)}
      />
    </div>
  );
};
