import {
  Project,
  Download,
  ProjectRequest,
  SiteSettings,
  AdminUser,
  NotificationItem,
  Promotion,
  EmailTemplate,
  StatusTemplateMap
} from '../types';

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-ingyenes-weboldal-2026',
    title: 'Ingyenes weboldal készítés',
    shortTitle: 'Ingyenes Weboldal',
    slug: 'ingyenes-weboldal-2026',
    icon: '🎁',
    image: '/src/assets/images/studio_hero_visual_1790358021032.jpg',
    ctaText: 'Ajánlatot kérek',
    projectCategory: 'Weboldal / Webalkalmazás',
    shortDescription: 'Most egy meghatározott időszakban ingyen elkészítek egy weboldalt a jelentkezők számára.',
    fullDescription: 'Most egy meghatározott időszakban díjmentesen elkészítek egy professzionális, modern weboldalt a kiválasztott jelentkező számára. Célom a legújabb webes technológiák és minőségi UI/UX bemutatása valós, működő ügyfélprojekten keresztül. Nincsenek rejtett költségek: a cél egy inspiráló, minőségi digitális referencia megalkotása.',
    features: [
      'modern weboldal',
      'reszponzív kialakítás',
      'alapvető UI/UX',
      'alapfunkciók',
      'egyeztetés'
    ],
    additionalInfo: 'Az ajánlat minden olyan magánszemély, vállalkozás vagy startup számára nyitott, akik új digitális jelenlétet szeretnének. A határidőig beérkező összes ajánlatkérést Horvát László személyesen értékeli és választja ki az együttműködés megvalósítását.',
    startDate: '2026-03-01',
    startTime: '00:00',
    endDate: '2026-10-15',
    endTime: '23:59',
    active: true,
    showBanner: true,
    allowRequests: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-24T12:00:00.000Z'
  },
  {
    id: 'promo-ingyenes-jatekprojekt',
    title: 'Ingyenes játékprojekt készítés',
    shortTitle: 'Ingyenes Játékprojekt',
    slug: 'ingyenes-jatekprojekt',
    icon: '🎮',
    image: '/src/assets/images/gaming_assistant_ai_1790358051667.jpg',
    ctaText: 'Játékprojekt jelentkezés',
    projectCategory: 'Játékprojekt',
    shortDescription: 'Valósítsd meg saját, egyedi játékötletedet vagy játszható prototípusodat a stúdió szakmai támogatásával!',
    fullDescription: 'Különleges időszakos felhívás keretében kiválasztott jelentkező számára díjmentesen elkészítem egy saját ötleten alapuló, egyedi játékprojekt alapverzióját vagy játszható prototípusát (Windows, Web vagy mobil platformra). Legyen szó szimulátorról, stratégiai játékról, kalandjátékról vagy logikai puzzle koncepcióról – a beküldött egyedi elképzelést és inspirációt modern játékmotorral (Unity, Unreal Engine vagy Godot) keltem életre.',
    features: [
      'Egyedi játékmechanika és saját koncepció kidolgozása',
      'Játszható prototípus / alapverzió (Windows, Web vagy Mobil)',
      'Modern játékmotor (Unity / Unreal Engine / Godot) architektúra',
      'Felhasználói felület (HUD, menürendszer) és hangulattervezés',
      'Személyes szakmai konzultáció és mérföldkő-egyeztetés'
    ],
    additionalInfo: 'Fontos szakmai és jogi tájékoztatás: A promóció keretében kizárólag saját ötletek, egyedi fejlesztések és inspiráció alapján készülő eredeti játékprojektek valósulnak meg (meglévő kereskedelmi játékok másolása nem történik; a megadott referencia játékok kizárólag hangulati vagy játékmenetbeli inspirációként szolgálnak).',
    startDate: '2026-03-01',
    startTime: '00:00',
    endDate: '2026-11-30',
    endTime: '23:59',
    active: true,
    showBanner: false,
    allowRequests: true,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-25T12:00:00.000Z'
  },
  {
    id: 'promo-startup-mvp',
    title: 'Startup MVP Szoftvercsomag',
    shortTitle: 'Startup MVP',
    slug: 'startup-mvp-szoftvercsomag',
    icon: '🚀',
    ctaText: 'Érdekel az MVP',
    projectCategory: 'Egyedi szoftver',
    shortDescription: 'Gyorsított prototípus- és MVP-fejlesztés induló projekteknek és innovátoroknak.',
    fullDescription: 'Induló vállalkozásoknak és innovatív ötletgazdáknak kínálok gyorsított, 4 hetes MVP fejlesztési csomagot modern webes vagy asztali technológiákkal, skálázható architektúrával.',
    features: [
      'Interaktív prototípus és drótváz',
      'Adatbázis és hitelesítés beállítása',
      'Modern adminisztrációs felület',
      'Felhőbe telepítés & üzembehelyezés'
    ],
    additionalInfo: 'A jelentkezéshez elegendő egy rövid funkciólista vagy elképzelés.',
    startDate: '2026-03-01',
    startTime: '00:00',
    endDate: '2026-11-30',
    endTime: '23:59',
    active: true,
    showBanner: false,
    allowRequests: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-20T10:00:00.000Z'
  },
  {
    id: 'promo-tavaszi-audit',
    title: 'Tavaszi Weboldal & UI/UX Audit',
    shortTitle: 'UI/UX Audit',
    slug: 'tavaszi-ui-ux-audit',
    icon: '⚡',
    ctaText: 'Audit kérése',
    projectCategory: 'Weboldal / Webalkalmazás',
    shortDescription: 'Ingyenes 10 pontos UI/UX és sebesség-átvilágítás meglévő weboldalaknak.',
    fullDescription: 'Részletes szakmai átvilágítás a weboldal sebességéről, mobilbarát elrendezéséről és konverziós potenciáljáról.',
    features: [
      'Sebesség- és Core Web Vitals elemzés',
      'Mobilnézet és akadálymentességi ellenőrzés',
      'Konverziós és vizuális hierarchia javaslatok'
    ],
    additionalInfo: 'Ez az időszakos promóció már lezárult.',
    startDate: '2026-02-01',
    startTime: '00:00',
    endDate: '2026-03-15',
    endTime: '23:59',
    active: true,
    showBanner: false,
    allowRequests: false,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z'
  }
];

