# Claude: ostrý okraj rukávu, zachovat pohyb ruky

Použij `Matyas-Galda-portfolio-v7-crisp-sleeve.zip` jako aktuální zdroj webu. Samostatný `Matyas-Galda-hero-v7-stopmotion-pack.zip` obsahuje 27 póz, všech 288 snímků, čistý podklad, výřez ruky, časování a skript pro reprodukci. V tomto zdrojovém ZIPu je již video i statický snímek opravený.

## Jediná vizuální změna oproti v6

Horní okraj látky u napojení pohybujícího se předloktí na rukáv už nepřechází do papírového pozadí rozostřeným pruhem. Je vyříznutý podle kontury původního materiálu a má pevný, téměř ostrý okraj s antialiasingem zhruba jednoho pixelu. Nesmí se pod něj vrátit původní statická ruka. Nedávej na spoj `filter: blur`, `mask-image` s gradientem, crossfade ani další průhlednou vrstvu. Papírový panel je již součástí videa.

## Co zachovat

- Původní stop-motion gesto **dolů → doleva → doprava → krátké tahy → nahoru**, dvakrát za smyčku. Soubor má 768 × 512 px, 9,6 s, 30 fps, 288 prezentačních snímků z 27 různých pevných póz. Každá pohybová poloha trvá 100 ms. Neměň rychlost, trasu ani měřítko ruky.
- Skicák, kresba, hlava, tělo a papír se nehýbou. Nepoužívej optical flow, morph ani interpolaci celé ilustrace.
- `src/assets/hero/hero-drawing-30fps.mp4` přehrávej jako jediný tichý `muted playsinline loop` soubor. `hero-still.webp` je úvodní a reduced-motion fallback. Video pauzni mimo obrazovku a v neaktivní záložce.
- Zachovej všechny projekty Last Breath, Forgotten Realms a Ferrugo, CV, kontakty, FMK manifest, opravené rohy papíru a odsazení `Next project`.

## Kontrola

Spusť `npm ci && npm run build`. Na mobilu zkontroluj detail rukávu v klidové poloze, při pohybu dolů, během tahu do stran a při návratu ruky nahoru. Okraj má být součástí látky, bez měkkého oblaku, druhého předloktí, dvojité tužky nebo tvrdé čáry odříznuté mimo obrys rukávu. Zkontroluj také statický snímek při `prefers-reduced-motion: reduce`. Vrať krátký záznam celé smyčky.
