import React from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Cpu,
  Layout,
  Terminal,
  Sparkles,
  ArrowRight,
  Mail,
  MapPin,
  CheckCircle2,
  Workflow
} from 'lucide-react';
import { settingsService } from '../services/storage';

export const AboutPage: React.FC = () => {
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

  const coreFields = [
    {
      title: 'Weboldalak',
      description: 'Modern, reszponzív, nagy felbontású felületek és bemutató oldalak gyors betöltéssel és tiszta kódstruktúrával.',
      icon: <Layout className="w-5 h-5 text-indigo-400" />
    },
    {
      title: 'Webalkalmazások',
      description: 'Komplex funkcionalitású felületek, adatkezelés, felhasználói hitelesítés és interaktív böngészős platformok.',
      icon: <Code2 className="w-5 h-5 text-sky-400" />
    },
    {
      title: 'Egyedi szoftverek',
      description: 'Asztali alkalmazások (Electron, WPF, C#), háttérszolgáltatások és speciális célfeladatokat ellátó eszközök.',
      icon: <Terminal className="w-5 h-5 text-emerald-400" />
    },
    {
      title: 'Projektfejlesztés',
      description: 'A kezdeti koncepciótól a drótvázakon és a megvalósításon át az éles indításig tartó teljes folyamat felügyelete.',
      icon: <Workflow className="w-5 h-5 text-amber-400" />
    },
    {
      title: 'Modern UI/UX',
      description: 'Letisztult tipográfia, funkcionális kontrasztok, finom animációk és felhasználóközpontú ergonómia.',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />
    },
    {
      title: 'AI-alapú megoldások',
      description: 'Nagy nyelvi modellek, Gemini API és intelligens asszisztensek gyakorlati integrációja modern rendszerekbe.',
      icon: <Cpu className="w-5 h-5 text-violet-400" />
    }
  ];

  const technologies = [
    'React',
    'TypeScript',
    'JavaScript (ESNext)',
    'Tailwind CSS',
    'Node.js & Express',
    'C# & .NET',
    'Electron',
    'Vite',
    'REST API-k',
    'Gemini API',
    'Git & GitHub',
    'Modern UI/UX elvek'
  ];

  return (
    <div className="relative min-h-screen pt-14 sm:pt-20 lg:pt-24 pb-20">
      {/* Ambient background glows */}
      <div className="ambient-glow-indigo top-20 left-10" />
      <div className="ambient-glow-purple bottom-20 right-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Ismerj meg
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Rólam
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
            Fiatal, technológia iránt elkötelezett projektkészítő és webfejlesztő vagyok.
          </p>
        </div>

        {/* Profile Card & Bio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-20">
          {/* Left: Modern Profile Card */}
          <div className="lg:col-span-4">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 sticky top-44 shadow-xl">
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 border border-white/10 group">
                <img
                  src={settings.avatarUrl}
                  alt={settings.ownerName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold font-display text-white">
                    {settings.ownerName}
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium mt-0.5">
                    {settings.ownerTitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{settings.location}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <a href={`mailto:${settings.email}`} className="text-slate-300 hover:text-white transition-colors">
                      {settings.email}
                    </a>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <Link
                    to="/projekt-igeny"
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                  >
                    <span>Projekt indítása</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Detailed Story & Philosophy */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/8 space-y-6">
              <h2 className="text-2xl font-bold font-display text-white">
                Szenvedélyem a digitális projektek valósággá formálása
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Hiszek abban, hogy a jó szoftver és a sikeres weboldal nem a felesleges bonyolításban, hanem a tiszta architektúrában, a precíz megvalósításban és a reszponzív, felhasználóbarát működésben rejlik.
              </p>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Nemcsak külső megrendelések megvalósításával foglalkozom, hanem folyamatosan fejlesztek saját szoftvereket és kísérleti projekteket is (mint a ConvertFlow videókonvertáló, vagy a fejlesztés alatt álló Gaming Assistant AI). Ez garantálja, hogy a legfrissebb fejlesztési technikákat és gyakorlati tapasztalatokat hozom minden új megbízásba.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Közvetlen kapcsolat</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Közvetlenül velem egyeztetsz, nincs közvetítői félreértés.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Modern Technológiák</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Elavult sablonok helyett jövőbiztos keretrendszerek.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Fields Grid */}
            <div>
              <h3 className="text-xl font-bold font-display text-white mb-6">
                Fő szakterületek
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coreFields.map((field) => (
                  <div
                    key={field.title}
                    className="glass-panel glass-panel-hover rounded-2xl p-6 border border-white/5"
                  >
                    <div className="p-2.5 rounded-xl bg-white/5 w-fit mb-4">
                      {field.icon}
                    </div>
                    <h4 className="text-base font-bold font-display text-white mb-2">
                      {field.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {field.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Technologies */}
            <div className="glass-panel rounded-3xl p-8 border border-white/8">
              <h3 className="text-base font-bold font-display text-white mb-4">
                Használt technológiák & eszközök
              </h3>
              <div className="flex flex-wrap gap-2">
                {technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-medium text-slate-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
