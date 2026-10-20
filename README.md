New Neptun PowerUp (NNPU)
========================

> **Manifest V3 böngészőbővítmény** az Angular-alapú Neptun felülethez.

Az NNPU egy cross-browser (Chrome + Firefox) böngészőbővítmény, amely az egyetemek/főiskolák Neptun tanulmányi rendszeréhez nyújt vizuális és funkcionális kiegészítéseket. A projekt az eredeti [Neptun PowerUp!](https://github.com/solymosi/npu) szellemi utódja, újraírva a Manifest V3 szabvány szerint.

---

## Aktív funkciók

| Funkció | Leírás |
|---|---|
| 🌙 Sötét mód | Teljes körű, kapcsolható sötét téma a login és a dashboard oldalon |
| 🔘 Témaváltó gomb | Perzisztens sötét/világos váltó – az állapot a böngésző localStorage-ében mentődik |
| ⏳ SPA betöltés-figyelés | MutationObserver-alapú várakozás az Angular komponensek renderelésére |
| 🛟 Betöltési helyreállítás | Ha az oldal beragad a "Tartalom betöltése" állapotban, az NNPU automatikusan visszanavigál a gyökéroldalra |

---

## Telepítés

### Firefox

1. Töltsd le vagy klónozd ezt a repót a gépedre.
2. Nyisd meg a Firefoxot, és írd be a címsorba: `about:debugging#/runtime/this-firefox`
3. Kattints az **Ideiglenes kiegészítő betöltése…** ("Load Temporary Add-on…") gombra.
4. A megjelenő fájlválasztóban navigálj a projekt mappájába, és válaszd ki a **manifest.json** fájlt.
5. A bővítmény azonnal betöltődik. Nyisd meg a Neptun-t, és használd egészséggel.

> **Megjegyzés:** Az ideiglenes kiegészítők a Firefox újraindításakor eltűnnek. Amíg az NNPU nem kerül fel az AMO (addons.mozilla.org) áruházba, minden Firefox-indítás után újra be kell tölteni.

### Firefox: hogyan ne kelljen minden újraindítás után újratölteni?

Ez fontos korlátozás Firefoxon:

- A sima (stable) Firefoxban az unsigned (nem aláírt) bővítmények csak ideiglenesen tölthetők be.
- Tartós telepítéshez aláírt bővítmény (XPI) kell.

Lehetőségek:

1. AMO kiadás (ajánlott): ha az NNPU felkerül addons.mozilla.org-ra, normál módon telepíthető lesz, és újraindítás után is megmarad.
2. Saját aláírt XPI: `web-ext sign` használatával aláírható csomag készül, amit tartósan telepíthetsz.
3. Fejlesztői környezet: Firefox Developer Edition / Nightly alatt kikapcsolható az aláírás-követelmény (`xpinstall.signatures.required = false`), így az unsigned XPI is tartósan fennmaradhat.

Gyors build parancs XPI-hez:

```bash
npm install
npx web-ext build --source-dir . --artifacts-dir web-ext-artifacts
```

Ez egy csomagolt `.xpi` fájlt készít a `web-ext-artifacts` mappába.

### Google Chrome / Chromium

1. Töltsd le vagy klónozd ezt a repót a gépedre.
2. Nyisd meg a Chrome-ot, és írd be a címsorba: `chrome://extensions`
3. Kapcsold be a jobb felső sarokban a **Fejlesztői módot** ("Developer mode").
4. Kattints a **Kicsomagolt bővítmény betöltése…** ("Load unpacked") gombra.
5. A megjelenő mappában válaszd ki a projekt gyökérmappáját (ahol a `manifest.json` található).
6. A bővítmény megjelenik a listában. Nyisd meg a Neptun-t, és használd egészséggel.

> **Tipp:** Módosítás után kattints a bővítmény kártyáján a 🔄 frissítés ikonra, hogy az új kód betöltődjön.

> **Technikai megjegyzés (Firefox kompatibilitás):** A Firefox nem fogad el olyan mintát, mint `*://*neptun*/*` a `matches` mezőben. Ezért a bővítmény `"<all_urls>"` mintát használ, de a `content.js` azonnal kilép, ha a domain nem tartalmazza a `neptun` szót.

---

## Ikon testreszabása

Az NNPU manifest.json fájlja tartalmaz egy `icons` mezőt, amellyel a bővítmény ikonja megváltoztatható.

### Lépések

1. Készíts PNG ikonokat az alábbi méretekben, és helyezd őket egy `icons/` mappába a projekt gyökerében:

   ```
   icons/
     icon-16.png    (16×16 px – toolbar ikon)
     icon-48.png    (48×48 px – bővítménykezelő lista)
     icon-128.png   (128×128 px – Chrome Web Store / telepítési képernyő)
   ```

2. Szerkeszd a `manifest.json` fájlt – add hozzá vagy módosítsd az `icons` mezőt:

   ```json
   "icons": {
     "16": "icons/icon-16.png",
     "48": "icons/icon-48.png",
     "128": "icons/icon-128.png"
   }
   ```

3. Töltsd újra a bővítményt a böngészőben (Chrome: 🔄 ikon; Firefox: "Újratöltés" / "Reload").

> **Támogatott formátumok:** PNG (átlátszó háttérrel ajánlott). SVG közvetlenül nem támogatott a manifest `icons` mezőben, de az `action.default_icon` mezőben igen Chrome-on.

---

## Roadmap

Az alábbiakban azok a tervezett fejlesztések szerepelnek, amelyek az Angular-alapú Neptun felület teljes körű támogatásához szükségesek.

### Alapvető javítások

- [ ] **Munkamenet-kezelés** – `GetNewTokens` API végpont automatikus, háttérben futó meghívása a 10 perces session-timeout és 401-es hibák megelőzésére.
- [ ] **Tördelés feloldása** – A szerver oldali fix 10 elemre korlátozott lapozás kijátszása: az összes oldal automatikus lekérése és egyetlen listában való megjelenítése.
- [ ] **Szerverkapacitás-figyelés** – Szabad helyek monitorozása és automatikus terheléselosztás.

### Automatizálás

- [ ] **Automatikus bejelentkezés & 2FA** – Az Angular login automatizálása, beleértve a kétfaktoros hitelesítés megkerülését.
- [ ] **1 kattintásos tárgyfelvétel** – A `SubjectSignin` végpont automatikus meghívása az eltárolt kurzusokra.

### Felhasználói felület

- [ ] **Órarend-tervező takarítás** – Nem kiválasztott kurzusok automatikus elrejtése.
- [ ] **Főmenü optimalizálás** – Kedvenc menüpontok kiemelése a navigációs sávba.
- [x] **🌙 Sötét mód** – Teljes körű, kapcsolható sötét téma a login és dashboard oldalon.

---


## Közreműködők

Köszönet az alábbi fejlesztőknek:

| Név | Hozzájárulás |
|---|---|
| [solymosi](https://github.com/solymosi) | Az eredeti Neptun PowerUp! projekt létrehozása és karbantartása (2011–2024) |
| Whisperity | Vizsgajelentkezés, félévválasztó, Firefox-javítások |
| FeaXR | Automatikus átirányítás, fejléc-eltüntetés, vizsgaelrejtés |
| nyuszika7h | Kérdőív-felugró elrejtés |
| MSZGs | ELTE Neptun kompatibilitás |

---

## Licensz

A projektre az **[MIT License](http://opensource.org/licenses/MIT)** feltételei vonatkoznak.

## Adatvédelmi nyilatkozat

A bővítmény **nem továbbít személyes adatokat külső szerverre**. Minden adatfeldolgozás kizárólag a böngésződben, a saját gépeden történik. A `storage` jogosultság kizárólag a témabeállítás (sötét/világos mód) mentéséhez szükséges.
