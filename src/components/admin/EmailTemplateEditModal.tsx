import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Eye,
  Sliders,
  Code2,
  Sparkles,
  Check,
  Copy
} from 'lucide-react';
import { EmailTemplate, RequestStatus } from '../../types';
import {
  AVAILABLE_EMAIL_VARIABLES,
  buildEmailDynamicContext,
  generateContextualEmailFields,
  buildStudioHtmlEmail,
  getStatusEmoji
} from '../../services/storage';

interface EmailTemplateEditModalProps {
  template: EmailTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tplData: Partial<EmailTemplate> & { name: string; targetStatus: RequestStatus }) => void;
}

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

const ACCENT_COLORS: { value: NonNullable<EmailTemplate['accentColor']>; label: string; dot: string }[] = [
  { value: 'indigo', label: 'Indigó / Kék', dot: 'bg-indigo-500' },
  { value: 'cyan', label: 'Cián / Türkiz', dot: 'bg-cyan-400' },
  { value: 'purple', label: 'Lila / Violet', dot: 'bg-purple-500' },
  { value: 'emerald', label: 'Smaragd / Zöld', dot: 'bg-emerald-500' },
  { value: 'amber', label: 'Borostyán / Sárga', dot: 'bg-amber-400' },
  { value: 'rose', label: 'Rózsa / Piros', dot: 'bg-rose-500' },
  { value: 'slate', label: 'Palaszürke', dot: 'bg-slate-400' }
];

const PRESET_ICONS = ['🆕', '👀', '💬', '💰', '✅', '🔨', '🧪', '🎉', '📁', '❌', '✉️', '🚀', '✨'];