export const INITIAL_SETTINGS: SiteSettings = {
  ownerName: 'Horvát László',
  ownerTitle: 'Webdesigner • Webfejlesztő • Projektkészítő',
  studioName: 'Horvát László – Web & Project Studio',
  bio: 'Fiatal, technológia iránt elkötelezett projektkészítő és webfejlesztő vagyok. Szenvedélyem a modern felületek, a reszponzív weboldalak és a nagy teljesítményű egyedi szoftveres megoldások megvalósítása a legfrissebb technológiák segítségével.',
  email: 'kapcsolat@horvatstudio.hu',
  phone: '+36 30 123 4567',
  location: 'Budapest, Magyarország',
  heroHeading: 'Ötletből működő digitális projekt.',
  heroSubheading: 'Weboldalakat, webalkalmazásokat és egyedi digitális projekteket készítek modern technológiákkal.',
  avatarUrl: '/src/assets/images/horvat_laszlo_profile_1790358061257.jpg',
  heroImageUrl: '/src/assets/images/hero_studio_workspace_1790449082794.jpg',
  socialLinks: {
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    discord: 'https://discord.gg',
    twitter: 'https://twitter.com'
  },
  seoTitle: 'Horvát László – Web & Project Studio | Weboldal és Projektfejlesztés',
  seoDescription: 'Weboldalakat, webalkalmazásokat és egyedi digitális projekteket készítek modern technológiákkal. Horvát László hivatalos webstúdiója.'
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-convertflow',
    slug: 'convertflow-desktop',
    title: 'ConvertFlow Desktop',
    shortDescription: 'Modern asztali videókonvertáló és tömörítő alkalmazás.',
    detailedDescription: 'A ConvertFlow Desktop egy modern felületű, hardveresen gyorsított videókonvertáló és tömörítő eszköz. Kifejezetten olyan tartalomkészítőknek és fejlesztőknek készült, akiknek gyors, minőségvesztés nélküli formátumváltásra és intelligens fájlméret-optimalizálásra van szükségük. Támogatja a kötegelt feldolgozást, az egyéni bitráta-beállításokat és a modern videókódexeket.',
    status: 'Elkészült',
    isPublic: true,
    category: 'software',
    featured: true,
    version: '1.2.4',
    imageUrl: '/src/assets/images/convertflow_desktop_1790358032411.jpg',
    gallery: [
      '/src/assets/images/convertflow_desktop_1790358032411.jpg',
      '/src/assets/images/studio_hero_visual_1790358021032.jpg'
    ],
    technologies: ['Electron', 'TypeScript', 'React', 'FFmpeg', 'Tailwind CSS', 'Node.js'],
    features: [
      'Kötegelt (batch) fájlfeldolgozás drag-and-drop támogatással',
      'Hardveres gyorsítás (NVENC, QuickSync, Apple VideoToolbox)',
      'MP4, WebM, MKV, AVI, MOV és AV1 támogatás',
      'Prediktív fájlméret-kalkulátor és tömörítési profilok',
      'Intelligens hangsáv-konverzió és felirat-beágyazás',
      'Sötét modern UI minimális erőforrás-igénnyel'
    ],
    downloadId: 'dl-convertflow-win',
    githubUrl: 'https://github.com/example/convertflow-desktop',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-03-10T14:30:00.000Z'
  },
  {
    id: 'proj-gaming-assistant',
    slug: 'gaming-assistant',
    title: 'Gaming Assistant',
    shortDescription: 'Gaming Assistant / GameWiki AI egy játékokhoz készülő intelligens asszisztens és wiki rendszer.',
    detailedDescription: 'A Gaming Assistant egy interaktív, mesterséges intelligenciára épülő játékos tudástár és társalkalmazás. Célja, hogy a játékosok valós időben jussanak hozzá küldetés-útmutatókhoz, fegyverstatisztikákhoz, craftolási receptekhez és taktikai tippekhez anélkül, hogy el kellene hagyniuk a játékot. A projekt jelenleg aktív béta fejlesztési fázisban van, a wiki motor és a helyi modell-integráció tesztelése zajlik.',
    status: 'Fejlesztés alatt',
    isPublic: true,
    category: 'ai',
    featured: true,
    version: '0.8.0-beta',
    imageUrl: '/src/assets/images/gaming_assistant_ai_1790358051667.jpg',
    gallery: [
      '/src/assets/images/gaming_assistant_ai_1790358051667.jpg'
    ],
    technologies: ['React', 'TypeScript', 'Node.js', 'Gemini AI', 'Vector DB', 'Tauri'],
    features: [
      'Kontextusérzékeny wiki kereső és gyors billentyűparancsok',
      'Intelligens AI játékmester és stratégiai tanácsadó',
      'Több mint 50 támogatott PC és konzol játék adatbázisa',
      'Offline elérhető jegyzetelő és quest-követő panel',
      'Alacsony késleltetésű helyi gyorsítótár'
    ],
    // No downloadId while in development!
    createdAt: '2026-02-01T12:00:00.000Z',
    updatedAt: '2026-03-22T09:15:00.000Z'
  },
  {
    id: 'proj-steam-launcher',
    slug: 'ingyenes-steam-jatekok-launcher',
    title: 'Ingyenes Steam Játékok Launcher',
    shortDescription: 'Launcher ingyenesen elérhető Steam-játékok kezelésére és indítására.',
    detailedDescription: 'Egy letisztult, villámgyors asztali indítóalkalmazás, amely összegyűjti és kategóriákba rendezi a Steam platformon elérhető legnépszerűbb és rejtett ingyenes (Free-to-Play és időszakos 100% kedvezményes) játékokat. Segítségével a játékosok egyetlen kattintással felfedezhetik, könyvtárukba adhatják és közvetlenül elindíthatják a játékokat anélkül, hogy manuálisan böngészniük kellene a katalógusokat.',
    status: 'Elkészült',
    isPublic: true,
    category: 'software',
    featured: true,
    version: '1.0.4',
    imageUrl: '/src/assets/images/steam_games_launcher_1790358075050.jpg',
    gallery: [
      '/src/assets/images/steam_games_launcher_1790358075050.jpg'
    ],
    technologies: ['C#', '.NET 8', 'WPF', 'Steam API', 'SQLite'],
    features: [
      'Valós idejű szinkronizáció a Steam ingyenes játékadatbázisával',
      'Időszakos akciók és ingyenessé vált játékok automatikus értesítője',
      'Közvetlen Steam URI indítás és könyvtárhoz adás',
      'Minimális memória- és processzorhasználat háttérben',
      'Egyéni kedvencek lista és címkék szerinti szűrés'
    ],
    downloadId: 'dl-steam-launcher-win',
    githubUrl: 'https://github.com/example/steam-free-launcher',
    createdAt: '2025-11-20T16:00:00.000Z',
    updatedAt: '2026-02-18T11:45:00.000Z'
  },
  {
    id: 'proj-tile-nova',
    slug: 'tile-nova',
    title: 'Tile Nova',
    shortDescription: 'Modern moduláris dizájnrendszer és csempézett munkafelület webes alkalmazásokhoz.',
    detailedDescription: 'Belső kísérleti projekt egy teljesen moduláris, drag-and-drop csempealapú munkafelület és UI keretrendszer kialakítására. Belső tesztelés alatt áll.',
    status: 'Fejlesztés alatt',
    isPublic: false, // Explicitly false as requested in prompt!
    category: 'web',
    featured: false,
    version: '0.4.0',
    imageUrl: '/src/assets/images/studio_hero_visual_1790358021032.jpg',
    gallery: [],
    technologies: ['TypeScript', 'Canvas', 'WebGL', 'Tailwind CSS'],
    features: [
      'Rugalmas drag-and-drop rácsrendszer',
      'Valós idejű állapotmegőrzés',
      'Exportálható JSON konfigurációk'
    ],
    createdAt: '2026-02-10T14:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z'
  }
];

