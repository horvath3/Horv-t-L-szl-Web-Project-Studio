import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Sparkles,
  Layout,
  Terminal,
  Cpu,
  Download,
  ShieldCheck,
  CheckCircle2,
  Radio,
  MonitorPlay
} from 'lucide-react';
import { ProjectCard } from '../components/ui/ProjectCard';
import { ServiceCard } from '../components/ui/ServiceCard';
import { LiveStreamPlayer } from '../components/stream/LiveStreamPlayer';
import { projectService, downloadService, settingsService } from '../services/storage';
import { liveStreamService, LiveStreamStatus } from '../services/liveStreamService';

export const HomePage: React.FC = () => {
  const [settings, setSettings] = React.useState(() => settingsService.get());
  const [featuredProjects, setFeaturedProjects] = React.useState(() =>
    projectService.getAll().slice(0, 3)
  );
  const [activeDownloads, setActiveDownloads] = React.useState(() =>
    downloadService.getAll(true)
  );
  const [streamStatus, setStreamStatus] = React.useState<LiveStreamStatus | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const checkLive = async () => {
      try {
        const s = await liveStreamService.getStatus();
        if (mounted) setStreamStatus(s);
      } catch {
        // Ignore
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    const reload = () => {
      setSettings(settingsService.get());
      setFeaturedProjects(projectService.getAll().slice(0, 3));
      setActiveDownloads(downloadService.getAll(true));
    };
    window.addEventListener('store_hl_studio_settings', reload);
    window.addEventListener('store_hl_studio_projects', reload);
    window.addEventListener('store_hl_studio_downloads', reload);
    window.addEventListener('hl_studio_remote_synced', reload);
    return () => {
      window.removeEventListener('store_hl_studio_settings', reload);
      window.removeEventListener('store_hl_studio_projects', reload);
      window.removeEventListener('store_hl_studio_downloads', reload);
      window.removeEventListener('hl_studio_remote_synced', reload);
    };
  }, []);

  return (
    <div className="relative min-h-screen pt-10 sm:pt-14 pb-16 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="ambient-glow-indigo -top-20 -left-20" />
      <div className="ambient-glow-purple top-1/3 -right-20" />

      {/* 1. HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 lg:pt-12 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Identity Kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Horvát László</span>
              <span className="text-slate-600">·</span>
              <span className="text-indigo-400 font-semibold">{settings.ownerTitle}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display text-white tracking-tight leading-[1.1] text-balance">
              {settings.heroHeading}
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {settings.heroSubheading}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link
                to="/projekt-igeny"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95"
              >
                <span>Projektet szeretnék</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/projektek"
                className="px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:border-white/20"
              >
                <span>Projektek megtekintése</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Key trust indicators */}
            <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-4 text-left">
              <div>
                <span className="block text-2xl font-bold font-display text-white tabular-nums">100%</span>
                <span className="text-xs text-slate-400">Egyedi Megoldások</span>
              </div>
              <div>
                <span className="block text-2xl font-bold font-display text-white tabular-nums">Modern</span>
                <span className="text-xs text-slate-400">Tech Stack (React, TS)</span>
              </div>
              <div>
                <span className="block text-2xl font-bold font-display text-white tabular-nums">Valós</span>
                <span className="text-xs text-slate-400">Saját szoftverek</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Container */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl p-2 group">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900">
                <img
                  src={settings.heroImageUrl || '/src/assets/images/hero_studio_workspace_1790449082794.jpg'}
                  alt="Horvát László Studio"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = '/src/assets/images/hero_studio_workspace_1790449082794.jpg';
                    if (!target.src.endsWith(fallback)) {
                      target.src = fallback;
                    }
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-black/20 to-transparent opacity-70" />

                {/* Floating Tech Tag Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl glass-panel border border-white/15 backdrop-blur-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Web & Project Studio</span>
                      <span className="text-[11px] text-slate-300">Modern architektúrák</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Elérhető
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RÖVID BEMUTATKOZÓ RÉSZ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Portrait */}
            <div className="md:col-span-4 flex justify-center md:justify-start">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-xl group">
                <img
                  src={settings.avatarUrl}
                  alt="Horvát László"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              </div>
            </div>

            {/* Bio text */}
            <div className="md:col-span-8 space-y-4 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Bemutatkozás
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">Horvát László</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Fiatal, technológia iránt elkötelezett projektkészítő és webfejlesztő
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {settings.bio}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/rolam"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors group"
                >
                  <span>Tudj meg többet rólam</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <span className="text-slate-600">·</span>
                <Link
                  to="/kapcsolat"
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Közvetlen kapcsolatfelvétel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 ÉLŐ MUNKA / MIN DOLGOZOM MOST SZEKCIÓ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className={`rounded-3xl border transition-all ${
            streamStatus?.isLive
              ? 'glass-panel border-rose-500/40 shadow-2xl shadow-rose-950/30 ring-1 ring-rose-500/30'
              : 'glass-panel border-white/10'
          } p-6 sm:p-8`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-rose-500/10 border border-rose-500/30 text-rose-300">
                <Radio className={`w-3.5 h-3.5 ${streamStatus?.isLive ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                <span>{streamStatus?.isLive ? '🔴 ÉLŐBEN KÖZVETÍTVE' : 'Stúdió Betekintő'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Min dolgozom most?
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                {streamStatus?.isLive
                  ? 'Éppen közvetítem az aktív fejlesztési vagy tervezési ablakomat. Csatlakozz be és nézd valós időben a folyamatot!'
                  : 'Amikor közvetítést indítok, itt valós időben követheted a megosztott fejlesztési vagy tervezési ablakomat (pl. VS Code, Figma, böngésző) anélkül, hogy a teljes asztalom látszódna.'}
              </p>
            </div>

            <Link
              to="/elo-munka"
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                streamStatus?.isLive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
              }`}
            >
              <MonitorPlay className="w-4 h-4" />
              <span>{streamStatus?.isLive ? 'Élő adás megnyitása' : 'Közvetítő szoba'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-4">
            <LiveStreamPlayer variant="compact" />
          </div>
        </div>
      </section>

      {/* 3. KIEMELT PROJEKTEK */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Portfólió</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              Kiemelt Projektek
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              Saját fejlesztésű asztali alkalmazások, webes platformok és fejlesztés alatt álló intelligens rendszerek.
            </p>
          </div>

          <Link
            to="/projektek"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors shrink-0 group"
          >
            <span>Összes projekt megtekintése</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* 4. SZOLGÁLTATÁSOK ÍZELÍTŐ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 block">
            Miben segíthetek?
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Szolgáltatások & Területek
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            A tervezéstől az élesítésig végigkísérem a digitális terméked fejlesztését.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ServiceCard
            number="01"
            title="Weboldal készítés"
            description="Modern, villámgyors bemutatkozó és portfólió weboldalak."
            points={['Reszponzív kialakítás', 'Modern UI/UX', 'Mobilbarát működés', 'Keresőoptimalizálás (SEO)']}
            icon={<Layout className="w-6 h-6" />}
            serviceTypeParam="Weboldal"
          />

          <ServiceCard
            number="02"
            title="Webalkalmazás-fejlesztés"
            description="Interaktív webes rendszerek, portálok és üzleti admin felületek."
            points={['Egyedi funkciók', 'Felhasználói rendszerek', 'Admin panelek', 'Adatkezelés']}
            icon={<Code2 className="w-6 h-6" />}
            serviceTypeParam="Webalkalmazás"
          />

          <ServiceCard
            number="03"
            title="Egyedi projektek"
            description="Speciális szoftverek és egyedi ötletek precíz megvalósítása."
            points={['Egyedi ötletek megvalósítása', 'Saját alkalmazások', 'Speciális rendszerek', 'Asztali eszközök']}
            icon={<Terminal className="w-6 h-6" />}
            serviceTypeParam="Egyedi szoftver"
          />

          <ServiceCard
            number="04"
            title="AI-integráció"
            description="Intelligens asszisztensek és automatizációk beépítése."
            points={['AI funkciók', 'Intelligens asszisztensek', 'Automatizált folyamatok', 'Adatmodellezés']}
            icon={<Sparkles className="w-6 h-6" />}
            serviceTypeParam="AI projekt"
          />
        </div>
      </section>

      {/* 5. PROJEKTINDÍTÁS NAGY CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-indigo-500/20 p-8 sm:p-14 text-center">
          <div className="ambient-glow-indigo top-0 left-1/3 opacity-50" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Közös munka</span>
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
              Van egy konkrét digitális elképzelésed?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Írd le, mit szeretnél megvalósítani! Részletes ajánlattal, technológiai javaslattal és átlátható ütemtervvel jelentkezem.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/projekt-igeny"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
              >
                Projektigény Beküldése
              </Link>
              <Link
                to="/kapcsolat"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
              >
                Kapcsolatfelvétel
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