export const EmailTemplateEditModal: React.FC<EmailTemplateEditModalProps> = ({
  template,
  isOpen,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'html'>('edit');
  const [activeField, setActiveField] = useState<'subject' | 'introText' | 'bodyContent' | 'nextStepsText' | 'ctaLink'>('bodyContent');
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [targetStatus, setTargetStatus] = useState<RequestStatus>('Átnézés alatt');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [introText, setIntroText] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [nextStepsText, setNextStepsText] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [footerText, setFooterText] = useState('');
  const [icon, setIcon] = useState('👀');
  const [accentColor, setAccentColor] = useState<NonNullable<EmailTemplate['accentColor']>>('indigo');
  const [active, setActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('edit');
    setErrorMsg('');

    if (template) {
      setName(template.name);
      setTargetStatus(template.targetStatus);
      setSubject(template.subject);
      setPreheader(template.preheader || '');
      setIntroText(template.introText);
      setBodyContent(template.bodyContent);
      setNextStepsText(template.nextStepsText || '');
      setCtaText(template.ctaText);
      setCtaLink(template.ctaLink);
      setFooterText(template.footerText);
      setIcon(template.icon || getStatusEmoji(template.targetStatus));
      setAccentColor(template.accentColor || 'indigo');
      setActive(template.active);
      setIsDefault(template.isDefault);
    } else {
      setName('');
      setTargetStatus('Átnézés alatt');
      setSubject('Státuszfrissítés az ajánlatkérésedről – {{projectName}} ({{requestId}})');
      setPreheader('Fontos tájékoztatás a(z) {{projectName}} ajánlatkérésed állapotáról.');
      setIntroText(
        'Kedves {{customerName}}!\n\nKöszönöm a megkeresésedet! Szeretnélek tájékoztatni a(z) „{{projectName}}” ajánlatkérésed aktuális állapotáról.'
      );
      setBodyContent(
        'Az ajánlatkérésed feldolgozása folyamatban van.\n\nAjánlatkérés azonosító: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz üzenet: {{publicStatusMessage}}'
      );
      setNextStepsText(
        '1. Részletek szakmai áttekintése\n2. Visszajelzés e-mailben\n3. Következő mérföldkő egyeztetése'
      );
      setCtaText('Ajánlatkérés státuszának megtekintése');
      setCtaLink('{{websiteUrl}}/ajanlat-statusz?id={{requestId}}');
      setFooterText(
        'Horvát László – Web & Project Studio • Egyedi weboldalak, webalkalmazások és szoftverprojektek.'
      );
      setIcon('👀');
      setAccentColor('indigo');
      setActive(true);
      setIsDefault(false);
    }
  }, [isOpen, template]);

  if (!isOpen) return null;

  const insertVariable = (token: string) => {
    if (activeField === 'subject') {
      setSubject((prev) => `${prev} ${token}`);
    } else if (activeField === 'introText') {
      setIntroText((prev) => `${prev} ${token}`);
    } else if (activeField === 'nextStepsText') {
      setNextStepsText((prev) => `${prev} ${token}`);
    } else if (activeField === 'ctaLink') {
      setCtaLink((prev) => `${prev}${token}`);
    } else {
      setBodyContent((prev) => `${prev} ${token}`);
    }
    setCopiedVar(token);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Kérjük, add meg a sablon nevét.');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Kérjük, add meg az e-mail tárgyát.');
      return;
    }

    onSave({
      id: template?.id,
      name: name.trim(),
      targetStatus,
      subject: subject.trim(),
      preheader: preheader.trim(),
      introText: introText.trim(),
      bodyContent: bodyContent.trim(),
      nextStepsText: nextStepsText.trim(),
      ctaText: ctaText.trim(),
      ctaLink: ctaLink.trim(),
      footerText: footerText.trim(),
      icon,
      accentColor,
      active,
      isDefault,
      isAiGenerated: template?.isAiGenerated
    });
    onClose();
  };

  // Sample preview context
  const sampleContext = buildEmailDynamicContext(
    {
      name: 'Kovács Péter',
      projectName: 'SmartLogistics Portál',
      requestId: 'HL-7K4P-92XM',
      projectType: 'Webalkalmazás',
      status: targetStatus,
      publicStatus: targetStatus,
      publicStatusMessage:
        'Az ajánlatkérésedet jelenleg átnézem. Hamarosan e-mailben felveszem veled a kapcsolatot.',
      promotionTitle: 'Ingyenes weboldal készítés'
    },
    targetStatus
  );

  const previewDraft = generateContextualEmailFields(
    {
      id: template?.id || 'preview',
      name: name || 'Előnézeti sablon',
      targetStatus,
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
      active,
      isDefault,
      createdAt: '',
      updatedAt: ''
    },
    sampleContext
  );

  const previewHtml = buildStudioHtmlEmail({
    ...previewDraft,
    icon,
    accentColor,
    context: sampleContext
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel rounded-2xl border border-white/10 w-full max-w-4xl my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/50">
          <div>
            <h3 className="text-lg font-bold font-display text-white">
              {template ? `E-mail sablon szerkesztése: ${template.name}` : 'Új e-mail sablon létrehozása'}
            </h3>
            <p className="text-xs text-slate-400">
              Állítsd be a tárgyat, a dinamikus változókat, a CTA gombot és az egységes stúdió láblécet.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'edit' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Szerkesztés</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Előnézet</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'html' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>HTML</span>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {activeTab === 'edit' && (
            <>
              {/* Dynamic Variables Bar */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-200 uppercase tracking-wider text-[11px]">
                    Dinamikus változók beszúrása (kattints a beszúráshoz az aktív mezőbe):
                  </span>
                  <span className="text-[11px] text-indigo-300">
                    Aktív mező: <strong>{activeField}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_EMAIL_VARIABLES.map((v) => (
                    <button
                      key={v.token}
                      type="button"
                      onClick={() => insertVariable(v.token)}
                      className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 font-mono text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title={`${v.label} (Példa: ${v.example})`}
                    >
                      <span>{v.token}</span>
                      {copiedVar === v.token && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 1: Name, Status, Icon, Color */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-slate-300 font-semibold mb-1">Sablon neve *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Pl. Ajánlatkérés feldolgozás alatt"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-slate-300 font-semibold mb-1">Kapcsolódó státusz *</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => {
                      const st = e.target.value as RequestStatus;
                      setTargetStatus(st);
                      setIcon(getStatusEmoji(st));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {getStatusEmoji(st)} {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-300 font-semibold mb-1">Akcentusszín</label>
                  <select
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {ACCENT_COLORS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Icon Picker & Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-black/30 border border-white/5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-semibold mr-1">Státusz ikon:</span>
                  {PRESET_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all cursor-pointer ${
                        icon === emoji
                          ? 'bg-indigo-600/40 border border-indigo-400 scale-110'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="rounded border-white/20 bg-black/50 text-indigo-600"
                    />
                    <span className="font-semibold text-white">Aktív sablon</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-white/20 bg-black/50 text-indigo-600"
                    />
                    <span className="font-semibold text-indigo-300">Alapértelmezett ehhez a státuszhoz</span>
                  </label>
                </div>
              </div>

              {/* Subject & Preheader */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">E-mail tárgya *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onFocus={() => setActiveField('subject')}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Pl. Megkaptuk az ajánlatkérésed – {{projectName}}"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rövid előnézeti szöveg (Preheader)</label>
                  <input
                    type="text"
                    value={preheader}
                    onChange={(e) => setPreheader(e.target.value)}
                    placeholder="Rövid összefoglaló a levelezőlistában..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Intro Text */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Bevezető szöveg (Megszólítás & nyitó gondolat) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={introText}
                  onFocus={() => setActiveField('introText')}
                  onChange={(e) => setIntroText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Main Body Content */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Fő tartalom (Részletes tájékoztatás) *
                </label>
                <textarea
                  rows={5}
                  required
                  value={bodyContent}
                  onFocus={() => setActiveField('bodyContent')}
                  onChange={(e) => setBodyContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Next Steps */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Következő lépések / teendők blokk (opcionális)
                </label>
                <textarea
                  rows={3}
                  value={nextStepsText}
                  onFocus={() => setActiveField('nextStepsText')}
                  onChange={(e) => setNextStepsText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* CTA & Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CTA Gomb Szövege</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Pl. Státusz megtekintése"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CTA Link</label>
                  <input
                    type="text"
                    value={ctaLink}
                    onFocus={() => setActiveField('ctaLink')}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="{{websiteUrl}}/ajanlat-statusz?id={{requestId}}"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Footer szöveg</label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'preview' && (
            <div className="rounded-2xl p-3 bg-[#05070b] border border-white/10 overflow-x-auto">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          )}

          {activeTab === 'html' && (
            <textarea
              readOnly
              rows={18}
              value={previewHtml}
              className="w-full p-4 rounded-xl bg-black/70 border border-white/10 text-cyan-300 font-mono text-xs leading-relaxed focus:outline-none"
            />
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold uppercase tracking-wider cursor-pointer"
            >
              Mégse
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Sablon mentése</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
