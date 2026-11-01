import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  KeyRound,
  AlertCircle,
  Shield,
  Mail,
  RefreshCw,
  Unplug,
  CheckCircle2,
  XCircle,
  Send,
  Lock,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Code2
} from 'lucide-react';
import { settingsService, authService } from '../../services/storage';
import { gmailService, initAuth } from '../../services/gmailService';
import { uploadImageFile } from '../../services/imageUploadService';
import { SiteSettings, GmailStatusInfo } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(settingsService.get());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password change state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Gmail OAuth 2.0 Connection & Global Auto-Email State
  const [gmailStatus, setGmailStatus] = useState<GmailStatusInfo>(gmailService.getCachedStatus());
  const [globalAutoEmailEnabled, setGlobalAutoEmailEnabled] = useState<boolean>(
    gmailService.isGlobalAutoEmailEnabled()
  );
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [isTestingGmail, setIsTestingGmail] = useState(false);
  const [isDisconnectingGmail, setIsDisconnectingGmail] = useState(false);
  const [showSendTestEmailConfirm, setShowSendTestEmailConfirm] = useState(false);
  const [gmailFeedback, setGmailFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    detail?: string;
  } | null>(null);

  // Image Uploading States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [imageUploadFeedback, setImageUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setImageUploadFeedback(null);
    try {
      const result = await uploadImageFile(file, 'avatar');
      if (result.ok && result.url) {
        const updated = { ...settings, avatarUrl: result.url };
        setSettings(updated);
        settingsService.save(updated);
        setImageUploadFeedback({
          type: 'success',
          message: '✓ Profilkép sikeresen feltöltve a szerverre és elmentve! Bármilyen más gépről (iskola, mobil) nyitják meg az oldalt, garantáltan ez a kép jelenik meg.'
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setImageUploadFeedback({
          type: 'error',
          message: result.error || 'Nem sikerült feltölteni a profilképet a szerverre.'
        });
      }
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHero(true);
    setImageUploadFeedback(null);
    try {
      const result = await uploadImageFile(file, 'hero');
      if (result.ok && result.url) {
        const updated = { ...settings, heroImageUrl: result.url };
        setSettings(updated);
        settingsService.save(updated);
        setImageUploadFeedback({
          type: 'success',
          message: '✓ Főoldali hero stúdió kép sikeresen feltöltve a szerverre és elmentve! Minden eszközön ez fog megjelenni.'
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setImageUploadFeedback({
          type: 'error',
          message: result.error || 'Nem sikerült feltölteni a hero képet a szerverre.'
        });
      }
    } finally {
      setIsUploadingHero(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const unsubscribeAuth = initAuth();
    gmailService.fetchStatus().then((st) => setGmailStatus(st));

    const handleStatusEvent = (e: Event) => {
      const custom = e as CustomEvent<GmailStatusInfo>;
      if (custom.detail) {
        setGmailStatus(custom.detail);
      }
    };

    const handleGlobalAutoEvent = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setGlobalAutoEmailEnabled(!!custom.detail);
    };

    window.addEventListener('gmail_status_changed', handleStatusEvent);
    window.addEventListener('gmail_global_auto_changed', handleGlobalAutoEvent);
    return () => {
      unsubscribeAuth();
      window.removeEventListener('gmail_status_changed', handleStatusEvent);
      window.removeEventListener('gmail_global_auto_changed', handleGlobalAutoEvent);
    };
  }, []);

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    setGmailFeedback(null);
    try {
      const status = await gmailService.connect();
      setGmailStatus(status);
      if (status.state === 'connected' && status.email) {
        setGmailFeedback({
          type: 'success',
          title: '✓ Gmail csatlakoztatva',
          detail: `Feladó: ${status.email} • A Gmail API (gmail.send) küldési jogosultság sikeresen aktiválva.`
        });
      } else {
        setGmailFeedback({
          type: 'error',
          title: '✕ Gmail csatlakozási hiba',
          detail:
            status.errorMessage ||
            'Nem sikerült érvényesíteni a Gmail küldési jogosultságot.'
        });
      }
    } catch (err: any) {
      setGmailFeedback({
        type: 'error',
        title: '✕ Sikertelen Gmail csatlakozás',
        detail: err?.message || 'Hiba történt az OAuth 2.0 hitelesítés során.'
      });
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setIsDisconnectingGmail(true);
    setGmailFeedback(null);
    try {
      const status = await gmailService.disconnect();
      setGmailStatus(status);
      setGmailFeedback({
        type: 'info',
        title: 'Gmail kapcsolat bontva',
        detail: 'Az OAuth 2.0 munkamenet és a szerveroldali kapcsolat biztonságosan lezárva.'
      });
    } finally {
      setIsDisconnectingGmail(false);
    }
  };

  const handleTestGmailConnection = async (sendRealTestEmail = false) => {
    setShowSendTestEmailConfirm(false);
    setIsTestingGmail(true);
    setGmailFeedback(null);
    try {
      const res = await gmailService.testConnection(sendRealTestEmail);
      setGmailStatus(res.status);
      if (res.success) {
        setGmailFeedback({
          type: 'success',
          title: sendRealTestEmail
            ? '✓ Az e-mail sikeresen elküldve.'
            : '✓ A Gmail kapcsolat tesztelése sikeres.',
          detail: res.message
        });
      } else {
        setGmailFeedback({
          type: 'error',
          title: sendRealTestEmail
            ? '✕ Az e-mail küldése sikertelen.'
            : '✕ A Gmail kapcsolat tesztelése sikertelen.',
          detail: res.message
        });
      }
    } finally {
      setIsTestingGmail(false);
    }
  };

  const handleToggleGlobalAutoEmail = (nextVal: boolean) => {
    const saved = gmailService.setGlobalAutoEmailEnabled(nextVal);
    setGlobalAutoEmailEnabled(saved);
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.save(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    const res = authService.updatePassword(currentPwd, newPwd);
    if (res.success) {
      setPwdMsg({ success: true, text: res.message });
      setCurrentPwd('');
      setNewPwd('');
    } else {
      setPwdMsg({ success: false, text: res.message });
    }
  };

  const statusLabel =
    gmailStatus.state === 'connected'
      ? 'Csatlakoztatva'
      : gmailStatus.state === 'error'
      ? 'Hiba'
      : 'Nincs csatlakoztatva';

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Weboldal Beállításai</h1>
        <p className="text-xs text-slate-400 mt-1">
          Itt módosíthatod a Gmail OAuth 2.0 e-mail küldési kapcsolatot, a weboldal alapadatait és a biztonsági beállításokat.
        </p>
      </div>

      {/* ================= SECTION 1 & 7: GMAIL KAPCSOLAT (OAUTH 2.0 + GMAIL API) ================= */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-slate-900/90 to-black space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 shadow-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base font-bold font-display text-white uppercase tracking-wider">
                  Gmail kapcsolat
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    gmailStatus.state === 'connected'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : gmailStatus.state === 'error'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : 'bg-slate-800/80 text-slate-300 border-white/15'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      gmailStatus.state === 'connected'
                        ? 'bg-emerald-400 animate-pulse'
                        : gmailStatus.state === 'error'
                        ? 'bg-rose-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span>Kapcsolat állapota: {statusLabel}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Személyes <span className="text-slate-200 font-mono">@gmail.com</span> fiók biztonságos csatlakoztatása Google OAuth 2.0 és Gmail API (<span className="font-mono text-indigo-300">gmail.send</span>) segítségével, saját üzleti domain nélkül.
              </p>
            </div>
          </div>
        </div>

        {/* Connected / Disconnected / Error Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
              Aktuális Gmail Fiók & Állapot
            </span>

            {gmailStatus.state === 'connected' && gmailStatus.email ? (
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>✓ Gmail csatlakoztatva</span>
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  Feladó: <span className="font-mono font-bold text-white bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded">{gmailStatus.email}</span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  A Gmail API készen áll az ajánlatkérések státuszértesítő e-mailjeinek küldésére.
                </p>
              </div>
            ) : gmailStatus.state === 'error' ? (
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-400">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Hiba a Gmail kapcsolatban</span>
                </div>
                {gmailStatus.email && (
                  <div className="text-xs text-slate-300">
                    Fiók: <span className="font-mono">{gmailStatus.email}</span>
                  </div>
                )}
                <p className="text-xs text-rose-300 leading-relaxed">
                  {gmailStatus.errorMessage ||
                    'Az OAuth jogosultság lejárt vagy visszavonásra került. Kérjük, csatlakoztasd újra a Gmail-fiókot.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-sm font-semibold text-slate-300">
                  Nincs csatlakoztatva Gmail-fiók
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kattints a <strong>„Kapcsolódás Gmailhez”</strong> gombra, jelentkezz be a személyes Gmail-fiókoddal, és engedélyezd az e-mail küldést.
                </p>
              </div>
            )}
          </div>

          {/* Section 7: Global Automatic Status Emails Toggle */}
          <div className="p-4 rounded-xl bg-indigo-950/25 border border-indigo-500/30 flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-300 block">
                  Globális Beállítás
                </span>
                <h3 className="text-xs font-bold text-white mt-0.5">
                  Automatikus státusz-e-mailek engedélyezése
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Ha <strong>KI</strong> van kapcsolva, az egyes státuszváltozásoknál nem küld automatikusan e-mailt a rendszer. A kézi küldés ettől még bármikor működik.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={globalAutoEmailEnabled}
                onClick={() => handleToggleGlobalAutoEmail(!globalAutoEmailEnabled)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  globalAutoEmailEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                    : 'bg-black/60 text-slate-400 border-white/15 hover:text-white'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    globalAutoEmailEnabled ? 'bg-emerald-400' : 'bg-slate-500'
                  }`}
                />
                <span>{globalAutoEmailEnabled ? 'BE' : 'KI'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Alapértelmezett: <strong>KI</strong></span>
              <span className={globalAutoEmailEnabled ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                Jelenlegi állapot: <strong>{globalAutoEmailEnabled ? 'BEKAPCSOLVA' : 'KIKAPCSOLVA'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        {gmailFeedback && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              gmailFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : gmailFeedback.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
            }`}
          >
            {gmailFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-bold">{gmailFeedback.title}</div>
              {gmailFeedback.detail && (
                <div className="text-[11px] opacity-90">{gmailFeedback.detail}</div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* 1. Kapcsolódás Gmailhez (Official Google Sign-In Button style + Hungarian label) */}
          <button
            type="button"
            onClick={handleConnectGmail}
            disabled={isConnectingGmail}
            className="gsi-material-button px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-2.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="gsi-material-button-state" />
            <div className="gsi-material-button-content-wrapper flex items-center gap-2.5">
              <div className="gsi-material-button-icon w-4 h-4 shrink-0">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block', width: '16px', height: '16px' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </div>
              <span className="gsi-material-button-contents">
                {isConnectingGmail
                  ? 'Kapcsolódás folyamatban...'
                  : gmailStatus.state === 'connected'
                  ? 'Másik Gmail csatlakoztatása / Újrahitelesítés'
                  : 'Kapcsolódás Gmailhez'}
              </span>
              <span style={{ display: 'none' }}>Sign in with Google</span>
            </div>
          </button>

          {/* 2. Kapcsolat tesztelése */}
          <button
            type="button"
            onClick={() => handleTestGmailConnection(false)}
            disabled={isTestingGmail}
            className="px-4 py-2.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingGmail ? 'animate-spin' : ''}`} />
            <span>{isTestingGmail ? 'Tesztelés...' : 'Kapcsolat tesztelése'}</span>
          </button>

          {/* Optional: Send real test email to connected Gmail address (with confirmation dialog) */}
          {gmailStatus.state === 'connected' && gmailStatus.email && (
            <button
              type="button"
              onClick={() => setShowSendTestEmailConfirm(true)}
              disabled={isTestingGmail}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Teszt e-mail küldése saját címre</span>
            </button>
          )}

          {/* 3. Gmail kapcsolat bontása */}
          <button
            type="button"
            onClick={handleDisconnectGmail}
            disabled={isDisconnectingGmail || gmailStatus.state === 'disconnected'}
            className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Unplug className="w-3.5 h-3.5" />
            <span>
              {isDisconnectingGmail ? 'Bontás...' : 'Gmail kapcsolat bontása'}
            </span>
          </button>
        </div>

        {/* Security & Delivery Disclaimer */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Biztonság: Gmail-jelszó vagy OAuth token soha nem kerül tárolásra a böngésző localStorage-ban; a szerver AES-256-GCM titkosítással kezeli a munkamenetet.
            </span>
          </span>
        </div>
      </div>

      {/* Confirmation Modal for sending a real test email */}
      {showSendTestEmailConfirm && gmailStatus.email && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl border border-indigo-500/40 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Teszt e-mail küldésének megerősítése</h3>
                <p className="text-xs text-slate-400">Gmail API küldési művelet jóváhagyása</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs space-y-1.5 text-slate-300">
              <div>
                <span className="text-slate-500">Feladó és Címzett:</span>{' '}
                <strong className="text-white font-mono">{gmailStatus.email}</strong>
              </div>
              <div>
                <span className="text-slate-500">Tárgy:</span>{' '}
                <strong className="text-indigo-200">✓ Gmail API Kapcsolat Teszt – Horvát László Studio</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSendTestEmailConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={() => handleTestGmailConnection(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Megerősítés és Teszt E-mail Küldése</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>A beállítások sikeresen mentve!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSettingsSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/5 space-y-6">
        <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider pb-3 border-b border-white/5">
          1. Személyes adatok & Elérhetőségek
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tulajdonos Neve
            </label>
            <input
              type="text"
              required
              value={settings.ownerName}
              onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Szakmai Titulus
            </label>
            <input
              type="text"
              required
              value={settings.ownerTitle}
              onChange={(e) => setSettings({ ...settings, ownerTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Kapcsolattartási E-mail
            </label>
            <input
              type="email"
              required
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Telefonszám (opcionális)
            </label>
            <input
              type="text"
              value={settings.phone || ''}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Székhely / Város
            </label>
            <input
              type="text"
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Rövid Bemutatkozás
          </label>
          <textarea
            rows={3}
            value={settings.bio}
            onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>

        {/* Global Image Upload Feedback */}
        {imageUploadFeedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              imageUploadFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <span>{imageUploadFeedback.message}</span>
            <button
              type="button"
              onClick={() => setImageUploadFeedback(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Profilkép Kezelése (Bemutatkozó Portrékép) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Bemutatkozó Profilkép (Főoldali és Névjegy Portréfotó)
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingAvatar ? 'Feltöltés...' : 'Kép feltöltése gépről'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingAvatar}
                  className="hidden"
                  onChange={handleAvatarFileUpload}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  const defaultUrl = '/src/assets/images/horvat_laszlo_profile_1790358061257.jpg';
                  const updated = { ...settings, avatarUrl: defaultUrl };
                  setSettings(updated);
                  settingsService.save(updated);
                  setImageUploadFeedback({
                    type: 'success',
                    message: '✓ Alapértelmezett profilkép visszaállítva és elmentve a szerveren!'
                  });
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 3000);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Alapértelmezett profilkép visszaállítása"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Alapértelmezett profilkép</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 space-y-2">
              <input
                type="text"
                required
                value={settings.avatarUrl || ''}
                onChange={(e) => setSettings({ ...settings, avatarUrl: e.target.value })}
                placeholder="https://... vagy /uploads/... vagy /src/assets/images/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tölts fel saját fotót közvetlenül a gépedről, vagy adj meg egy kép URL-t. A feltöltött kép <strong className="text-indigo-300">közvetlenül a szerverre kerül mentésre</strong>, így az iskolai gépről, telefonról vagy más internetről látogatva is mindenhol ez a kép fog megjelenni!
              </p>
            </div>

            {/* Live Portrait Preview */}
            <div className="md:col-span-4 flex justify-center md:justify-end">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-xl bg-slate-900 group">
                <img
                  src={settings.avatarUrl || '/src/assets/images/horvat_laszlo_profile_1790358061257.jpg'}
                  alt="Profilkép előnézet"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = '/src/assets/images/horvat_laszlo_profile_1790358061257.jpg';
                    if (!target.src.endsWith(fallback)) {
                      target.src = fallback;
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-indigo-300">
                  Előnézet
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero & SEO */}
        <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider pt-4 pb-3 border-b border-white/5">
          2. Főoldali Hero Kép, Szövegek & SEO
        </h3>

        {/* Főoldali Hero Kép URL & Élő Előnézet */}
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Főoldali Hero Kép URL (Jobb oldali kiemelt stúdió kép)
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingHero ? 'Feltöltés...' : 'Kép feltöltése gépről'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingHero}
                  className="hidden"
                  onChange={handleHeroFileUpload}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  const defaultUrl = '/src/assets/images/hero_studio_workspace_1790449082794.jpg';
                  const updated = { ...settings, heroImageUrl: defaultUrl };
                  setSettings(updated);
                  settingsService.save(updated);
                  setImageUploadFeedback({
                    type: 'success',
                    message: '✓ Alapértelmezett stúdió kép visszaállítva és elmentve a szerveren!'
                  });
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 3000);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Alapértelmezett stúdió kép visszaállítása"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Alapértelmezett kép</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-7 space-y-2">
              <input
                type="text"
                required
                value={settings.heroImageUrl || ''}
                onChange={(e) => setSettings({ ...settings, heroImageUrl: e.target.value })}
                placeholder="https://... vagy /uploads/... vagy /src/assets/images/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tölts fel képet közvetlenül a gépedről, vagy adj meg egy kép URL-t. A feltöltött kép a szerveren tárolódik, így minden látogató számára megbízhatóan és tartósan elérhető marad.
              </p>
            </div>

            {/* Live Hero Card Mini Preview */}
            <div className="md:col-span-5">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-white/15 shadow-lg">
                <img
                  src={settings.heroImageUrl || '/src/assets/images/hero_studio_workspace_1790449082794.jpg'}
                  alt="Hero előnézet"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = '/src/assets/images/hero_studio_workspace_1790449082794.jpg';
                    if (!target.src.endsWith(fallback)) {
                      target.src = fallback;
                    }
                  }}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-black/20 to-transparent opacity-70" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2.5 rounded-lg glass-panel border border-white/15 backdrop-blur-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-white block">Web & Project Studio</span>
                      <span className="text-[9px] text-slate-300">Élő előnézet</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Elérhető
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Hero Fő Cím
          </label>
          <input
            type="text"
            required
            value={settings.heroHeading}
            onChange={(e) => setSettings({ ...settings, heroHeading: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Hero Alcím / Másodlagos Szöveg
          </label>
          <textarea
            rows={2}
            required
            value={settings.heroSubheading}
            onChange={(e) => setSettings({ ...settings, heroSubheading: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Weboldal SEO Title
            </label>
            <input
              type="text"
              value={settings.seoTitle}
              onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Weboldal SEO Meta Description
            </label>
            <input
              type="text"
              value={settings.seoDescription}
              onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Social Links */}
        <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider pt-4 pb-3 border-b border-white/5">
          3. Közösségi Média & Profilok
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">GitHub URL</label>
            <input
              type="url"
              value={settings.socialLinks?.github || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, github: e.target.value }
                })
              }
              placeholder="https://github.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={settings.socialLinks?.linkedin || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, linkedin: e.target.value }
                })
              }
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Beállítások Mentése</span>
          </button>
        </div>
      </form>

      {/* Admin Password Change Form */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider">
            Admin Jelszó Módosítása
          </h3>
        </div>

        {pwdMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              pwdMsg.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {pwdMsg.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{pwdMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Jelenlegi Jelszó
            </label>
            <input
              type="password"
              required
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="Alapértelmezett: admin2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Új Jelszó (legalább 6 karakter)
            </label>
            <input
              type="password"
              required
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Új titkos jelszó..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Jelszó frissítése</span>
          </button>
        </form>
      </div>
    </div>
  );
};