export const INITIAL_DOWNLOADS: Download[] = [
  {
    id: 'dl-convertflow-win',
    projectId: 'proj-convertflow',
    projectSlug: 'convertflow-desktop',
    projectTitle: 'ConvertFlow Desktop',
    fileName: 'ConvertFlow_Setup_1.2.4.exe',
    fileUrl: 'https://github.com/example/convertflow-desktop/releases/download/v1.2.4/ConvertFlow_Setup_1.2.4.exe',
    version: '1.2.4',
    platform: 'Windows',
    fileSize: '74.2 MB',
    releaseDate: '2026-03-10',
    isActive: true,
    downloadCount: 342,
    changelog: 'Új AV1 hardveres kódolás támogatása, memóriaoptimalizálás 4K videók kötegelt konvertálásakor.'
  },
  {
    id: 'dl-convertflow-mac',
    projectId: 'proj-convertflow',
    projectSlug: 'convertflow-desktop',
    projectTitle: 'ConvertFlow Desktop (macOS)',
    fileName: 'ConvertFlow-1.2.4-arm64.dmg',
    fileUrl: 'https://github.com/example/convertflow-desktop/releases/download/v1.2.4/ConvertFlow-1.2.4-arm64.dmg',
    version: '1.2.4',
    platform: 'macOS',
    fileSize: '82.5 MB',
    releaseDate: '2026-03-10',
    isActive: true,
    downloadCount: 188,
    changelog: 'Apple Silicon natív optimalizáció, macOS Sequoia kompatibilitás.'
  },
  {
    id: 'dl-steam-launcher-win',
    projectId: 'proj-steam-launcher',
    projectSlug: 'ingyenes-steam-jatekok-launcher',
    projectTitle: 'Ingyenes Steam Játékok Launcher',
    fileName: 'SteamFreeLauncher_v1.0.4.zip',
    fileUrl: 'https://github.com/example/steam-free-launcher/releases/download/v1.0.4/SteamFreeLauncher_v1.0.4.zip',
    version: '1.0.4',
    platform: 'Windows',
    fileSize: '18.6 MB',
    releaseDate: '2026-02-18',
    isActive: true,
    downloadCount: 890,
    changelog: 'Gyorsabb katalógus-frissítés, új szűrők műfaj és felhasználói értékelések alapján.'
  }
];

