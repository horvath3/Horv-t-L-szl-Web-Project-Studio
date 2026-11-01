import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layout,
  Code2,
  Terminal,
  Sparkles,
  Gamepad2,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  PenTool,
  Rocket
} from 'lucide-react';
import { ServiceCard } from '../components/ui/ServiceCard';

export const ServicesPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Koncepció & Egyeztetés',
      desc: 'Átbeszéljük az ötletedet, a célközönséget és a szükséges funkciókat.'
    },
    {
      num: '02',
      title: 'Tervezés & Prototípus',
      desc: 'Drótváz, játékmechanika vagy modern, letisztult UI terv készül az ergonómia jegyében.'
    },
    {
      num: '03',
      title: 'Fejlesztés & Tesztelés',
      desc: 'Tiszta kód, moduláris felépítés és többeszközös tesztelés a stabil működésért.'
    },
    {
      num: '04',
      title: 'Élesítés & Támogatás',
      desc: 'Biztonságos publikálás, kiadás és folyamatos rendelkezésre állás.'
    }
  ];

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
              Szolgáltatások & Kategóriák
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            Több Kategóriás Digitális Projekt Stúdió
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
            Átfogó megoldások a letisztult weboldalaktól és webalkalmazásoktól az egyedi szoftvereken, AI-integrációkon és mobilapplikációkon át az egyedi játékfejlesztési projektekig.
          </p>
        </div>

        {/* 6 Core Service Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          <ServiceCard
            number="01"
            title="Weboldal & Webalkalmazás"
            description="Modern bemutatkozó oldalak, céges oldalak, webshopok és összetett üzleti webalkalmazások."
            points={[
              'Bemutatkozó oldal, céges oldal, webshop, portfólió',
              'Kapcsolatfelvétel, admin panel és bejelentkezés',
              'Strukturált adatbázis és API-integrációk',
              'Reszponzív kialakítás minden képernyőméretre',
              'Keresőoptimalizálás (SEO) és gyors betöltés'
            ]}
            icon={<Layout className="w-6 h-6" />}
            serviceTypeParam="Weboldal"
          />

          <ServiceCard
            number="02"
            title="Játékfejlesztés / Játékprojekt"
            description="Egyedi 2D/3D játékprojektek, szimulátorok, stratégiai és puzzle játékok tervezése és fejlesztése."
            points={[
              'Szimulátor, kalandjáték, stratégia, puzzle, verseny',
              'Windows, Android, iOS és WebGL platformok',
              'Unity, Unreal Engine és Godot technológiák',
              'Saját, eredeti játékmechanika és UI/UX rendszer',
              'Prototípusok, fizikai rendszerek és optimalizálás'
            ]}
            icon={<Gamepad2 className="w-6 h-6" />}
            serviceTypeParam="Játékprojekt"
          />

          <ServiceCard
            number="03"
            title="Egyedi szoftverek"
            description="Speciális elképzelések, asztali applikációk és saját fejlesztésű üzleti szoftverek."
            points={[
              'Egyedi ötletek professzionális megvalósítása',
              'Saját asztali alkalmazások (Windows / macOS / Linux)',
              'Speciális rendszerek, adatfeldolgozás & automatizmusok',
              'REST API, adatbázis és jelentéskészítő modulok',
              'Stabil, skálázható architektúra'
            ]}
            icon={<Terminal className="w-6 h-6" />}
            serviceTypeParam="Egyedi szoftver"
          />

          <ServiceCard
            number="04"
            title="AI projektek & Integráció"
            description="Mesterséges intelligencia képességek és munkafolyamatok integrálása új vagy meglévő rendszerekbe."
            points={[
              'AI funkciók és nagy nyelvi modellek (LLM)',
              'Dokumentum- és adatelemző automatizmusok',
              'Személyre szabott tartalom- és sablongenerálás',
              'Strukturált JSON kimenetek kinyerése',
              'Biztonságos szerveroldali API hívások'
            ]}
            icon={<Sparkles className="w-6 h-6" />}
            serviceTypeParam="AI projekt"
          />

          <ServiceCard
            number="05"
            title="Mobilalkalmazás-fejlesztés"
            description="Modern, reszponzív iOS és Android mobilalkalmazások, valamint telepíthető PWA rendszerek."
            points={[
              'Cross-platform Android és iOS megjelenés',
              'Felhasználói fiókok, értesítések és felhő szinkron',
              'Offline működés és gyors natív élmény',
              'Modern kártyás mobil UI/UX dizájn',
              'Szerveroldali háttérrendszer és admin felület'
            ]}
            icon={<Smartphone className="w-6 h-6" />}
            serviceTypeParam="Mobilalkalmazás"
          />

          <ServiceCard
            number="06"
            title="Egyéb egyedi projekt"
            description="Bármilyen egyedi digitális koncepció, hibrid rendszer vagy speciális technológiai fejlesztés."
            points={[
              'Komplex vagy több kategóriát érintő projektek',
              'Prototípus-fejlesztés (MVP) és műszaki tanácsadás',
              'Meglévő rendszerek modernizálása és bővítése',
              'Személyre szabott ütemezés és specifikáció',
              'Közvetlen szakmai egyeztetés Horvát Lászlóval'
            ]}
            icon={<Code2 className="w-6 h-6" />}
            serviceTypeParam="Egyéb"
          />
        </div>

        {/* Development Workflow */}
        <div className="glass-panel rounded-3xl p-8 sm:p-14 border border-white/8 mb-20">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
              Hogyan dolgozom?
            </span>
            <h2 className="text-3xl font-bold font-display text-white">
              Átlátható Fejlesztési Folyamat
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              A projekt kezdetétől az élesítésig folyamatos visszajelzésekkel biztosítom a precíz eredményt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((st) => (
              <div key={st.num} className="relative space-y-3">
                <span className="font-mono text-2xl font-extrabold text-indigo-500/60 block">
                  {st.num}
                </span>
                <h3 className="text-base font-bold text-white font-display">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold font-display text-white">
            Készen állsz a megvalósításra?
          </h2>
          <p className="text-sm text-slate-300">
            Töltsd ki a projektigény-felmérőt, vagy írj közvetlen üzenetet, és vágjunk bele!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/projekt-igeny"
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span>Projektigény küldése</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/kapcsolat"
              className="px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/10"
            >
              Kapcsolatfelvétel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
