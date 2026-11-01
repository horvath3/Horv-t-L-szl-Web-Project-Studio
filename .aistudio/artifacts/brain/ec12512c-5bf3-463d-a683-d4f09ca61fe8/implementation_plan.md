# Élő Közvetítés Overlay, Szünet Képernyő & Visszaszámláló Időzítő

Professzionális, valós időben vezérelhető képernyőfelirat (HUD Overlay), szünet-/ebédszünet-képernyő és interaktív visszaszámláló időzítő Horváth László közvetítéseihez, amely adásmegszakítás nélkül azonnal szinkronizálódik a fix privát linken, az egyszeri rejtett linken és a nyilvános közvetítésen is.

> [!IMPORTANT]
> **Felhasználói döntések és áttekintés**
> - **Azonnali élő frissítés**: A felirat és a szünet mód adás közben, a képernyőmegosztás újbóli elindítása nélkül, másodpercen belüli késleltetéssel változtatható.
> - **Univerzális megjelenés**: Mind a három közvetítési nézetben (📌 Fix privát link, 🎲 Egyszeri rejtett link, 🌐 Publikus főoldali adás) azonnal és azonos módon jelenik meg.
> - **Választható szünet időzítő típusok**: Perc alapú visszaszámláló (pl. 5, 10, 15, 30 perc) és fix óra:perc visszatérési időpont (pl. „Visszatérés: 13:30”).

---

## 1. Áttekintés & Alapkoncepció

### Mit nyújt a funkció?
Az adminisztrációs felületen Horváth László adás közben bármikor ráírhat a közvetítés képernyőjére:
1. **Élő Munka Felirat (Live HUD Banner)**: Diszkrét, modern felirat a képernyő tetszőleges sarkában vagy alsó sávjában, amely a nézőknek mutatja a projekt aktuális fázisát (pl. *„SmartLogistics – Reszponzív menü kódolása”*).
2. **Szünet / Ebédszünet Képernyő (BRB / Break Screen)**: Amikor László elhagyja a gépet vagy szünetet tart, egyetlen kattintással aktiválhatja a szünet módot. Ekkor a videó felett elegáns stúdió grafika jelenik meg a megadott üzenettel és visszaszámlálóval, így a néző pontosan látja, mikor folytatódik a közvetítés.
3. **Gyors sablonok**: Előre beállított egykattintásos gyorsgombok a leggyakoribb helyzetekhez:
   - ☕ *„Rövid technikai szünet (5 perc)”*
   - 🍽️ *„Ebédszünet (Visszatérés: 13:30 vagy 30 perc)”*
   - 💻 *„Aktív munka – Komponensek fejlesztése”*
   - 💬 *„Kérdésed van? Írj az Ajánlatkérés menüben!”*

### Célközönség & Munkafolyamat
- **Megbízók és ügyfelek**: Látják, hogy László éppen melyik részfeladaton dolgozik, szünet esetén pedig nem hiszik azt, hogy lefagyott a közvetítés vagy véget ért az adás.
- **Közvetítői élmény**: Egyetlen kattintással, kényelmesen vezérelhető közvetlenül a stúdió admin felületéről.

---

## 2. Felhasználói Élmény & Vizualitás

### Admin Vezérlőpult (LiveStreamBroadcasterCard)
Az adminisztrációs felület stúdiókártyáján egy új **„Élő Felirat & Szünet Képernyő Vezérlő”** modul kap helyet:
- **Üzemmód kapcsoló**:
  - `Munka fókusz felirat (HUD)`: Diszkrét felirat a képernyőn a munkavégzés közben.
  - `Szünet / Ebédszünet (Break)`: Fókuszált szünet képernyő visszaszámlálóval és visszatérési időponttal.
- **Időzítő beállítások szünet módban**:
  - *Visszaszámláló (Timer)*: `+5 perc`, `+10 perc`, `+15 perc`, `+30 perc` gombokkal, vagy kézzel beírható percekkel.
  - *Pontos időpont*: Pl. „13:30” kiválasztása.
- **Szövegmező és egyéni üzenet**: Tetszőleges egyedi szöveg megadása.
- **Pozíció választó HUD módban**: Bal felső, Jobb felső, Bal alsó, Jobb alsó vagy Alsó futósáv.
- **Valós idejű szinkron**: Gombnyomásra azonnal élesedik a nézőknél újratöltés nélkül.

### Nézői Élmény (LiveStreamPlayer & PrivateStreamView)
- **HUD módban**:
  - A videó sarkában elegáns, sötét üveghatású (backdrop blur) kártyán olvasható az üzenet, tűéles betűkkel, nem fedve el a megosztott kódolási munkaterületet.