export const INITIAL_REQUESTS: ProjectRequest[] = [
  {
    id: 'req-101',
    requestId: 'HL-3M8Q-54VN',
    name: 'Kovács Péter',
    email: 'peter.kovacs@example.com',
    projectName: 'SmartLogistics Portál',
    projectType: 'Webalkalmazás',
    projectCategory: 'Weboldal / Webalkalmazás',
    websiteType: 'céges oldal',
    shortDescription: 'Belső fuvarkezelő és raktár-nyilvántartó webalkalmazás készítése kisvállalkozásunk számára.',
    detailedDescription: 'Cégünk 15 teherautóval és egy 800 m²-es raktárral rendelkezik. Olyan modern webes adminisztrációs felületet szeretnénk, ahol a diszpécserek rögzíthetik a rendeléseket, nyomon követhetik a járművek státuszát és PDF fuvarlevelet generálhatnak egy kattintással.',
    requestedFeatures: [
      'admin panel',
      'bejelentkezés',
      'adatbázis',
      'Jogosultsági szintek (admin, diszpécser, sofőr nézet)',
      'Rendelés- és raktárkészlet-kezelés',
      'PDF fuvarlevél és számla előkészítés'
    ],
    requiredFeatures: [
      'admin panel',
      'bejelentkezés',
      'adatbázis',
      'Jogosultsági szintek (admin, diszpécser, sofőr nézet)',
      'Rendelés- és raktárkészlet-kezelés',
      'PDF fuvarlevél és számla előkészítés'
    ],
    referenceUrl: 'https://example-logistics.com',
    referenceLink: 'https://example-logistics.com',
    deadline: '2026-06-30',
    budget: '1.200.000 - 1.800.000 Ft',
    status: 'Ajánlat egyeztetése',
    internalStatus: 'Ajánlat egyeztetése',
    publicStatus: 'Ajánlat egyeztetése',
    publicStatusMessage: 'Az előzetes specifikáció és a modulok ütemezése jelenleg egyeztetés alatt áll.',
    adminNotes: 'Első telefonos egyeztetés megtörtént, részletes drótváz tervezés van folyamatban.',
    aiAnalysis: {
      summary: 'Realisztikus és jól definiált B2B webalkalmazás projekt. A React + Node.js + PostgreSQL stack ideális választás.',
      estimatedWeeks: '6-8 hét',
      suggestedTech: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      complexity: 'Közepes',
      recommendedNextSteps: [
        'Adatmodell és entitás-kapcsolatok véglegesítése',
        'Figma drótváz bemutatása a diszpécseri munkafolyamathoz',
        'PDF sablonok jóváhagyása'
      ]
    },
    emailHistory: [
      {
        id: 'eh-101-1',
        requestId: 'HL-3M8Q-54VN',
        templateId: 'tpl-uj',
        templateName: 'Ajánlatkérés beérkezett',
        emailType: 'Visszaigazolás',
        statusAtSend: 'Új',
        recipientName: 'Kovács Péter',
        recipientEmail: 'peter.kovacs@example.com',
        subject: 'Megkaptuk az ajánlatkérésed – SmartLogistics Portál',
        deliveryStatus: 'Elküldve',
        provider: 'manual-copy',
        timestamp: '2026-03-18T09:30:00.000Z'
      },
      {
        id: 'eh-101-2',
        requestId: 'HL-3M8Q-54VN',
        templateId: 'tpl-egyeztetes',
        templateName: 'Ajánlat egyeztetés',
        emailType: 'Státuszértesítés',
        statusAtSend: 'Ajánlat egyeztetése',
        recipientName: 'Kovács Péter',
        recipientEmail: 'peter.kovacs@example.com',
        subject: 'Ajánlat és specifikáció egyeztetése – SmartLogistics Portál (HL-3M8Q-54VN)',
        deliveryStatus: 'Előkészítve',
        provider: 'manual-copy',
        timestamp: '2026-03-19T14:15:00.000Z'
      }
    ],
    createdAt: '2026-03-18T09:20:00.000Z',
    updatedAt: '2026-03-19T14:10:00.000Z'
  },
  {
    id: 'req-102',
    requestId: 'HL-7K4P-92XM',
    name: 'Tóth Andrea',
    email: 'andrea.toth@studio-art.hu',
    projectName: 'ArtisDesign Ékszer Weboldal',
    projectType: 'Weboldal',
    projectCategory: 'Weboldal / Webalkalmazás',
    websiteType: 'portfólió',
    shortDescription: 'Egyedi kézműves ékszerkészítő bemutatkozó és katalógus weboldal.',
    detailedDescription: 'Prémium minőségű, letisztult, elegáns weboldalt szeretnék meglévő kézműves ékszer márkámnak. Fontos a minőségi galéria, az ékszerek részletes bemutatása és az egyszerű kapcsolatfelvételi / egyedi rendelés leadási űrlap.',
    requestedFeatures: [
      'kapcsolatfelvétel',
      'Fotóközpontú, prémium minimalista dizájn',
      'Kategória szerinti ékszerkatalógus',
      'Instagram hírfolyam integráció',
      'Egyedi rendelés kalkulátor/űrlap'
    ],
    requiredFeatures: [
      'kapcsolatfelvétel',
      'Fotóközpontú, prémium minimalista dizájn',
      'Kategória szerinti ékszerkatalógus',
      'Instagram hírfolyam integráció',
      'Egyedi rendelés kalkulátor/űrlap'
    ],
    deadline: '2026-05-15',
    budget: '500.000 - 800.000 Ft',
    notes: 'Kifejezetten az őszi promóció kapcsán keresett meg, szeretne egy tiszta, minimalista ékszerbemutató oldalt.',
    promotionId: 'promo-ingyenes-weboldal-2026',
    promotionTitle: 'Ingyenes weboldal készítés',
    status: 'Új',
    internalStatus: 'Új',
    publicStatus: 'Átnézés alatt',
    publicStatusMessage: 'Az ajánlatkérésedet jelenleg átnézem. Hamarosan e-mailben felveszem veled a kapcsolatot.',
    createdAt: '2026-03-24T16:45:00.000Z',
    updatedAt: '2026-03-24T16:45:00.000Z'
  },
  {
    id: 'req-103',
    requestId: 'HL-9G2M-41KP',
    name: 'Szabó Dániel',
    email: 'daniel.szabo@gamedev-idea.hu',
    projectName: 'CityLine Transit – Egyedi Városi Buszszimulátor',
    projectType: 'Játékprojekt',
    projectCategory: 'Játékprojekt',
    gameName: 'CityLine Transit Simulator',
    gameType: 'Szimulátor',
    platform: 'Windows',
    engine: 'Unity',
    inspiration: 'Bus Simulator 27',
    referenceLink: 'https://store.steampowered.com',
    referenceUrl: 'https://store.steampowered.com',
    shortDescription: 'Saját ötleten alapuló, egyedi fejlesztésű városi tömegközlekedési és menetrend-tervező szimulátor játék.',
    detailedDescription: 'Egy egyedi fejlesztésű, hangulatos városi buszvezetési és garázsmenedzsment szimulátort szeretnék megvalósítani saját koncepció alapján. A játékos saját útvonalakat tervezhet egy fiktív közép-európai városban, figyelnie kell az utasok elégedettségére, az időjárási viszonyokra és a menetrend betartására.',
    requestedFeatures: [
      'Saját útvonal- és menetrend-szerkesztő',
      'Dinamikus napszak- és időjárás-rendszer',
      'Járműfizika és műszerfal interakciók',
      'Karrier mód és flottamenedzsment'
    ],
    requiredFeatures: [
      'Saját útvonal- és menetrend-szerkesztő',
      'Dinamikus napszak- és időjárás-rendszer',
      'Járműfizika és műszerfal interakciók',
      'Karrier mód és flottamenedzsment'
    ],
    projectFiles: [
      {
        name: 'cityline_koncepcio_terv.pdf',
        size: 425000,
        type: 'application/pdf'
      }
    ],
    deadline: '2026-09-30',
    budget: '1.200.000 - 2.500.000 Ft',
    notes: 'A Bus Simulator 27 csak hangulati inspiráció, teljesen saját, eredeti játékmenetet és fiktív várost szeretnénk.',
    promotionId: 'promo-ingyenes-jatekprojekt',
    promotionTitle: '🎮 Ingyenes játékprojekt készítés',
    status: 'Átnézés alatt',
    internalStatus: 'Átnézés alatt',
    publicStatus: 'Átnézés alatt',
    publicStatusMessage: 'A játékprojekt ötletedet és a kért mechanikákat jelenleg átnézem. Hamarosan e-mailben felveszem veled a kapcsolatot.',
    createdAt: '2026-03-25T11:20:00.000Z',
    updatedAt: '2026-03-25T11:20:00.000Z'
  }
];

