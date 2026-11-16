# Matyáš Galda — concept art portfolio

A static, multi-page portfolio: a homepage (hero, Selected work, About, CV, Contact) and three project pages (Last Breath, Forgotten Realms, Ferrugo). No framework, backend, database or analytics. A small Node build script turns the JSON content into HTML and prepares responsive images.

Version 7 follows the approved four-view visualization in `reference/approved-four-view-visualization.png`. It retains the paper edge and project navigation fixes, clears the old arm residue, and gives the sleeve attachment a crisp traced fabric edge. The 27-pose drawing gesture is unchanged. See `CHANGELOG.md` for earlier changes.

## Run it locally

Requires Node.js 18.17 or newer.

```bash
npm install          # installs sharp (image processing), the only dependency
npm run build        # writes the deployable site to dist/
npm run serve        # http://localhost:8080/
npm run publish:root # build, then copy dist/ to the repository root for GitHub Pages
```

To check that it also works in a subdirectory, as it will on studentifmk.work:

```bash
node tools/serve.mjs dist 8080 /matyas-galda/   # http://localhost:8080/matyas-galda/
```

`npm run build` also validates `portfolio.json` (exact keys, types, bio ≤ 180 characters, portrait files present) and checks that every file the pages reference exists. It exits with an error if anything fails.

## Deploy

All links and asset paths are relative, so `dist/` works at a domain root or in any subfolder. Project pages are plain files (`last-breath.html` and so on), so direct loading and refresh work on any static host without rewrite rules.

**This repository** publishes the built site from the repository root (Settings → Pages → Deploy from a branch → `main` → `/ (root)`). After any change, run `npm run publish:root` inside `source/`: it builds `dist/` and copies it to the root, replacing only the generated files. Then commit and push.

**Elsewhere:** upload the *contents* of `dist/` (including `.nojekyll`) to any static host.

### After the first deployment

1. Set `portfolioUrl` in `public/portfolio.json` to the exact public HTTPS address including any subpath, e.g. `"https://studentifmk.work/matyas-galda/"`. Rebuild and redeploy.
2. Check that the manifest returns JSON, not an HTML fallback page:
   `curl -sI https://studentifmk.work/matyas-galda/portfolio.json` should show `content-type: application/json`.

## Where to edit

| What | File |
| --- | --- |
| Projects: order, titles, copy, details, image order, captions, alt text, crops, links | `src/data/projects.json` |
| Headline, intro, About, CV, contact | `src/data/site.json` |
| Website hero loop and still | `src/assets/hero/hero-drawing-30fps.mp4`, `src/assets/hero/hero-still.webp` |
| Four original hero key images retained for reference | `src/assets/hero/frame-01.png` to `frame-04.png` |
| Homepage thumbnails for Last Breath and Forgotten Realms | `card.cover` in `src/data/projects.json` → `src/assets/covers/` |
| FMK gallery manifest (also supplies the site name) | `public/portfolio.json` |
| Styles / behaviour | `src/css/site.css`, `src/js/site.js` |
| Page templates and build | `build.mjs` |

Original project images live in `src/assets/projects/`. The build makes WebP versions at 480–2000 px into `dist/assets/img/`; originals are never modified. The black letterbox bars on two Last Breath images are cropped at build time via `crop` in `projects.json`.

The two parchment covers in `src/assets/covers/` are homepage thumbnail treatments of Matyáš's own art. Detail pages always show the original artwork. Ferrugo's thumbnail is the real gameplay screenshot on a paper mount, not recoloured. Covers are copied to `dist/assets/covers/` with 640, 1000 and 1400 px versions alongside.

### Paper system

| File in `src/assets/texture/` | Used for |
| --- | --- |
| `page-parchment-tile.webp` | Grain across every sheet. Made seamless from the supplied `page-parchment.webp` by `tools/make-seamless-parchment.py`; re-run only if the source changes. |
| `hero-panel.webp` | Source panel baked into the 30 fps hero video and still |
| `media-mount.webp` | Paper mat under artwork (its orange outer band is cropped off in CSS) |
| `edge-top/bottom/left/right.png` | Earlier edge-strip sources, now unused because their corners doubled and covered content |
| `page-parchment.webp`, `sheet-edge-overlay.png` | Supplied sources, kept for reference and not shipped |

### Shared fields (single source of truth)

- `name` is read from `public/portfolio.json` and used for the header, titles and footer.
- `studyProgram` ("Ateliér Game Design") and the Czech `bio` exist only for the gallery. The site's English copy in `site.json` describes the same studies in its own words, so **those stay duplicated**: if the study details change, update both files.

## FMK student gallery

`public/portfolio.json` is copied unchanged to the site root, next to `index.html`. Its portrait paths are relative (no leading slash) and resolve to `assets/fmk/portrait-original.jpg` and `assets/fmk/portrait-stamp.png`, which live in `public/assets/fmk/` so they survive every rebuild. The stamp is not shown on the site. The gallery assigns the card number; this site does not.

## Selected work carousel

The homepage work list is a horizontal scroll-snap track (`.work-track` in `site.css`):
- two modules in view on desktop (980 px and up)
- one module with the next peeking on tablet and phones

`site.js` adds previous/next buttons, a "1–2 / 3" counter and a polite screen-reader status. It only calls `scrollBy`, so swiping, trackpad scrolling and tabbing into a card all move the same native scroller. There is no autoplay. Without JavaScript the row is a plain horizontal scroller. Adding a project to `projects.json` adds a slide automatically.

## Hero animation

The hero is a 768 × 512, 9.6-second MP4 at 30 fps with 288 presentation frames and **27 distinct poses**. One supplied whole drawing remains fixed; its hand, pencil and forearm are cut out and repositioned in small rigid steps. The old position is cleared before compositing and the original sleeve overlays the attachment point with a traced, solid fabric boundary. The gesture moves down, left, right, makes small drawing strokes, and lifts, then repeats. Every moving step lasts 100 ms. The page, head, body and panel stay fixed. No optical flow, morph or crossfade is used. Frame timing is documented in `reference/hero-stopmotion-timing.json`; the separate pack contains the clean plate, isolated arm, poses, source process and all 288 frames. A still WebP appears immediately. JavaScript loads the video only when motion is allowed, pauses it off screen or in a hidden tab, and leaves the still visible if playback fails. With `prefers-reduced-motion: reduce`, only the still is displayed. Finer wrist and finger articulation would require additional aligned drawings.

## Privacy

The CV was used only for study details, skills and languages. No address, phone number, date of birth or other personal CV fields appear anywhere in the site, its metadata or its files. Contact is limited to the email address and the public Instagram and ArtStation profiles.

## Credits and licences

- Fonts, all self-hosted under the SIL Open Font License (texts in `src/fonts/`):
  - Marck Script: headline
  - Caveat SemiBold: name, navigation, titles and labels
  - EB Garamond: body text
- Ferrugo description and images come from the official FMK UTB showcase page, linked on the Ferrugo page.
- The hero figure is supplied illustrative art of a fictional artist, not a portrait of Matyáš.
- The parchment, hero panel, mount, edge strips, homepage covers and the four hero frames are supplied visual assets (see `reference/ASSET_MAP.md`).