- **Szünet / Ebédszünet módban**:
  - A képernyő felett egy lágyan áttetsző, professzionális sötét overlay réteg aktiválódik finom pulzáló fénnyel.
  - Középen nagy, jól olvasható formátumban megjelenik:
    - Státusz ikon és felirat (pl. 🍽️ *„Ebédszünet”* vagy ☕ *„Rövid szünet”*).
    - Fő üzenet (pl. *„Hamarosan visszatérek, a közvetítés hamarosan folytatódik!”*).
    - **Valós idejű számláló**: Másodpercenként csökkenő élő visszaszámláló (pl. `14:28 hátralévő idő`) és/vagy fix visszatérési óra (`Visszatérés: 13:30-kor`).
  - Amikor az időzítő eléri a 00:00-t, automatikusan kiírja: *„A közvetítés mindjárt folytatódik...”*.

---

## 3. Kulcsfontosságú Termékdöntések & Kompromisszumok

| Szempont | Választott Megoldás | Miért ezt választjuk? | Alternatívák |
| :--- | :--- | :--- | :--- |
| **Megjelenítés módja** | **Kliensoldali dinamikus Live HUD réteg** | Kristálytiszta 1080p felbontású marad a betűméret és az óra, 0 processzorterhelés a streamer gépén, azonnali élő módosíthatóság | Canvas-be égetett videó (tömörítéskor elmosódna a betű, terhelné a CPU-t) |
| **Szinkronizáció** | **Szerveroldali szignálozás + SSE / Polling** | Azonnal, újratöltés nélkül megjelenik minden nézőnél másodpercen belül | Kézi oldalfrissítés kérése a nézőktől (rossz élmény) |
| **Állapotmegőrzés** | **`liveStreamState.overlay` a szerveren** | Az adáshoz újonnan csatlakozó nézők azonnal látják a szünetet vagy a feliratot, függetlenül attól, mikor nyitották meg a linket | Csak lokális állapot (az új nézők nem látnák az időzítőt) |

---

## 4. Rendszerarchitektúra & Adatáramlás

```
┌───────────────────────────────────────────────────────────┐
│                      ADMIN FELÜLET                        │
│             LiveStreamBroadcasterCard.tsx                 │
│  - Szöveg & Mód választó (HUD / Szünet / Ebédszünet)      │
│  - Időzítő beállító (+5p, +15p, visszatérési időpont)     │
│  - Pozíció & Stílus kapcsoló                              │
└─────────────────────────────┬─────────────────────────────┘
                              │
                  POST /api/live-stream/overlay
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                    NODE.JS SZERVER                        │
│                       server.ts                           │
│  - liveStreamState.overlay állapot tárolása               │
│  - SSE szignál kiküldése minden aktív nézőnek             │
│  - GET /api/live-stream/status kiszolgálása új nézőknek   │
└─────────────────────────────┬─────────────────────────────┘
                              │
              Valós idejű szignálcsatorna
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│    FIX & EGYSZERI LINK      │   │    PUBLIKUS KÖZVETÍTÉS      │
│   PrivateStreamView.tsx     │   │     LiveStreamPlayer.tsx    │
│  - LiveStreamOverlay        │   │  - LiveStreamOverlay        │
│  - Visszaszámláló motor     │   │  - Visszaszámláló motor     │
└─────────────────────────────┘   └─────────────────────────────┘
```

### Overlay Adatmodell
```typescript
interface StreamOverlayConfig {
  enabled: boolean;
  mode: 'hud' | 'break';          // HUD felirat vagy teljes Szünet képernyő
  badgeText: string;              // Pl. "FÓKUSZ", "EBÉDSZÜNET", "SZÜNET"
  title: string;                  // Fő cím / feladat leírása
  subtitle?: string;              // Kiegészítő leírás
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-bar';
  timerType?: 'countdown' | 'target-time' | 'none';
  targetTimestamp?: number;       // Visszatérési Unix időbélyeg (ms)
  targetTimeDisplay?: string;     // Pl. "13:30"
}
```

---

## 5. Ellenőrzési és Tesztelési Terv

1. **Overlay aktiválása HUD módban**:
   - Szöveg beírása és mentése az adminban.
   - Ellenőrzés: Azonnal megjelenik a videón a megadott sarokban, éles betűkkel.
2. **Szünet / Ebédszünet mód időzítővel**:
   - Szünet mód aktiválása 15 perces visszaszámlálóval vagy 13:30 fix időponttal.
   - Ellenőrzés: A képernyőn lágy sötétítés, középen az animált szünet panel és a másodpercenként csökkenő számláló.
3. **Többcsatornás működés**:
   - Tesztelés a **fix privát linken** (`/privat-elo/{fix_kulcs}`).
   - Tesztelés az **egyszeri rejtett linken**.
   - Tesztelés a **főoldali publikus közvetítésen** (`/elo-munka`).
4. **Build & Lint**:
   - `compile_applet` és `lint_applet` sikeres lefutásának ellenőrzése.