export const INITIAL_ADMIN_USER: AdminUser = {
  id: 'admin-1',
  username: 'admin',
  email: 'laszlo@horvatstudio.hu',
  role: 'superadmin',
  lastLogin: '2026-03-25T09:00:00.000Z'
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Új projektmegkeresés érkezett',
    message: 'Tóth Andrea elküldte a „ArtisDesign Ékszer Weboldal” projektigényét.',
    type: 'info',
    read: false,
    timestamp: '2026-03-24T16:45:00.000Z',
    link: '/admin/megkeresesek'
  },
  {
    id: 'notif-2',
    title: 'Letöltési mérföldkő',
    message: 'A ConvertFlow Desktop elérte a 500+ összetett letöltést.',
    type: 'success',
    read: true,
    timestamp: '2026-03-20T11:00:00.000Z',
    link: '/admin/letoltesek'
  }
];

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-uj',
    name: 'Ajánlatkérés beérkezett',
    targetStatus: 'Új',
    subject: 'Megkaptuk az ajánlatkérésed – {{projectName}}',
    preheader: 'Köszönöm a megkeresésedet! Az ajánlatkérésedet ({{requestId}}) sikeresen rögzítettem.',
    introText: 'Kedves {{customerName}}!\n\nKöszönöm, hogy megkerestél a(z) „{{projectName}}” projekttel kapcsolatban! Az ajánlatkérésed sikeresen megérkezett a Horvát László – Web & Project Studio rendszerébe.',
    bodyContent: 'Az általad beküldött elképzelést és funkcionális igényeket rögzítettem. Hamarosan személyesen átnézem a megadott paramétereket, hogy szakmailag megalapozott visszajelzéssel és a lehetséges megvalósítási irányokkal kereshesselek meg.\n\nAz ajánlatkérésed egyedi azonosítója: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz tájékoztató: {{publicStatusMessage}}',
    nextStepsText: '1. Szakmai áttekintés és technológiai tervezés a stúdió részéről\n2. Visszajelzés e-mailben a részletek pontosításához\n3. Specifikáció és ütemezés közös véglegesítése',
    ctaText: 'Ajánlatkérés státuszának megtekintése',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Egyedi weboldalak, webalkalmazások és szoftverprojektek tervezése és kivitelezése.',
    icon: '🆕',
    accentColor: 'indigo',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'tpl-feldolgozas',
    name: 'Ajánlatkérés feldolgozás alatt',
    targetStatus: 'Átnézés alatt',
    subject: 'Ajánlatkérésed feldolgozás alatt – {{projectName}} ({{requestId}})',
    preheader: 'Megkezdtem a(z) {{projectName}} projektigényed részletes szakmai áttekintését.',
    introText: 'Kedves {{customerName}}!\n\nKöszönöm a türelmedet és a beküldött projektigényt! Szeretnélek tájékoztatni, hogy a(z) „{{projectName}}” ajánlatkérésed feldolgozása és szakmai áttekintése jelenleg folyamatban van.',
    bodyContent: 'Részletesen elemzem a kért funkciókat, a felhasználói élmény szempontjait és az optimális technológiai architektúrát. A célom, hogy olyan javaslatot állítsak össze számodra, amely hosszú távon is stabil, modern és üzletileg eredményes megoldást nyújt.\n\nAjánlatkérés azonosító: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz üzenet: {{publicStatusMessage}}',
    nextStepsText: '1. Műszaki specifikáció és javasolt technológiák összeállítása\n2. Rövid egyeztetés a felmerülő kérdések tisztázására\n3. Részletes projektterv és ütemezés bemutatása',
    ctaText: 'Élő státusz követése',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Kérdés esetén válaszolj bátran erre az e-mailre.',
    icon: '👀',
    accentColor: 'cyan',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:05:00.000Z',
    updatedAt: '2026-03-01T10:05:00.000Z'
  },
  {
    id: 'tpl-kapcsolatfelvetel',
    name: 'Kapcsolatfelvétel',
    targetStatus: 'Kapcsolatfelvétel',
    subject: 'Kapcsolatfelvétel és szakmai visszajelzés – {{projectName}} ({{requestId}})',
    preheader: 'Áttekintettem a(z) {{projectName}} projektigényedet – egyeztessük a részleteket!',
    introText: 'Kedves {{customerName}}!\n\nRészletesen átnéztem a(z) „{{projectName}}” projekttel kapcsolatos elképzeléseidet. A megfogalmazott célok alapján egy nagyon izgalmas és jól strukturálható digitális projektet tudunk felépíteni.',
    bodyContent: 'Az előzetes áttekintés alapján összeállítottam a legfontosabb szakmai javaslatokat. Ahhoz, hogy a lehető legpontosabb ütemezést és megvalósítási tervet véglegesíthessük, érdemes röviden átbeszélnünk néhány kulcsfontosságú részletet.\n\nAjánlatkérés azonosító: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz tájékoztató: {{publicStatusMessage}}',
    nextStepsText: '1. Kérlek, jelezz vissza erre az e-mailre a számodra megfelelő időpontokkal\n2. Rövid online vagy írásos igényfelmérő egyeztetés\n3. Végleges ajánlat és fejlesztési ütemterv átadása',
    ctaText: 'Projekt státuszának megtekintése',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Várom megtisztelő visszajelzésedet!',
    icon: '💬',
    accentColor: 'cyan',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:10:00.000Z',
    updatedAt: '2026-03-01T10:10:00.000Z'
  },
  {
    id: 'tpl-egyeztetes',
    name: 'Ajánlat egyeztetés',
    targetStatus: 'Ajánlat egyeztetése',
    subject: 'Ajánlat és specifikáció egyeztetése – {{projectName}} ({{requestId}})',
    preheader: 'A(z) {{projectName}} projekt specifikációja és ajánlata egyeztetés alatt áll.',
    introText: 'Kedves {{customerName}}!\n\nKöszönöm az eddigi konstruktív egyeztetést! A(z) „{{projectName}}” projekt jelenleg az ajánlat- és specifikáció-egyeztetési fázisban tart.',
    bodyContent: 'A megbeszéltek alapján pontosítottam a fő funkcionális modulokat, a felhasználói felület elvárásait és a javasolt fejlesztési mérföldköveket. Kérlek, tekintsd át az aktuális pontokat, és jelezd, ha bármelyik funkciót szeretnéd még kiegészíteni vagy módosítani.\n\nAjánlatkérés azonosító: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz üzenet: {{publicStatusMessage}}',
    nextStepsText: '1. Specifikáció és funkciólista jóváhagyása\n2. Mérföldkövek és ütemezés véglegesítése\n3. Projekt elfogadása és a fejlesztés elindítása',
    ctaText: 'Ajánlatkérés státuszának ellenőrzése',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Professzionális webes és szoftveres megoldások.',
    icon: '💰',
    accentColor: 'purple',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:15:00.000Z',
    updatedAt: '2026-03-01T10:15:00.000Z'
  },
  {
    id: 'tpl-elfogadva',
    name: 'Elfogadva',
    targetStatus: 'Elfogadva',
    subject: 'Projektajánlat elfogadva – Indul a(z) {{projectName}} előkészítése! ({{requestId}})',
    preheader: 'Örömmel visszaigazolom, hogy a(z) {{projectName}} projekt elfogadásra került.',
    introText: 'Kedves {{customerName}}!\n\nNagy örömmel igazolom vissza, hogy a(z) „{{projectName}}” projekt ajánlata és specifikációja véglegesítésre és elfogadásra került! Köszönöm a bizalmat.',
    bodyContent: 'Elkezdtem a fejlesztői környezet, a dizájnrendszer és az architektúra előkészítését. A megbeszélt mérföldkövek mentén haladunk, és minden fontosabb állomásnál részletes tájékoztatást fogsz kapni az előrehaladásról.\n\nAjánlatkérés azonosító: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz üzenet: {{publicStatusMessage}}',
    nextStepsText: '1. Projektstruktúra és UI/UX drótvázak felépítése\n2. Első fejlesztési sprint elindítása\n3. Folyamatos státuszkövetés a dedikált követőoldalon',
    ctaText: 'Projekt folyamatjelző megnyitása',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Örülök a közös munkának!',
    icon: '✅',
    accentColor: 'emerald',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:20:00.000Z',
    updatedAt: '2026-03-01T10:20:00.000Z'
  },
  {
    id: 'tpl-folyamatban',
    name: 'Projekt folyamatban',
    targetStatus: 'Folyamatban',
    subject: 'Fejlesztési státuszfrissítés – {{projectName}} ({{requestId}})',
    preheader: 'A(z) {{projectName}} projekt fejlesztése aktívan zajlik a stúdióban.',
    introText: 'Kedves {{customerName}}!\n\nSzeretnélek tájékoztatni, hogy a(z) „{{projectName}}” projekt fejlesztése aktívan folyamatban van a jóváhagyott specifikáció alapján.',
    bodyContent: 'Jelenleg a fő felhasználói felületi elemek, a reszponzív komponensek és a háttérlogika implementálásán dolgozom. A fejlesztés a tervezett ütemben halad, különös figyelmet fordítva a sebességre, a biztonságra és a modern megjelenésre.\n\nAjánlatkérés azonosító: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz üzenet: {{publicStatusMessage}}',
    nextStepsText: '1. Fő funkcionális modulok készre jelentése\n2. Belső minőségbiztosítás és tesztelési fázis\n3. Előzetes bemutató (demo) megosztása veled',
    ctaText: 'Fejlesztési státusz megtekintése',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Kövesd élőben a projekted állapotát.',
    icon: '🔨',
    accentColor: 'amber',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:25:00.000Z',
    updatedAt: '2026-03-01T10:25:00.000Z'
  },
  {
    id: 'tpl-teszteles',
    name: 'Tesztelés',
    targetStatus: 'Tesztelés',
    subject: 'Tesztelési és minőségbiztosítási fázis – {{projectName}} ({{requestId}})',
    preheader: 'A(z) {{projectName}} elkészült moduljai jelenleg tesztelés alatt állnak.',
    introText: 'Kedves {{customerName}}!\n\nJó hírrel jelentkezem: a(z) „{{projectName}}” projekt fejlesztési munkálatai elérkeztek a tesztelési és minőségbiztosítási (QA) szakaszba!',
    bodyContent: 'Jelenleg minden funkciót, űrlapot, reszponzív nézetet (mobil, tablet, asztali) és teljesítményparamétert alaposan ellenőrzök, hogy az átadáskor minden kifogástalanul és gördülékenyen működjön.\n\nAjánlatkérés azonosító: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz üzenet: {{publicStatusMessage}}',
    nextStepsText: '1. Reszponzív és böngésző-kompatibilitási tesztek lezárása\n2. Utolsó finomhangolások elvégzése\n3. Projekt készre jelentése és átadása',
    ctaText: 'Státusz ellenőrzése',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Minőség és precizitás minden részletben.',
    icon: '🧪',
    accentColor: 'cyan',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:30:00.000Z',
    updatedAt: '2026-03-01T10:30:00.000Z'
  },
  {
    id: 'tpl-elkeszult',
    name: 'Elkészült',
    targetStatus: 'Elkészült',
    subject: '🎉 Elkészült a projekted! – {{projectName}} ({{requestId}})',
    preheader: 'A(z) {{projectName}} projekt sikeresen elkészült és átadásra kész.',
    introText: 'Kedves {{customerName}}!\n\nÖrömmel értesítelek, hogy a(z) „{{projectName}}” projekt fejlesztése és tesztelése sikeresen befejeződött – a projekt elkészült!',
    bodyContent: 'Minden egyeztetett funkció, modern vizuális elem és reszponzív nézet a helyére került. Köszönöm az inspiráló együttműködést és a projekthez nyújtott visszajelzéseidet! Az átadási részletekkel és az élesítési információkkal kapcsolatban válaszolj erre az üzenetre.\n\nAjánlatkérés azonosító: {{requestId}}\nAktuális státusz: {{publicStatus}}\nStátusz üzenet: {{publicStatusMessage}}',
    nextStepsText: '1. Végső közös megtekintés és átvétel\n2. Élesítés / hozzáférések és dokumentáció átadása\n3. Sikeres projektindítás!',
    ctaText: 'Elkészült státusz megtekintése',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Köszönöm a bizalmat és sok sikert kívánok a projekthez!',
    icon: '🎉',
    accentColor: 'emerald',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:35:00.000Z',
    updatedAt: '2026-03-01T10:35:00.000Z'
  },
  {
    id: 'tpl-lezarva',
    name: 'Lezárva',
    targetStatus: 'Lezárva',
    subject: 'Projekt sikeresen lezárva – {{projectName}} ({{requestId}})',
    preheader: 'A(z) {{projectName}} ajánlatkérés és projekt adminisztratívan is lezárult.',
    introText: 'Kedves {{customerName}}!\n\nEzúton visszaigazolom, hogy a(z) „{{projectName}}” ({{requestId}}) projektet és a hozzá tartozó folyamatot sikeresen lezártuk.',
    bodyContent: 'Köszönöm, hogy a Horvát László – Web & Project Studio-t választottad! Amennyiben a jövőben további fejlesztésre, új funkciókra, karbantartásra vagy egy teljesen új digitális projektre lenne szükséged, bármikor számíthatsz rám.\n\nAjánlatkérés azonosító: {{requestId}}\nStátusz: {{publicStatus}}\nZáró üzenet: {{publicStatusMessage}}',
    nextStepsText: 'Ha a jövőben új ötleted vagy fejlesztési igényed merül fel, keress bizalommal a stúdió weboldalán keresztül!',
    ctaText: 'Web & Project Studio felkeresése',
    ctaLink: '{{websiteUrl}}',
    footerText: 'Horvát László – Web & Project Studio • Minden jót és további sok sikert kívánok!',
    icon: '📁',
    accentColor: 'slate',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:40:00.000Z',
    updatedAt: '2026-03-01T10:40:00.000Z'
  },
  {
    id: 'tpl-elutasitva',
    name: 'Elutasítva',
    targetStatus: 'Elutasítva',
    subject: 'Tájékoztatás az ajánlatkérésedről – {{projectName}} ({{requestId}})',
    preheader: 'Visszajelzés a(z) {{projectName}} projektmegkereséseddel kapcsolatban.',
    introText: 'Kedves {{customerName}}!\n\nKöszönöm szépen, hogy megkerestél a(z) „{{projectName}}” projekttel kapcsolatban, és megtiszteltél a bizalmaddal.',
    bodyContent: 'Alaposan áttekintettem a beküldött igényeket és a megvalósítási paramétereket. Sajnálattal kell tájékoztatnom, hogy jelenlegi fejlesztési kapacitásaim vagy a projekt specifikus jellege miatt most nem tudom vállalni a kivitelezést, mert minden projektemnél a maximális minőséget és figyelmet szeretném garantálni.\n\nAjánlatkérés azonosító: {{requestId}}\nStátusz: {{publicStatus}}\nTájékoztatás: {{publicStatusMessage}}',
    nextStepsText: 'Őszintén sok sikert kívánok a(z) „{{projectName}}” sikeres megvalósításához, és remélem, hogy egy jövőbeli projekt kapcsán lesz lehetőségünk együtt dolgozni!',
    ctaText: 'Státusz megtekintése',
    ctaLink: '{{websiteUrl}}/ajanlat-statusz?id={{requestId}}',
    footerText: 'Horvát László – Web & Project Studio • Köszönöm a megértésedet!',
    icon: '❌',
    accentColor: 'rose',
    active: true,
    isDefault: true,
    createdAt: '2026-03-01T10:45:00.000Z',
    updatedAt: '2026-03-01T10:45:00.000Z'
  }
];

export const INITIAL_STATUS_TEMPLATE_MAP: StatusTemplateMap = {
  'Új': 'tpl-uj',
  'Átnézés alatt': 'tpl-feldolgozas',
  'Kapcsolatfelvétel': 'tpl-kapcsolatfelvetel',
  'Ajánlat egyeztetése': 'tpl-egyeztetes',
  'Elfogadva': 'tpl-elfogadva',
  'Folyamatban': 'tpl-folyamatban',
  'Tesztelés': 'tpl-teszteles',
  'Elkészült': 'tpl-elkeszult',
  'Lezárva': 'tpl-lezarva',
  'Elutasítva': 'tpl-elutasitva'
};
