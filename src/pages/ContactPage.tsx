import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Github, Linkedin, ArrowRight, Sparkles } from 'lucide-react';
import { ContactForm } from '../components/forms/ContactForm';
import { settingsService } from '../services/storage';

export const ContactPage: React.FC = () => {
  const [settings, setSettings] = React.useState(() => settingsService.get());

  React.useEffect(() => {
    const reload = () => setSettings(settingsService.get());
    window.addEventListener('store_hl_studio_settings', reload);
    window.addEventListener('hl_studio_remote_synced', reload);
    return () => {
      window.removeEventListener('store_hl_studio_settings', reload);
      window.removeEventListener('hl_studio_remote_synced', reload);
    };
  }, []);

  return (
    <div className="relative min-h-screen pt-14 sm:pt-20 lg:pt-24 pb-20">
      <div className="ambient-glow-indigo top-20 right-10" />
      <div className="ambient-glow-purple bottom-20 left-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Kapcsolatfelvétel
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Lépjünk Kapcsolatba
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
            Kérdésed van egy meglévő szoftverről, vagy szeretnél egyeztetni egy új weboldalról? Írj bátran!
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Details */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass-panel rounded-3xl p-8 border border-white/8 space-y-6">
              <div>
                <h3 className="text-2xl font-bold font-display text-white">
                  {settings.ownerName}
                </h3>
                <p className="text-xs text-indigo-400 font-medium mt-1">
                  {settings.ownerTitle}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Közvetlen E-mail</span>
                    <a href={`mailto:${settings.email}`} className="text-white hover:text-indigo-400 transition-colors font-medium">
                      {settings.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Székhely</span>
                    <span className="text-white font-medium">{settings.location}</span>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="pt-4 border-t border-white/5">
                <span className="text-xs text-slate-500 block mb-3 font-semibold uppercase tracking-wider">
                  Közösségi oldalak & Profilok
                </span>
                <div className="flex items-center gap-3">
                  {settings.socialLinks?.github && (
                    <a
                      href={settings.socialLinks.github}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      title="GitHub Profil"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {settings.socialLinks?.linkedin && (
                    <a
                      href={settings.socialLinks.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      title="LinkedIn Profil"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Project Request Highlight Box */}
            <div className="glass-panel rounded-3xl p-8 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 to-black space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Konkrét projektötleted van?</span>
              </div>
              <h4 className="text-lg font-bold font-display text-white">
                Részletes Projektigény-felmérő
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ha konkrét weboldal vagy szoftver fejlesztését tervezed, a dedikált űrlapon pontosan megadhatod a kívánt funkciókat, határidőt és költségkeretet is.
              </p>
              <Link
                to="/projekt-igeny"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md shadow-indigo-600/20"
              >
                <span>Projektet szeretnék</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right: Message Form - Clean Traditional Contact Form */}
          <div className="lg:col-span-7 space-y-4">
            <div className="mb-2">
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                Közvetlen Üzenet Küldése
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Töltsd ki az alábbi űrlapot az azonnali kapcsolatfelvételhez. Hamarosan válaszolok!
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
};
