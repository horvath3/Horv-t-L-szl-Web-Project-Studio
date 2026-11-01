# Gmail API + OAuth 2.0 Beállítási Útmutató (SETUP.md)

Ez a dokumentáció részletesen bemutatja, hogyan működik a **Horvát László – Web & Project Studio** ingyenes, személyes `@gmail.com` fiókkal használható **Gmail API + OAuth 2.0** alapú e-mail küldési rendszere (saját üzleti domain vagy fizetős e-mail szolgáltató nélkül).

---

## 1. Google Cloud projekt létrehozása

1. Nyisd meg a [Google Cloud Console](https://console.cloud.google.com/) felületét egy személyes Google (`@gmail.com`) fiókkal.
2. A felső sávban kattints a projektválasztóra, majd az **Új projekt (New Project)** gombra (vagy használd az AI Studio által már előkészített projektet: `gen-lang-client-0218707766`).
3. Adj nevet a projektnek (pl. `Horvat-Laszlo-Studio-Mail`), majd kattints a **Create** gombra.

---

## 2. Gmail API engedélyezése

1. A Google Cloud Console bal oldali menüjében válaszd az **APIs & Services → Library** menüpontot.
2. A keresőmezőbe írd be: **Gmail API**.
3. Kattints a **Gmail API** találatra, majd nyomd meg az **Enable (Engedélyezés)** gombot.

---

## 3. OAuth Consent Screen beállítása

1. Lépj az **APIs & Services → OAuth consent screen** menüpontra.
2. Válaszd az **External** típust (személyes `@gmail.com` fiók esetén), majd kattints a **Create** gombra.
3. Add meg az alkalmazás alapadatait:
   - **App name:** `Horvát László – Web & Project Studio`
   - **User support email:** a saját `@gmail.com` címed
   - **Developer contact information:** a saját `@gmail.com` címed
4. A **Scopes (Jogosultságok)** lépésnél kattints az **Add or Remove Scopes** gombra, és add hozzá kizárólag az e-mail küldéshez szükséges jogosultságot:
   - `https://www.googleapis.com/auth/gmail.send` (*Send email on your behalf*)
5. A **Test users** részben add hozzá a saját személyes `@gmail.com` címedet, amellyel az e-maileket küldeni fogod.

---

## 4. OAuth Client létrehozása

1. Lépj az **APIs & Services → Credentials** menüpontra.
2. Kattints a **+ Create Credentials → OAuth client ID** gombra.
3. **Application type:** válaszd a **Web application** típust.
4. Adj neki nevet (pl. `Horvát László Studio Web Client`).

---

## 5. Szükséges Authorized JavaScript Origins és Redirect URI-k beállítása

Az OAuth 2.0 kliensnél add meg az alábbi URL-eket:

### Authorized JavaScript origins:
- Fejlesztői környezet:
  `https://ais-dev-pvnnlzhwud5ihuk7fc5ezz-26839429290.europe-west2.run.app`
- Megosztott / publikált környezet:
  `https://ais-pre-pvnnlzhwud5ihuk7fc5ezz-26839429290.europe-west2.run.app`
- Firebase Auth domain:
  `https://gen-lang-client-0218707766.firebaseapp.com`

### Authorized redirect URIs:
- `https://gen-lang-client-0218707766.firebaseapp.com/__/auth/handler`
- `https://ais-dev-pvnnlzhwud5ihuk7fc5ezz-26839429290.europe-west2.run.app/__/auth/handler`
- `https://ais-pre-pvnnlzhwud5ihuk7fc5ezz-26839429290.europe-west2.run.app/__/auth/handler`

*(Megjegyzés: Az AI Studio környezetben a `firebase-applet-config.json` már tartalmazza a felkonfigurált OAuth klienst és a `https://www.googleapis.com/auth/gmail.send` jogosultságot.)*

---

## 6. Szükséges Environment Változók (`.env`)

A szerveroldali működéshez az alábbi környezeti változók használhatók (lásd `.env.example`):

```env
# Gemini AI API kulcs (AI Studio automatikusan biztosítja)
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# Alkalmazás alap URL
APP_URL="https://ais-dev-pvnnlzhwud5ihuk7fc5ezz-26839429290.europe-west2.run.app"

# Szerveroldali AES-256-GCM titkosítási kulcs a munkamenet tokenek védelméhez
TOKEN_ENCRYPTION_SECRET="egyedi_32_bájt_hosszú_titkos_kulcs"
```

**Biztonsági elvek:**
- Soha nem kerül Gmail-jelszó, App Password vagy OAuth token `localStorage`-ba vagy `sessionStorage`-ba.
- A szerver (`server.ts`) a munkamenet tokent **AES-256-GCM** titkosítással tárolja a memóriában, és soha nem naplózza vagy küldi vissza a kliensnek.
- A `/api/gmail/send` végpont ellenőrzi az adminisztrátori jogosultságot, valamint azt, hogy a címzett e-mail cím pontosan megegyezik-e az adott ajánlatkéréshez (`ProjectRequest`) tartozó ügyfél e-mail címével.

---

## 7. Hogyan kell a Gmail-fiókot csatlakoztatni?

1. Jelentkezz be az admin felületre (`/admin`, alapértelmezett jelszó: `admin2026`).
2. Nyisd meg a bal oldali menüben a **Beállítások** (`/admin/beallitasok`) oldalt.
3. Legfelül, a **„Gmail kapcsolat”** szekcióban kattints a **„Kapcsolódás Gmailhez”** gombra.
4. A felugró Google OAuth 2.0 ablakban válaszd ki a személyes `@gmail.com` fiókodat, és pipáld be az **e-mail küldési jogosultságot** (`Send email on your behalf`).
5. Sikeres kapcsolódás után megjelenik:
   - **„✓ Gmail csatlakoztatva”**
   - **„Feladó: [a-te-cimed@gmail.com]”**

---

## 8. Hogyan lehet a kapcsolatot és az e-mail küldést tesztelni?

1. **Kapcsolat ellenőrzése:**
   - Az `Admin → Beállítások → Gmail kapcsolat` szekcióban kattints a **„Kapcsolat tesztelése”** gombra. A szerver ellenőrzi az OAuth 2.0 token érvényességét és a `gmail.send` jogosultságot.
   - A **„Teszt e-mail küldése saját címre”** gombbal (megerősítés után) valódi teszt e-mailt küldhetsz a saját csatlakoztatott Gmail-fiókodra.
2. **Kézi státusz-e-mail küldése:**
   - Nyisd meg az `Admin → Ajánlatkérések` (`/admin/ajanlatkeresek`) oldalt, majd kattints egy ajánlatkérésnél az **„E-mail küldése”** vagy a részletekben a **„📧 E-mail küldése a státuszról”** gombra.
   - Az előnézeti ablakban ellenőrizheted a dinamikus változókkal (`{{customerName}}`, `{{projectName}}`, `{{requestId}}`, `{{publicStatus}}`, stb.) kitöltött HTML e-mailt, majd a **„📧 E-mail küldése a státuszról (Gmail)”** gombbal (megerősítés után) közvetlenül elküldheted.
3. **Automatikus státusz-e-mail küldése:**
   - Az `Admin → Beállítások → Gmail kapcsolat` résznél kapcsold **BE** a globális **„Automatikus státusz-e-mailek engedélyezése”** kapcsolót (alapértelmezetten `KI`).
   - Nyisd meg egy ajánlatkérés részleteit (`Részletek`), kapcsold **BE** az **„Automatikus e-mail küldése”** kapcsolót, majd válts státuszt vagy kattints a **„Státusz mentése + Automatikus e-mail”** gombra.
   - A megerősítő ablak jóváhagyása után a rendszer elmenti az új státuszt, betölti a hozzá tartozó sablont, kitölti a változókat, elküldi az e-mailt a Gmail API-n keresztül, és rögzíti az eredményt (`Elküldve` vagy `Sikertelen` + hibaüzenet) az **E-mail előzményekben**.
